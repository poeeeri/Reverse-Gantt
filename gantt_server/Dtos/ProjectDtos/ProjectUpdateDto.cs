using gantt_server.Models;

namespace gantt_server.Dtos.ProjectDtos
{
    public sealed class ProjectUpdateDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Subject { get; set; }
        public DateTime? FinalDeadline { get; set; }
        public ProjectStatus? Status { get; set; }
        public Guid? TeamId { get; set; }
    }
}
