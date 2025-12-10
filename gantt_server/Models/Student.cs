namespace gantt_server.Models
{
    public sealed class Student
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Executor> Executors { get; set; } = new List<Executor>();
    }
}
