namespace gantt_server.Dtos.AuthDtos
{
    public sealed class AuthResponseDto
    {
        public required string Token { get; set; }
        public required AuthStudentDto Student { get; set; }
    }
}