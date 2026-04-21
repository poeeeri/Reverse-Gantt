using System.Net;
using System.Net.Mail;
using gantt_server.Options;
using gantt_server.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace gantt_server.Services
{
    public sealed class EmailService : IEmailService
    {
        private readonly EmailOptions _options;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public async Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmationLink, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(_options.SmtpHost) || string.IsNullOrWhiteSpace(_options.FromEmail))
            {
                _logger.LogWarning("SMTP is not configured. Email confirmation link for {Email}: {Link}", toEmail, confirmationLink);
                return;
            }

            using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
            {
                EnableSsl = _options.EnableSsl
            };

            if (!string.IsNullOrWhiteSpace(_options.SmtpUsername))
            {
                client.Credentials = new NetworkCredential(_options.SmtpUsername, _options.SmtpPassword);
            }

            using var message = new MailMessage
            {
                From = new MailAddress(_options.FromEmail, _options.FromName ?? "Reverse Gantt"),
                Subject = "Подтверждение почты Reverse Gantt",
                Body = $"""
Здравствуйте, {fullName}.

Подтвердите почту, чтобы активировать аккаунт:
{confirmationLink}

Если вы не регистрировались в Reverse Gantt, просто проигнорируйте это письмо.
""",
                IsBodyHtml = false
            };

            message.To.Add(toEmail);

            ct.ThrowIfCancellationRequested();
            await client.SendMailAsync(message, ct);
        }
    }
}
