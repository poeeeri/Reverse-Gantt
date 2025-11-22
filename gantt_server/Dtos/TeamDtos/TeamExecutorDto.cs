using gantt_server.Models;

namespace gantt_server.Dtos.TeamDtos
{
    public sealed class TeamExecutorDto
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public ExecutorRole Role { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
