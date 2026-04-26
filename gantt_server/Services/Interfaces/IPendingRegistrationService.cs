using gantt_server.Dtos.AuthDtos;
using gantt_server.Models;

namespace gantt_server.Services.Interfaces
{
    public interface IPendingRegistrationService
    {
        Task CleanupExpiredAsync(CancellationToken ct);
        Task<PendingRegistration> CreateOrUpdateAsync(AuthRegisterDto dto, CancellationToken ct);
        Task<PendingRegistration?> GetByEmailAsync(string email, CancellationToken ct);
        Task<PendingRegistration?> RefreshConfirmationAsync(string email, CancellationToken ct);
        Task ApproveAsync(Guid registrationId, string? verificationToken, CancellationToken ct);
        Task RejectAsync(Guid registrationId, CancellationToken ct);
    }
}
