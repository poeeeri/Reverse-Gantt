using gantt_server.Dtos.TeamDtos;

namespace gantt_server.Services.Interfaces
{
    public interface ITeamService
    {
        Task<IReadOnlyList<TeamReadDto>> GetAllAsync(CancellationToken ct);
        Task<TeamReadDto?> GetByIdAsync(Guid id, CancellationToken ct);
        Task<TeamReadDto> CreateAsync(TeamCreateDto dto, CancellationToken ct);
        Task<TeamReadDto?> UpdateAsync(Guid id, TeamUpdateDto dto, CancellationToken ct);
        Task<bool> DeleteAsync(Guid id, Guid actorExecutorId, CancellationToken ct);
        Task<TeamExecutorDto> AddExecutorAsync(Guid teamId, TeamAddExecutorDto dto, CancellationToken ct);
        Task<bool> RemoveExecutorAsync(Guid teamId, Guid executorId, Guid actorExecutorId, CancellationToken ct);
    }
}