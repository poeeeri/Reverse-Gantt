using gantt_server.Dtos.ProjectDtos;
using gantt_server.Dtos.TeamDtos;
using gantt_server.Models;

namespace gantt_server.Mappings
{
    public static class TeamMappings
    {
        public static Team ToEntity(this TeamCreateDto dto) => new()
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description
        };

        public static void Apply(this Team entity, TeamUpdateDto dto)
        {
            if (dto.Name is not null)
                entity.Name = dto.Name;

            if (dto.Description is not null)
                entity.Description = dto.Description;
        }

        public static TeamReadDto ToReadDto(this Team team) => new()
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            Executors = team.Executors?.Select(e => e.ToTeamExecutorDto()).ToArray() ?? Array.Empty<TeamExecutorDto>(),
            Projects = team.Projects?.Select(p => p.ToReadDto()).ToArray() ?? Array.Empty<ProjectReadDto>()
        };

        public static TeamReadDto ToReadDto(this Team team, Guid viewerStudentId) => new()
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            Executors = team.Executors?.Select(e => e.ToTeamExecutorDto()).ToArray() ?? Array.Empty<TeamExecutorDto>(),
            Projects = team.Projects?.Select(p => p.ToReadDto(viewerStudentId)).ToArray() ?? Array.Empty<ProjectReadDto>()
        };

        public static IEnumerable<TeamReadDto> ToReadDtos(this IEnumerable<Team> teams) =>
            teams.Select(ToReadDto);

        public static TeamExecutorDto ToTeamExecutorDto(this Executor executor) => new()
        {
            Id = executor.Id,
            StudentId = executor.StudentId,
            StudentName = $"{executor.Student.FirstName} {executor.Student.LastName}".Trim(),
            Role = executor.Role,
            JoinedAt = executor.JoinedAt
        };
    }
}
