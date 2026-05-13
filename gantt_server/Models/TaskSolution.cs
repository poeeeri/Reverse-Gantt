namespace gantt_server.Models
{
    public sealed class TaskSolution
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TaskId { get; set; }
        public ProjectTask Task { get; set; } = null!;
        public string Explanation { get; set; } = string.Empty;
        public Guid UpdatedByExecutorId { get; set; }
        public Executor UpdatedByExecutor { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<TaskSolutionAttachment> Attachments { get; set; } = new List<TaskSolutionAttachment>();
    }
}
