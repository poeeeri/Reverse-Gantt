namespace gantt_server.Models
{
    public sealed class TaskSolutionAttachment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SolutionId { get; set; }
        public TaskSolution Solution { get; set; } = null!;
        public required string ImageDataUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
