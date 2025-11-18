using gantt_server.Dtos.ProjectTaskDtos;

namespace gantt_server.Dtos.StudentDtos
{
    public sealed class ExecutorReadDto
    {
        public Guid Id { get; init; }
        public Guid TeamId { get; init; }
        public string TeamName { get; init; } = null!;
        public IReadOnlyList<ProjectTaskDto> Tasks { get; init; } = Array.Empty<ProjectTaskDto>();
    }
}
