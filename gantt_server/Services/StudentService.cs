using gantt_server.Data;
using gantt_server.Dtos.StudentDtos;
using gantt_server.Mappings;
using gantt_server.Models;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace gantt_server.Services
{
    public sealed class StudentService : IStudentService
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<Student> _hasher;

        public StudentService(AppDbContext db)
        {
            _db = db;
            _hasher = new PasswordHasher<Student>();
        }

        public async Task<IReadOnlyList<StudentReadDto>> GetAllStudents(CancellationToken ct)
        {
            var items = await _db.Students.AsNoTracking().ToListAsync(ct);
            return items.ToReadDtos().ToList();
        }

        public async Task<StudentReadDto?> GetStudentById(Guid id, CancellationToken ct)
        {
            var student = await _db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            return student?.ToReadDto();
        }

        public async Task<StudentReadDto> CreateStudent(StudentCreateDto dto, CancellationToken ct)
        {
            if (dto is null) throw new ArgumentNullException(nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Password))
                throw new ArgumentException("Пароль обязателен", nameof(dto.Password));

            var email = StudentMappings.NormalizeEmail(dto.Email);
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email обязателен", nameof(dto.Email));

            var exists = await _db.Students.AnyAsync(s => s.Email == email, ct);
            if (exists)
                throw new StudentConflictException(new() { ["Email"] = "студент с таким Email уже существует в системе" });

            var student = dto.ToEntity(email);

            student.PasswordHash = _hasher.HashPassword(student, dto.Password);

            _db.Students.Add(student);
            await _db.SaveChangesAsync(ct);

            return student.ToReadDto();
        }

        public async Task<StudentReadDto?> PatchStudent(Guid id, StudentPatchDto dto, CancellationToken ct)
        {
            var entity = await _db.Students.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity is null) return null;

            if (dto.Email is not null)
            {
                var normalized = StudentMappings.NormalizeEmail(dto.Email);
                var duplicate = await _db.Students.AnyAsync(s => s.Id != id && s.Email == normalized, ct);
                if (duplicate)
                    throw new StudentConflictException(new() { ["Email"] = "студент с таким Email уже существует в системе" });

                dto.Email = normalized;
            }

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

        public async Task<StudentReadDto?> GetMeAsync(Guid studentId, CancellationToken ct)
        {
            var student = await _db.Students
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == studentId, ct);

            return student?.ToReadDto();
        }

        public async Task<StudentTeamsProjectsDto?> GetTeamsAndTasks(Guid studentId, CancellationToken ct)
        {
            var studentExists = await _db.Students.AsNoTracking().AnyAsync(s => s.Id == studentId, ct);
            if (!studentExists)
                return null;

            var teams = await _db.Teams
                .Where(t => t.Executors.Any(e => e.StudentId == studentId))
                .Include(t => t.Executors).ThenInclude(e => e.Student)
                .Include(t => t.Projects)
                    .ThenInclude(p => p.Tasks)
                        .ThenInclude(t => t.Subtasks)
                .Include(t => t.Projects)
                    .ThenInclude(p => p.Tasks)
                        .ThenInclude(t => t.Dependencies)
                .Include(t => t.Projects)
                    .ThenInclude(p => p.Tasks)
                        .ThenInclude(t => t.DependentTasks)
                .Include(t => t.Projects)
                    .ThenInclude(p => p.Tasks)
                        .ThenInclude(t => t.Executors)
                            .ThenInclude(e => e.Student)
                .AsNoTracking()
                .ToListAsync(ct);

            var tasks = await _db.ProjectTasks
                .Include(t => t.Subtasks)
                .Include(t => t.Dependencies)
                .Include(t => t.DependentTasks)
                .Include(t => t.Executors).ThenInclude(e => e.Student)
                .AsNoTracking()
                .Where(t => t.Executors.Any(e => e.StudentId == studentId))
                .ToListAsync(ct);

            return studentId.ToTeamsProjectsDto(teams, tasks);
        }
    }

    public sealed class StudentConflictException : Exception
    {
        public Dictionary<string, string> Errors { get; }
        public StudentConflictException(Dictionary<string, string> errors)
            : base("student conflict")
        {
            Errors = errors;
        }
    }
}