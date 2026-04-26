using gantt_server.Data;
using gantt_server.Dtos.AuthDtos;
using gantt_server.Mappings;
using gantt_server.Models;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace gantt_server.Services
{
    public sealed class PendingRegistrationService : IPendingRegistrationService
    {
        private static readonly TimeSpan VerificationLifetime = TimeSpan.FromHours(24);
        private static readonly TimeSpan PendingRetention = TimeSpan.FromDays(3);

        private readonly AppDbContext _db;
        private readonly IPasswordHasher<Student> _hasher;

        public PendingRegistrationService(AppDbContext db)
        {
            _db = db;
            _hasher = new PasswordHasher<Student>();
        }

        public async Task CleanupExpiredAsync(CancellationToken ct)
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

        public async Task<PendingRegistration> CreateOrUpdateAsync(AuthRegisterDto dto, CancellationToken ct)
        {
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
            return pending;
        }

        public Task<PendingRegistration?> GetByEmailAsync(string email, CancellationToken ct)
        {
            return _db.PendingRegistrations.FirstOrDefaultAsync(r => r.Email == email, ct);
        }

        public async Task<PendingRegistration?> RefreshConfirmationAsync(string email, CancellationToken ct)
        {
            var normalizedEmail = StudentMappings.NormalizeEmail(email);

            if (await _db.Students.AnyAsync(s => s.Email == normalizedEmail, ct))
                return null;

            var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(r => r.Email == normalizedEmail, ct)
                ?? throw new InvalidOperationException("Заявка на подтверждение не найдена");

            pending.VerificationToken = GenerateVerificationToken();
            pending.VerificationTokenExpiresAt = DateTime.UtcNow.Add(VerificationLifetime);
            await _db.SaveChangesAsync(ct);
            return pending;
        }

        public async Task ApproveAsync(Guid registrationId, string? verificationToken, CancellationToken ct)
        {
            await CleanupExpiredAsync(ct);

            var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(r => r.Id == registrationId, ct)
                ?? throw new InvalidOperationException("Заявка на регистрацию не найдена");

            if (!string.IsNullOrWhiteSpace(verificationToken) && pending.VerificationToken != verificationToken)
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

        public async Task RejectAsync(Guid registrationId, CancellationToken ct)
        {
            var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(r => r.Id == registrationId, ct)
                ?? throw new InvalidOperationException("Заявка на регистрацию не найдена");

            _db.PendingRegistrations.Remove(pending);
            await _db.SaveChangesAsync(ct);
        }

        private static string GenerateVerificationToken() =>
            Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
    }
}
