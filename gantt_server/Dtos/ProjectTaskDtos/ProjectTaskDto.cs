using gantt_server.Models;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class ProjectTaskDto
    {
        public Guid Id { get; init; }
        public Guid ProjectId { get; init; }
        public Guid TeamId { get; init; }
        public required string Name { get; init; }
        public string? Description { get; init; }
        public int DurationDays { get; init; }
        public ProjectTaskStatus Status { get; init; }
        public DateTime? Deadline { get; init; }
        public Guid? ParentTaskId { get; init; }
        public IReadOnlyList<Guid> SubtaskIds { get; init; } = Array.Empty<Guid>();
        public IReadOnlyList<Guid> DependencyIds { get; init; } = Array.Empty<Guid>();
        public IReadOnlyList<Guid> DependentIds { get; init; } = Array.Empty<Guid>();
        public IReadOnlyList<Guid> ExecutorIds { get; init; } = Array.Empty<Guid>();
        public IReadOnlyList<ProjectTaskExecutorDto> Executors { get; init; } = Array.Empty<ProjectTaskExecutorDto>();
        public DateTime AssignedAt { get; init; }
    }
}