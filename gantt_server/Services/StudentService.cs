using Microsoft.EntityFrameworkCore;
using gantt_server.Data;
using gantt_server.Dtos.StudentDtos;
using gantt_server.Mappings;
using gantt_server.Services.Interfaces;

namespace gantt_server.Services
{
    public sealed class StudentService : IStudentService
    {
        private readonly AppDbContext _db;
        public StudentService(AppDbContext db) { _db = db; }

        public async Task<IReadOnlyList<StudentReadDto>> GetAllStudents(CancellationToken ct)
        {
            var items = await _db.Students.AsNoTracking().ToListAsync(ct);
            return items.ToReadDtos().ToList();
        }

        public async Task<StudentReadDto?> GetStudentById(Guid id, CancellationToken ct)
        {
            var s = await _db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            return s?.ToReadDto();
        }

        public async Task<StudentReadDto> CreateStudent(StudentCreateDto dto, CancellationToken ct)
        {
            var norm = dto.Email.Trim().ToLowerInvariant();
            if (await _db.Students.AnyAsync(e => e.Email.ToLower() == norm.ToLower(), ct))
                throw new StudentConflictException(
                    new Dictionary<string, string> { ["Email"] = "студент с такой почтой уже существует" });
            var entity = dto.ToCreate();
            _db.Students.Add(entity);
            await _db.SaveChangesAsync(ct);
            return entity.ToReadDto();
        }
        
        public async Task<StudentReadDto?> PatchStudent(Guid id, StudentPatchDto dto, CancellationToken ct)
        {
            var entity = await _db.Students.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return null;

            entity.Apply(dto);
            await _db.SaveChangesAsync(ct);
            return entity.ToReadDto();
        }

        public async Task<bool> DeleteStudent(Guid id, CancellationToken ct)
        {
            var entity = await _db.Students.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return false;

            _db.Students.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return true;
        }
        public async Task<StudentReadDto> EnsureStudent(EnsureStudentDto dto, CancellationToken ct)
        {
            var email = dto.Email?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email is required", nameof(dto.Email));

            var existing = await _db.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Email == email, ct);

            if (existing is not null)
                return existing.ToReadDto();

            var entity = dto.ToCreate();
            _db.Students.Add(entity);
            await _db.SaveChangesAsync(ct);

            return entity.ToReadDto();
        }
    }
    public sealed class StudentConflictException : Exception
    {
        public Dictionary<string, string> Errors { get; }
        public StudentConflictException(Dictionary<string, string> errors) { Errors = errors; }
    }
}