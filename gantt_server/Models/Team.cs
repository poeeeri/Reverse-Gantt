using System.ComponentModel.DataAnnotations;

namespace gantt_server.Models
{
    public class Team
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = "";
    }
}