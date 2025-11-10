namespace gantt_server.Models
{
    public sealed class Executor
    {
        public Guid StudentId { get; set; }
        public required Student Student { get; set; }

        public Guid TeamId { get; set; }
        public required Team Team { get; set; }

        public TeamRole Role { get; set; } = TeamRole.Member;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}