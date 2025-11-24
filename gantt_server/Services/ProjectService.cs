using gantt_server.Data;
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
            var projects = await _db.Projects.AsNoTracking().ToListAsync(ct);
            return projects.ToReadDtos().ToList();
        }

        public async Task<ProjectReadDto?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            var project = await _db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
            return project?.ToReadDto();
        }

        public async Task<ProjectReadDto> CreateAsync(ProjectCreateDto dto, CancellationToken ct)
        {
            var entity = dto.ToEntity();
            _db.Projects.Add(entity);
            await _db.SaveChangesAsync(ct);
            return entity.ToReadDto();
        }

        public async Task<ProjectReadDto?> UpdateAsync(Guid id, ProjectUpdateDto dto, CancellationToken ct)
        {
            var entity = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (entity is null) 
                return null;

            entity.Apply(dto);
            await _db.SaveChangesAsync(ct);
            return entity.ToReadDto();
        }

        public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
        {
            var entity = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (entity is null) 
                return false;

            _db.Projects.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return true;
        }
    }
}