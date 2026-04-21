namespace gantt_server.Models
{
    public sealed class TaskComment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TaskId { get; set; }
        public ProjectTask Task { get; set; } = null!;

        public Guid StudentId { get; set; }
        public Student Student { get; set; } = null!;

        public required string Content { get; set; }
        public ICollection<TaskCommentAttachment> Attachments { get; set; } = new List<TaskCommentAttachment>();
        public ICollection<TaskCommentRead> Reads { get; set; } = new List<TaskCommentRead>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
