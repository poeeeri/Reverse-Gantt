using gantt_server.Models;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class ProjectTaskStatusDto
    {
        public required ProjectTaskStatus Status { get; set; }
    }
}