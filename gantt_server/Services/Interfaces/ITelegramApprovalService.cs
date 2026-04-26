using gantt_server.Models;

namespace gantt_server.Services.Interfaces
{
    public interface ITelegramApprovalService
    {
        bool IsEnabled { get; }
        Task SendPendingRegistrationAsync(PendingRegistration pending, CancellationToken ct);
        Task HandleWebhookAsync(string requestBody, CancellationToken ct);
        Task<long?> PollUpdatesAsync(long? offset, CancellationToken ct);
    }
}
