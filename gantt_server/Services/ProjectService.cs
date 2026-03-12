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
	
	private readonly ICacheService _cache;
        
	private readonly ILogger<ProjectService> _logger;
        
	public ProjectService(AppDbContext db, ICacheService cache, ILogger<ProjectService> logger) 
	{
		_db = db; _cache = cache; _logger = logger; 
	}

        public async Task<IReadOnlyList<ProjectReadDto>> GetAllAsync(CancellationToken ct)
        {
            const string cacheKey = "projects:all";
            var ttl = TimeSpan.FromMinutes(5);

            return await _cache.GetOrSetAsync(
                cacheKey,
                ttl,
                async () =>
                {
                    _logger.LogInformation("Cache MISS for {CacheKey}, loading from database", cacheKey);
                    
                    var projects = await ProjectsWithTasks()
                        .AsNoTracking()
                        .ToListAsync(ct);

                    return projects.Select(p => p.ToReadDto()).ToList();
                }
            );
        }

        public async Task<ProjectReadDto?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            var cacheKey = $"project:{id}";
            var ttl = TimeSpan.FromMinutes(10);

            return await _cache.GetOrSetAsync(
                cacheKey,
                ttl,
                async () =>
                {
                    _logger.LogInformation("Cache MISS for {CacheKey}, loading from database", cacheKey);
                    
                    var project = await ProjectsWithTasks()
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.Id == id, ct);
                        
                    return project?.ToReadDto();
                }
            );
        }

        public async Task<ProjectReadDto> CreateAsync(ProjectCreateDto dto, CancellationToken ct)
        {
            var entity = dto.ToEntity();
            _db.Projects.Add(entity);
            await _db.SaveChangesAsync(ct);

            await _cache.RemoveAsync("projects:all");
            _logger.LogInformation("Cache invalidated: projects:all after creating project {ProjectId}", entity.Id);

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

            await _cache.RemoveAsync($"project:{id}");
            await _cache.RemoveAsync("projects:all");
            _logger.LogInformation("Cache invalidated for project:{ProjectId} and projects:all", id);

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

            
            await _cache.RemoveAsync($"project:{id}");
            await _cache.RemoveAsync("projects:all");
            _logger.LogInformation("Cache invalidated for project:{ProjectId} and projects:all after deletion", id);

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
                    .ThenInclude(t => t.Executors)
                        .ThenInclude(e => e.Student);
    }
}