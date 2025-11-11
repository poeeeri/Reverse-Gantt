namespace gantt_server.Models
{
    public sealed class Student
    {
        public Guid Id { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? Email { get; set; }

        public ICollection<Executor> Executors { get; set; } = new List<Executor>();
    }
}