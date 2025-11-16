using gantt_server.Models;

namespace gantt_server.Dtos.ProjectDtos
{
    public sealed class ProjectReadDto
    {
        public Guid Id { get; init; }
        public required string Name { get; init; }
        public string? Description { get; init; }
        public required string Subject { get; init; }
        public DateTime FinalDeadline { get; init; }
        public ProjectStatus Status { get; init; }
        public Guid TeamId { get; init; }
    }
}
