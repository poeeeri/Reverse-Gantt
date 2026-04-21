namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskCommentAttachmentDto
    {
        public Guid Id { get; init; }
        public string ImageDataUrl { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }
    }
}
