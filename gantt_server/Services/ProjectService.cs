using gantt_server.Data;
using gantt_server.Models;
using gantt_server.Dtos.ProjectDtos;
using gantt_server.Mappings;
using gantt_server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace gantt_server.Services
{
    public sealed class ProjectService : IProjectService
    {
        private readonly AppDbContext _db;

        public ProjectService(AppDbContext db) {_db = db;}

        public async Task<IReadOnlyList<ProjectReadDto>> GetAllAsync(CancellationToken ct)
        {
            var projects = await ProjectsWithTasks()
                .AsNoTracking()
                .ToListAsync(ct);

            return projects.Select(p => p.ToReadDto()).ToList();
        }

        public async Task<ProjectReadDto?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            var project = await ProjectsWithTasks()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            return project?.ToReadDto();
        }

        public async Task<ProjectReadDto> CreateAsync(ProjectCreateDto dto, CancellationToken ct)
        {
            var entity = dto.ToEntity();
            _db.Projects.Add(entity);
            await _db.SaveChangesAsync(ct);

            return (await ProjectsWithTasks()
                .AsNoTracking()
                .FirstAsync(p => p.Id == entity.Id, ct)).ToReadDto();
        }

        public async Task<ProjectReadDto?> UpdateAsync(Guid id, ProjectUpdateDto dto, CancellationToken ct)
        {
            var entity = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (entity is null) 
                return null;

            entity.Apply(dto);
            await _db.SaveChangesAsync(ct);

            return await GetByIdAsync(id, ct);
        }

        public async Task<bool> DeleteAsync(Guid id, Guid actorExecutorId, CancellationToken ct)
        {
            var entity = await _db.Projects
                .Include(p => p.Team)
                    .ThenInclude(t => t.Executors)
                .FirstOrDefaultAsync(p => p.Id == id, ct);
            if (entity is null) 
                return false;

            var actor = entity.Team.Executors.FirstOrDefault(e => e.Id == actorExecutorId);
            if (actor is null || actor.Role != ExecutorRole.Leader)
                return false;

            _db.Projects.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        private IQueryable<Project> ProjectsWithTasks() =>
            _db.Projects
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.Subtasks)
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.Dependencies)
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.DependentTasks)
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.Comments)
                        .ThenInclude(c => c.Student)
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.Comments)
                        .ThenInclude(c => c.Attachments)
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.Comments)
                        .ThenInclude(c => c.Reads)
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.Executors)
                        .ThenInclude(e => e.Student);
    }
}
