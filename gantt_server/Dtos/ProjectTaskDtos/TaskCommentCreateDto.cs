using System.ComponentModel.DataAnnotations;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskCommentCreateDto
    {
        [Required]
        public Guid StudentId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}