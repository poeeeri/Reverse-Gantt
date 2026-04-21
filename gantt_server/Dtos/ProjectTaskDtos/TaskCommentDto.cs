namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskCommentDto
    {
        public Guid Id { get; init; }
        public Guid TaskId { get; init; }
        public Guid StudentId { get; init; }
        public string AuthorName { get; init; } = string.Empty;
        public string Content { get; init; } = string.Empty;
        public IReadOnlyList<TaskCommentAttachmentDto> Attachments { get; init; } = Array.Empty<TaskCommentAttachmentDto>();
        public DateTime CreatedAt { get; init; }
        public bool IsRead { get; init; }
    }
}
