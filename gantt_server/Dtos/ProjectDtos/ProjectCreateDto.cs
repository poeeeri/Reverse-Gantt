using System.ComponentModel.DataAnnotations;
using gantt_server.Models;

namespace gantt_server.Dtos.ProjectDtos
{
    public sealed class ProjectCreateDto
    {
        [Required(ErrorMessage = "Название обязательно")]
        public required string Name { get; set; }

        public string? Description { get; set; }

        [Required(ErrorMessage = "Предмет обязателен")]
        public required string Subject { get; set; }
        public required DateTime FinalDeadline { get; set; }

        public ProjectStatus Status { get; set; } = ProjectStatus.Planned;
        public required Guid TeamId { get; set; }
    }
}
