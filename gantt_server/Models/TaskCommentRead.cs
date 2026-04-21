namespace gantt_server.Models
{
    public sealed class TaskCommentRead
    {
        public Guid CommentId { get; set; }
        public TaskComment Comment { get; set; } = null!;

        public Guid StudentId { get; set; }
        public Student Student { get; set; } = null!;

        public DateTime ReadAt { get; set; } = DateTime.UtcNow;
    }
}
