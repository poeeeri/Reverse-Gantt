using gantt_server.Dtos.AuthDtos;

namespace gantt_server.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(AuthRegisterDto dto, CancellationToken ct);
        Task<AuthResponseDto> LoginAsync(AuthLoginDto dto, CancellationToken ct);
        Task ConfirmEmailAsync(ConfirmEmailDto dto, CancellationToken ct);
        Task<AuthResponseDto> ResendConfirmationAsync(ResendConfirmationDto dto, CancellationToken ct);
    }
}
