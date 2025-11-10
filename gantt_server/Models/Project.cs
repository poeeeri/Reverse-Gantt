namespace gantt_server.Models
{
    public sealed class Project
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public required string Subject { get; set; }
        public DateOnly Deadline { get; set; }
        public ProjectStatus Status { get; set; } = ProjectStatus.Planned;

        public Guid TeamId { get; set; }
        public Team? Team { get; set; }

        public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    }
}