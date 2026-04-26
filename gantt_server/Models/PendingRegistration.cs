namespace gantt_server.Models
{
    public sealed class PendingRegistration
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public required string VerificationToken { get; set; }
        public DateTime VerificationTokenExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
