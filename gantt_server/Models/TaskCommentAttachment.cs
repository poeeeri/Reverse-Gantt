namespace gantt_server.Models
{
    public sealed class TaskCommentAttachment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CommentId { get; set; }
        public TaskComment Comment { get; set; } = null!;
        public required string ImageDataUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
