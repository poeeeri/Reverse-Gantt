using gantt_server.Dtos.ProjectTaskDtos;

namespace gantt_server.Dtos.StudentDtos
{
    public sealed class StudentReadDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? Email { get; set; }
        public IReadOnlyList<ExecutorReadDto> Executors { get; init; } = Array.Empty<ExecutorReadDto>();
    }
}