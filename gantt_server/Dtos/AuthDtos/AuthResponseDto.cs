namespace gantt_server.Dtos.AuthDtos
{
    public sealed class AuthResponseDto
    {
        public string? Token { get; set; }
        public AuthStudentDto? Student { get; set; }
        public bool RequiresEmailConfirmation { get; set; }
        public string? Message { get; set; }
        public string? VerificationLink { get; set; }
    }
}
