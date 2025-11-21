using gantt_server.Models;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class ProjectTaskExecutorDto
    {
        public int Id { get; init; }
        public Guid StudentId { get; init; }
        public string StudentName { get; init; } = string.Empty;
        public ExecutorRole Role { get; init; }
        public DateTime JoinedAt { get; init; }
    }
}
