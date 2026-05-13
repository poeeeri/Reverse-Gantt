namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskSolutionAttachmentDto
    {
        public Guid Id { get; init; }
        public required string ImageDataUrl { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
