using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using gantt_server.Data;
using gantt_server.Dtos.AuthDtos;
using gantt_server.Mappings;
using gantt_server.Models;
using gantt_server.Options;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

public sealed class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<Student> _hasher;
    private readonly JwtOptions _jwt;
    private readonly EmailOptions _emailOptions;
    private readonly IEmailService _emailService;
    private readonly IPendingRegistrationService _pendingRegistrations;
    private readonly ITelegramApprovalService _telegramApprovalService;

    public AuthService(
        AppDbContext db,
        IOptions<JwtOptions> jwt,
        IOptions<EmailOptions> emailOptions,
        IEmailService emailService,
        IPendingRegistrationService pendingRegistrations,
        ITelegramApprovalService telegramApprovalService)
    {
        _db = db;
        _hasher = new PasswordHasher<Student>();
        _jwt = jwt.Value;
        _emailOptions = emailOptions.Value;
        _emailService = emailService;
        _pendingRegistrations = pendingRegistrations;
        _telegramApprovalService = telegramApprovalService;
    }

    public async Task<AuthResponseDto> RegisterAsync(AuthRegisterDto dto, CancellationToken ct)
    {
        await _pendingRegistrations.CleanupExpiredAsync(ct);
        var pending = await _pendingRegistrations.CreateOrUpdateAsync(dto, ct);

        if (_telegramApprovalService.IsEnabled)
        {
            await _telegramApprovalService.SendPendingRegistrationAsync(pending, ct);
            return new AuthResponseDto
            {
                RequiresEmailConfirmation = false,
                Message = "Заявка отправлена администратору на подтверждение."
            };
        }

        var verificationLink = BuildConfirmationLink(pending);
        await _emailService.SendEmailConfirmationAsync(
            pending.Email,
            $"{pending.FirstName} {pending.LastName}".Trim(),
            verificationLink,
            ct);

        return new AuthResponseDto
        {
            RequiresEmailConfirmation = true,
            Message = "Проверьте почту и подтвердите регистрацию. До подтверждения аккаунт не будет создан."
        };
    }

    public async Task<AuthResponseDto> LoginAsync(AuthLoginDto dto, CancellationToken ct)
    {
        var email = StudentMappings.NormalizeEmail(dto.Email);
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Email == email, ct);

        if (student is null)
        {
            if (_telegramApprovalService.IsEnabled && await _pendingRegistrations.GetByEmailAsync(email, ct) is not null)
                throw new InvalidOperationException("Заявка ещё не подтверждена администратором");

            throw new InvalidOperationException("Неправильно введены данные");
        }

        var result = _hasher.VerifyHashedPassword(student, student.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new InvalidOperationException("Неправильно введены данные");

        if (!student.EmailConfirmed)
            throw new InvalidOperationException("Сначала подтвердите почту");

        var token = CreateToken(student);

        return new AuthResponseDto
        {
            Token = token,
            Student = student.ToAuthStudentDto()
        };
    }

    public Task ConfirmEmailAsync(ConfirmEmailDto dto, CancellationToken ct) =>
        _pendingRegistrations.ApproveAsync(dto.RegistrationId, dto.Token, ct);

    public async Task<AuthResponseDto> ResendConfirmationAsync(ResendConfirmationDto dto, CancellationToken ct)
    {
        await _pendingRegistrations.CleanupExpiredAsync(ct);

        var email = StudentMappings.NormalizeEmail(dto.Email);
        if (await _db.Students.AnyAsync(s => s.Email == email, ct))
        {
            return new AuthResponseDto
            {
                Message = "Почта уже подтверждена."
            };
        }

        var pending = await _pendingRegistrations.RefreshConfirmationAsync(email, ct)
            ?? throw new InvalidOperationException("Заявка уже подтверждена");

        if (_telegramApprovalService.IsEnabled)
        {
            await _telegramApprovalService.SendPendingRegistrationAsync(pending, ct);
            return new AuthResponseDto
            {
                RequiresEmailConfirmation = false,
                Message = "Запрос повторно отправлен администратору."
            };
        }

        var verificationLink = BuildConfirmationLink(pending);
        await _emailService.SendEmailConfirmationAsync(
            pending.Email,
            $"{pending.FirstName} {pending.LastName}".Trim(),
            verificationLink,
            ct);

        return new AuthResponseDto
        {
            RequiresEmailConfirmation = true,
            Message = "Письмо с подтверждением отправлено повторно."
        };
    }

    private string BuildConfirmationLink(PendingRegistration pending)
    {
        var baseUrl = string.IsNullOrWhiteSpace(_emailOptions.ConfirmationBaseUrl)
            ? "http://localhost:5183/api/auth/confirm-email"
            : _emailOptions.ConfirmationBaseUrl.TrimEnd('/');

        return $"{baseUrl}?registrationId={pending.Id}&token={Uri.EscapeDataString(pending.VerificationToken)}";
    }

    private string CreateToken(Student student)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, student.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, student.Email),
            new("name", $"{student.FirstName} {student.LastName}".Trim())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.LifetimeMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
