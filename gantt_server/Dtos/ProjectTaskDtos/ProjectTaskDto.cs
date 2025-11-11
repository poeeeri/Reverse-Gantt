using gantt_server.Models;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class ProjectTaskDto
    {
        public Guid Id { get; init; }
        public Guid ProjectId { get; init; }
        public string ProjectName { get; init; }
        public string Name { get; init; }
        public string? Description { get; init; }
        public int DurationDays { get; init; }
        public ProjectTaskStatus Status { get; init; }
        public DateTime Deadline { get; init; }
    }
}

