using System.ComponentModel.DataAnnotations;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskCommentCreateDto
    {
        [Required]
        public Guid StudentId { get; set; }

        [MaxLength(2000)]
        public string? Content { get; set; }

        [MaxLength(6)]
        public IList<string>? AttachmentDataUrls { get; set; }
    }
}
