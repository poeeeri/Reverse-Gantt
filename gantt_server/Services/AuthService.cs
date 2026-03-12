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
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext db,
        IOptions<JwtOptions> jwt,
        ILogger<AuthService> logger)
    {
        _db = db;
        _hasher = new PasswordHasher<Student>();
        _jwt = jwt.Value;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(AuthRegisterDto dto, CancellationToken ct)
    {
        var student = dto.ToStudent();
        var email = student.Email;

        if (await _db.Students.AnyAsync(s => s.Email == email, ct))
            throw new InvalidOperationException("Студент уже существует");

        student.PasswordHash = _hasher.HashPassword(student, dto.Password);

        _db.Students.Add(student);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Student registered: {Email}", student.Email);

        var token = CreateToken(student);

        return new AuthResponseDto
        {
            Token = token,
            Student = student.ToAuthStudentDto()
        };
    }

    public async Task<AuthResponseDto> LoginAsync(AuthLoginDto dto, CancellationToken ct)
    {
        var email = StudentMappings.NormalizeEmail(dto.Email);

        var student = await _db.Students.FirstOrDefaultAsync(s => s.Email == email, ct)
            ?? throw new InvalidOperationException("неправильно введены данные");

        var result = _hasher.VerifyHashedPassword(student, student.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new InvalidOperationException("неправильно введены данные");

        var token = CreateToken(student);

        return new AuthResponseDto
        {
            Token = token,
            Student = student.ToAuthStudentDto()
        };
    }

    private string CreateToken(Student student)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, student.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, student.Email),
            new("name", $"{student.FirstName} {student.LastName}".Trim())
        };

        var key = new SymmetricSecurityKey(GetJwtKeyBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.LifetimeMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static byte[] GetJwtKeyBytes(string key)
    {
        try
        {
            return Convert.FromBase64String(key);
        }
        catch (FormatException)
        {
            return Encoding.UTF8.GetBytes(key);
        }
    }
}