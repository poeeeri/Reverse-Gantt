namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskSolutionUpsertDto
    {
        public Guid ActorExecutorId { get; set; }
        public string? Explanation { get; set; }
        public IReadOnlyList<string>? AttachmentDataUrls { get; set; }
    }
}
