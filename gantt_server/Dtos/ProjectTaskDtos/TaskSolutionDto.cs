namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskSolutionDto
    {
        public Guid Id { get; init; }
        public Guid TaskId { get; init; }
        public string Explanation { get; init; } = string.Empty;
        public Guid UpdatedByExecutorId { get; init; }
        public string? UpdatedByName { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime UpdatedAt { get; init; }
        public IReadOnlyList<TaskSolutionAttachmentDto> Attachments { get; init; } = Array.Empty<TaskSolutionAttachmentDto>();
    }
}
