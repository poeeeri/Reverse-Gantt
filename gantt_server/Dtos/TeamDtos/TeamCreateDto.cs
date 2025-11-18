using System.ComponentModel.DataAnnotations;

namespace gantt_server.Dtos.TeamDtos
{
    public sealed class TeamCreateDto
    {
        [Required(ErrorMessage = "Название команды обязательно")]
        public required string Name { get; set; }

        public string? Description { get; set; }
    }
}
