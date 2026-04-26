using System.ComponentModel.DataAnnotations;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class TaskCommentUpdateDto
    {
        [MaxLength(2000)]
        public string? Content { get; set; }

        [MaxLength(6)]
        public IList<string>? AttachmentDataUrls { get; set; }
    }
}
