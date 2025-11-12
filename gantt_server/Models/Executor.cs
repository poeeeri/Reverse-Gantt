namespace gantt_server.Models
{
    public class Executor
    {
        public int Id { get; set; }

        public Guid StudentId { get; set; }
        public required Student Student { get; set; }

        public Guid TeamId { get; set; }
        public required Team Team { get; set; }

        public ExecutorRole Role { get; set; } = ExecutorRole.Member;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    }
}