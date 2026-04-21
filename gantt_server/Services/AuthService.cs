using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
    private static readonly TimeSpan VerificationLifetime = TimeSpan.FromHours(24);
    private static readonly TimeSpan PendingRetention = TimeSpan.FromDays(3);

    private readonly AppDbContext _db;
    private readonly IPasswordHasher<Student> _hasher;
    private readonly JwtOptions _jwt;
    private readonly EmailOptions _emailOptions;
    private readonly IEmailService _emailService;

    public AuthService(
        AppDbContext db,
        IOptions<JwtOptions> jwt,
        IOptions<EmailOptions> emailOptions,
        IEmailService emailService)
    {
        _db = db;
        _hasher = new PasswordHasher<Student>();
        _jwt = jwt.Value;
        _emailOptions = emailOptions.Value;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> RegisterAsync(AuthRegisterDto dto, CancellationToken ct)
    {
        await CleanupExpiredPendingRegistrationsAsync(ct);

        var normalizedEmail = StudentMappings.NormalizeEmail(dto.Email);

        if (await _db.Students.AnyAsync(s => s.Email == normalizedEmail, ct))
            throw new InvalidOperationException("Пользователь с такой почтой уже существует");

        var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(r => r.Email == normalizedEmail, ct);

        if (pending is null)
        {
            pending = new PendingRegistration
            {
                FirstName = dto.Name.Trim(),
                LastName = dto.LastName.Trim(),
                Email = normalizedEmail,
                CreatedAt = DateTime.UtcNow,
                VerificationToken = GenerateVerificationToken()
            };

            _db.PendingRegistrations.Add(pending);
        }
        else
        {
            pending.FirstName = dto.Name.Trim();
            pending.LastName = dto.LastName.Trim();
            pending.CreatedAt = DateTime.UtcNow;
            pending.VerificationToken = GenerateVerificationToken();
        }

        var tempStudent = new Student
        {
            FirstName = pending.FirstName,
            LastName = pending.LastName,
            Email = pending.Email,
            EmailConfirmed = false
        };

        pending.PasswordHash = _hasher.HashPassword(tempStudent, dto.Password);
        pending.VerificationTokenExpiresAt = DateTime.UtcNow.Add(VerificationLifetime);

        await _db.SaveChangesAsync(ct);

        var verificationLink = BuildConfirmationLink(pending);
        await _emailService.SendEmailConfirmationAsync(pending.Email, $"{pending.FirstName} {pending.LastName}".Trim(), verificationLink, ct);

        return new AuthResponseDto
        {
            RequiresEmailConfirmation = true,
            Message = "Проверьте почту и подтвердите регистрацию. До подтверждения аккаунт не будет создан."
        };
    }

    public async Task<AuthResponseDto> LoginAsync(AuthLoginDto dto, CancellationToken ct)
    {
        var email = StudentMappings.NormalizeEmail(dto.Email);
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Email == email, ct)
            ?? throw new InvalidOperationException("Неправильно введены данные");

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

    public async Task ConfirmEmailAsync(ConfirmEmailDto dto, CancellationToken ct)
    {
        await CleanupExpiredPendingRegistrationsAsync(ct);

        var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(r => r.Id == dto.RegistrationId, ct)
            ?? throw new InvalidOperationException("Заявка на регистрацию не найдена");

        if (pending.VerificationToken != dto.Token)
            throw new InvalidOperationException("Неверный токен подтверждения");

        if (pending.VerificationTokenExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Ссылка подтверждения истекла");

        if (await _db.Students.AnyAsync(s => s.Email == pending.Email, ct))
        {
            _db.PendingRegistrations.Remove(pending);
            await _db.SaveChangesAsync(ct);
            throw new InvalidOperationException("Пользователь с такой почтой уже существует");
        }

        var student = new Student
        {
            Id = Guid.NewGuid(),
            FirstName = pending.FirstName,
            LastName = pending.LastName,
            Email = pending.Email,
            PasswordHash = pending.PasswordHash,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Students.Add(student);
        _db.PendingRegistrations.Remove(pending);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AuthResponseDto> ResendConfirmationAsync(ResendConfirmationDto dto, CancellationToken ct)
    {
        await CleanupExpiredPendingRegistrationsAsync(ct);

        var email = StudentMappings.NormalizeEmail(dto.Email);

        if (await _db.Students.AnyAsync(s => s.Email == email, ct))
        {
            return new AuthResponseDto
            {
                Message = "Почта уже подтверждена."
            };
        }

        var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(r => r.Email == email, ct)
            ?? throw new InvalidOperationException("Заявка на подтверждение не найдена");

        pending.VerificationToken = GenerateVerificationToken();
        pending.VerificationTokenExpiresAt = DateTime.UtcNow.Add(VerificationLifetime);
        await _db.SaveChangesAsync(ct);

        var verificationLink = BuildConfirmationLink(pending);
        await _emailService.SendEmailConfirmationAsync(pending.Email, $"{pending.FirstName} {pending.LastName}".Trim(), verificationLink, ct);

        return new AuthResponseDto
        {
            RequiresEmailConfirmation = true,
            Message = "Письмо с подтверждением отправлено повторно."
        };
    }

    private async Task CleanupExpiredPendingRegistrationsAsync(CancellationToken ct)
    {
        var threshold = DateTime.UtcNow.Subtract(PendingRetention);
        var stale = await _db.PendingRegistrations
            .Where(r => r.VerificationTokenExpiresAt < DateTime.UtcNow || r.CreatedAt < threshold)
            .ToListAsync(ct);

        if (stale.Count == 0)
            return;

        _db.PendingRegistrations.RemoveRange(stale);

        await _db.SaveChangesAsync(ct);
    }

    private static string GenerateVerificationToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

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
