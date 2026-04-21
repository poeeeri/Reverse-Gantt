namespace gantt_server.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmationLink, CancellationToken ct);
    }
}
