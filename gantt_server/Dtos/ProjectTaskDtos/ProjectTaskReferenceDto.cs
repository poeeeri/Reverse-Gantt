using gantt_server.Models;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class ProjectTaskReferenceDto
    {
        public Guid Id { get; init; }
        public required string Name { get; init; }
        public ProjectTaskStatus Status { get; init; }
    }
}
