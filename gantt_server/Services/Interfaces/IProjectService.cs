using gantt_server.Dtos.ProjectDtos;

namespace gantt_server.Services.Interfaces
{
    public interface IProjectService
    {
        Task<IReadOnlyList<ProjectReadDto>> GetAllAsync(CancellationToken ct);
        Task<ProjectReadDto?> GetByIdAsync(Guid id, CancellationToken ct);
        Task<ProjectReadDto> CreateAsync(ProjectCreateDto dto, CancellationToken ct);
        Task<ProjectReadDto?> UpdateAsync(Guid id, ProjectUpdateDto dto, CancellationToken ct);
        Task<bool> DeleteAsync(Guid id, Guid actorExecutorId, CancellationToken ct);
    }
}