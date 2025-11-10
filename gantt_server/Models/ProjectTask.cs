namespace gantt_server.Models
{
    public sealed class ProjectTask
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProjectId { get; set; }
        public required Project Project { get; set; }

        public required string Name { get; set; }
        public string? Description { get; set; }
        public int DurationDays { get; set; } = 1;
        public TaskStatus Status { get; set; } = TaskStatus.Created;
        public DateOnly? DueDate { get; set; }
        public string? Comment { get; set; }

        public Guid? ParentId { get; set; }
        public ProjectTask? Parent { get; set; }
        public ICollection<ProjectTask> Children { get; set; } = new List<ProjectTask>();

        public Guid TeamId { get; set; }
        public Guid StudentId { get; set; }
        public Guid ExecutorStudentId { get => StudentId; set => StudentId = value; }
        public Guid ExecutorTeamId { get => TeamId; set => TeamId = value; }
        public required Executor Executor { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}