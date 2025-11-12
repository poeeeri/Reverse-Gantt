namespace gantt_server.Models
{
    public class ProjectTask
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProjectId { get; set; }
        public required Project Project { get; set; }

        public required string Name { get; set; }
        public string? Description { get; set; }
        public int DurationDays { get; set; } = 1;
        public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.Created;
        public DateTime? Deadline { get; set; }

        public Guid? ParentTaskId { get; set; }
        public ProjectTask? ParentTask { get; set; }
        public ICollection<ProjectTask> Subtasks { get; set; } = new List<ProjectTask>();

        public virtual ICollection<ProjectTask> Dependencies { get; set; } = new List<ProjectTask>();
        public virtual ICollection<ProjectTask> DependentTasks { get; set; } = new List<ProjectTask>();

        public Guid TeamId { get; set; }
        public Guid StudentId { get; set; }
        public virtual ICollection<Executor> Executors { get; set; } = new List<Executor>();

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}