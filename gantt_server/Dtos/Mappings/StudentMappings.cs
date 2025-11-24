using System.Globalization;
using gantt_server.Dtos.ProjectTaskDtos;
using gantt_server.Dtos.StudentDtos;
using gantt_server.Models;

namespace gantt_server.Mappings
{
    public static class StudentMappings
    {
        public static StudentReadDto ToReadDto(this Student s) => new()
        {
            Id = s.Id,
            FirstName = s.FirstName,
            LastName = s.LastName,
            Email = s.Email,
            Executors = s.Executors?.Select(e => e.ToExecutorReadDto()).ToArray() ?? Array.Empty<ExecutorReadDto>()
        };

        public static IEnumerable<StudentReadDto> ToReadDtos(this IEnumerable<Student> src) =>
            src.Select(ToReadDto);

        public static ExecutorReadDto ToExecutorReadDto(this Executor executor) => new()
        {
            Id = executor.Id,
            TeamId = executor.TeamId,
            TeamName = executor.Team?.Name ?? string.Empty,
            Tasks = executor.Tasks?.Select(t => t.ToDto()).ToArray() ?? Array.Empty<ProjectTaskDto>()
        };

        public static Student ToEntity(this StudentCreateDto dto, string normalizedEmail) => new()
        {
            Id = Guid.NewGuid(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = normalizedEmail,
            CreatedAt = DateTime.UtcNow
        };

        public static StudentTeamsProjectsDto ToTeamsProjectsDto(
            this Guid studentId,
            IEnumerable<Team> teams,
            IEnumerable<ProjectTask> tasks) =>
            new()
            {
                // StudentId = studentId,
                Teams = teams.ToReadDtos().ToArray(),
                Tasks = tasks.Select(t => t.ToDto()).ToArray()
            };

        public static void Apply(this Student entity, StudentPatchDto dto)
        {
            if (dto.FirstName is not null)
                entity.FirstName = dto.FirstName;

            if (dto.LastName is not null)
                entity.LastName = dto.LastName;

            if (dto.Email is not null)
                entity.Email = NormalizeEmail(dto.Email);
        }

        public static string NormalizeEmail(string? email) =>
            (email ?? string.Empty).Trim().ToLower(CultureInfo.InvariantCulture);
    }
}
