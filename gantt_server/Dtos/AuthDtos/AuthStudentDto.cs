namespace gantt_server.Dtos.AuthDtos
{
    public sealed class AuthStudentDto
    {
        public Guid Id { get; set; }
        public required string Email { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
    }
}