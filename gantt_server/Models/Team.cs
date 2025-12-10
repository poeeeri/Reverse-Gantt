namespace gantt_server.Models
{
    public sealed class Team
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }

        public ICollection<Executor> Executors { get; set; } = new List<Executor>();
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}