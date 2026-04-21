using System.ComponentModel.DataAnnotations;

namespace gantt_server.Dtos.AuthDtos
{
    public sealed class ResendConfirmationDto
    {
        [Required]
        public string Email { get; set; } = string.Empty;
    }
}
