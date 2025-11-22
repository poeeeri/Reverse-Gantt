using gantt_server.Dtos.ProjectTaskDtos;
using gantt_server.Dtos.TeamDtos;

namespace gantt_server.Dtos.StudentDtos
{
    public sealed class StudentTeamsProjectsDto
    {
        public Guid StudentId { get; init; }
        public IReadOnlyList<TeamReadDto> Teams { get; init; } = Array.Empty<TeamReadDto>();
        public IReadOnlyList<ProjectTaskDto> Tasks { get; init; } = Array.Empty<ProjectTaskDto>();
    }
}