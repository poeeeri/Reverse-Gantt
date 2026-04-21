namespace gantt_server.Dtos.AuthDtos
{
    public sealed class ConfirmEmailDto
    {
        public required Guid RegistrationId { get; set; }
        public required string Token { get; set; }
    }
}
