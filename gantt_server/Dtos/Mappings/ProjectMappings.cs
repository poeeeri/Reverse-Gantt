using gantt_server.Dtos.ProjectDtos;
using gantt_server.Models;

namespace gantt_server.Mappings
{
    public static class ProjectMappings
    {
        public static ProjectReadDto ToReadDto(this Project project) => new()
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Subject = project.Subject,
            FinalDeadline = project.FinalDeadline,
            Status = project.Status,
            TeamId = project.TeamId
        };

        public static IEnumerable<ProjectReadDto> ToReadDtos(this IEnumerable<Project> projects) =>
            projects.Select(ToReadDto);

        public static Project ToEntity(this ProjectCreateDto dto) => new()
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Subject = dto.Subject,
            FinalDeadline = dto.FinalDeadline,
            Status = dto.Status,
            TeamId = dto.TeamId
        };

        public static void Apply(this Project entity, ProjectUpdateDto dto)
        {
            if (dto.Name is not null)
                entity.Name = dto.Name;

            if (dto.Description is not null)
                entity.Description = dto.Description;

            if (dto.Subject is not null)
                entity.Subject = dto.Subject;

            if (dto.FinalDeadline.HasValue)
                entity.FinalDeadline = dto.FinalDeadline.Value;

            if (dto.Status.HasValue)
                entity.Status = dto.Status.Value;

            if (dto.TeamId.HasValue)
                entity.TeamId = dto.TeamId.Value;
        }
    }
}
