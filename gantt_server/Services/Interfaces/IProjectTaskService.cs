using gantt_server.Dtos.ProjectTaskDtos;
using gantt_server.Models;

namespace gantt_server.Services.Interfaces
{
    public interface IProjectTaskService
    {
        Task<IReadOnlyList<ProjectTaskDto>> GetByProjectAsync(Guid projectId, CancellationToken ct);
        Task<ProjectTaskDto?> GetByIdAsync(Guid id, CancellationToken ct);
        Task<ProjectTaskDto> CreateAsync(ProjectTaskCreateDto dto, CancellationToken ct);
        Task<ProjectTaskDto?> UpdateAsync(Guid id, ProjectTaskUpdateDto dto, CancellationToken ct);
        Task<bool> DeleteAsync(Guid id, CancellationToken ct);
        Task<bool> SetStatusAsync(Guid id, ProjectTaskStatus status, CancellationToken ct);
        Task<ProjectTaskDto?> AddDependencyAsync(Guid id, Guid dependencyId, CancellationToken ct);
        Task<ProjectTaskDto?> RemoveDependencyAsync(Guid id, Guid dependencyId, CancellationToken ct);
        Task<ProjectTaskDto?> AssignExecutorAsync(Guid id, Guid executorId, CancellationToken ct);
        Task<ProjectTaskDto?> UnassignExecutorAsync(Guid id, Guid executorId, CancellationToken ct);
    }
}