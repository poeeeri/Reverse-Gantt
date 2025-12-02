using gantt_server.Data;
using gantt_server.Dtos.TeamDtos;
using gantt_server.Mappings;
using gantt_server.Models;
using gantt_server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace gantt_server.Services
{
    public sealed class TeamService : ITeamService
    {
        private readonly AppDbContext _db;

        public TeamService(AppDbContext db) {_db = db; }

        private IQueryable<Team> TeamsWithDetails() =>
            _db.Teams
                .Include(t => t.Executors).ThenInclude(e => e.Student)
                .Include(t => t.Projects);

        public async Task<IReadOnlyList<TeamReadDto>> GetAllAsync(CancellationToken ct)
        {
            var teams = await TeamsWithDetails()
                .AsNoTracking()
                .ToListAsync(ct);
            return teams.ToReadDtos().ToList();
        }

        public async Task<TeamReadDto?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            var team = await TeamsWithDetails()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id, ct);
            return team?.ToReadDto();
        }

        public async Task<TeamReadDto> CreateAsync(TeamCreateDto dto, CancellationToken ct)
        {
            var entity = dto.ToEntity();
            _db.Teams.Add(entity);
            await _db.SaveChangesAsync(ct);
            return (await TeamsWithDetails()
                .AsNoTracking()
                .FirstAsync(t => t.Id == entity.Id, ct)).ToReadDto();
        }

        public async Task<TeamReadDto?> UpdateAsync(Guid id, TeamUpdateDto dto, CancellationToken ct)
        {
            var entity = await _db.Teams.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (entity is null) 
                return null;

            entity.Apply(dto);
            await _db.SaveChangesAsync(ct);
            return await GetByIdAsync(id, ct);
        }

        public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
        {
            var entity = await _db.Teams.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (entity is null) 
                return false;

            _db.Teams.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<TeamExecutorDto> AddExecutorAsync(Guid teamId, TeamAddExecutorDto dto, CancellationToken ct)
        {
            var team = await _db.Teams.FirstOrDefaultAsync(t => t.Id == teamId, ct)
                ?? throw new InvalidOperationException("Команда не найдена");

            var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == dto.StudentId, ct)
                ?? throw new InvalidOperationException("Студент не найден");

            var exists = await _db.Executors.AnyAsync(e => e.TeamId == teamId && e.StudentId == dto.StudentId, ct);
            if (exists)
                throw new InvalidOperationException("Студент уже состоит в команде");

            var executor = new Executor
            {
                StudentId = student.Id,
                TeamId = team.Id,
                Role = dto.Role,
                Student = student,
                Team = team
            };

            _db.Executors.Add(executor);
            team.Executors.Add(executor);
            await _db.SaveChangesAsync(ct);

            return executor.ToTeamExecutorDto();
        }

        public async Task<bool> RemoveExecutorAsync(Guid teamId, Guid executorId, CancellationToken ct)
        {
            var executor = await _db.Executors.FirstOrDefaultAsync(e => e.Id == executorId && e.TeamId == teamId, ct);
            if (executor is null) 
                return false;

            _db.Executors.Remove(executor);
            await _db.SaveChangesAsync(ct);
            return true;
        }
    }
}