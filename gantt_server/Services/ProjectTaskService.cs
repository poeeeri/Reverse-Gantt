using gantt_server.Data;
using gantt_server.Dtos.ProjectTaskDtos;
using gantt_server.Mappings;
using gantt_server.Models;
using gantt_server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace gantt_server.Services
{
    public sealed class ProjectTaskService : IProjectTaskService
    {
        private readonly AppDbContext _db;

        public ProjectTaskService(AppDbContext db) { _db = db; }

        private IQueryable<ProjectTask> QueryWithDetails() =>
            _db.ProjectTasks
                .Include(t => t.Subtasks)
                .Include(t => t.Dependencies)
                .Include(t => t.DependentTasks)
                .Include(t => t.Executors).ThenInclude(e => e.Student)
                .Include(t => t.Comments).ThenInclude(c => c.Student);

        public async Task<IReadOnlyList<ProjectTaskDto>> GetByProjectAsync(Guid projectId, CancellationToken ct)
        {
            var tasks = await QueryWithDetails()
                .AsNoTracking()
                .Where(t => t.ProjectId == projectId)
                .ToListAsync(ct);
            return tasks.ToDtos().ToList();
        }

        public async Task<ProjectTaskDto?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            var task = await QueryWithDetails()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id, ct);
            return task?.ToDto();
        }

        public async Task<ProjectTaskDto> CreateAsync(ProjectTaskCreateDto dto, CancellationToken ct)
        {
            var project = await EnsureProjectExists(dto.ProjectId, ct);
            await EnsureTeamExists(dto.TeamId, ct);
            if (project.TeamId != dto.TeamId)
                throw new InvalidOperationException("Команда выполняющего задачу должна совпадать с командой проекта");
            if (dto.ParentTaskId.HasValue)
                await EnsureSameProjectTask(dto.ProjectId, dto.ParentTaskId.Value, ct);

            var actor = await _db.Executors.AsNoTracking().FirstOrDefaultAsync(e => e.Id == dto.ActorExecutorId, ct);
            if (actor is null || actor.TeamId != dto.TeamId || actor.Role != ExecutorRole.Leader)
                throw new InvalidOperationException("Создавать задачи может только лидер команды");

            var entity = dto.ToEntity();

            await LoadAndAttachDependencies(entity, dto.DependencyIds, ct);
            await LoadAndAttachExecutors(entity, dto.ExecutorIds, ct);

            _db.ProjectTasks.Add(entity);
            await _db.SaveChangesAsync(ct);

            var created = await QueryWithDetails()
                .AsNoTracking()
                .FirstAsync(t => t.Id == entity.Id, ct);
            return created.ToDto();
        }

        public async Task<ProjectTaskDto?> UpdateAsync(Guid id, ProjectTaskUpdateDto dto, CancellationToken ct)
        {
            var entity = await _db.ProjectTasks
                .Include(t => t.Dependencies)
                .Include(t => t.Executors)
                .FirstOrDefaultAsync(t => t.Id == id, ct);

            if (entity is null)
                return null;

            if (dto.ParentTaskId.HasValue)
                await EnsureSameProjectTask(entity.ProjectId, dto.ParentTaskId.Value, ct, entity.Id);

            entity.Apply(dto);

            if (dto.DependencyIds is not null)
            {
                entity.Dependencies.Clear();
                await LoadAndAttachDependencies(entity, dto.DependencyIds, ct);
            }

            if (dto.ExecutorIds is not null)
            {
                entity.Executors.Clear();
                await LoadAndAttachExecutors(entity, dto.ExecutorIds, ct);
            }

            await _db.SaveChangesAsync(ct);

            var updated = await QueryWithDetails()
                .AsNoTracking()
                .FirstAsync(t => t.Id == entity.Id, ct);
            return updated.ToDto();
        }

        public async Task<bool> DeleteAsync(Guid id, Guid actorExecutorId, CancellationToken ct)
        {
            var task = await _db.ProjectTasks
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == id, ct);
            if (task is null) return false;

            var actor = await _db.Executors.AsNoTracking().FirstOrDefaultAsync(e => e.Id == actorExecutorId, ct);
            if (actor is null || actor.TeamId != task.TeamId || actor.Role != ExecutorRole.Leader)
                throw new InvalidOperationException("Удалять задачи может только лидер команды");

            _db.ProjectTasks.Remove(task);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> SetStatusAsync(Guid id, ProjectTaskStatus status, CancellationToken ct)
        {
            var task = await _db.ProjectTasks.FirstOrDefaultAsync(t => t.Id == id, ct);
            if (task is null)
                return false;

            task.Status = status;
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<ProjectTaskDto?> AddDependencyAsync(Guid id, Guid dependencyId, CancellationToken ct)
        {
            var (task, dependency) = await LoadTasksWithDeps(id, dependencyId, ct);
            if (task is null || dependency is null)
                return null;

            if (task.ProjectId != dependency.ProjectId)
                throw new InvalidOperationException("Зависимости должны быть в пределах одного проекта");

            if (dependency.Id == task.Id || IsCircularDependency(task, dependencyId))
                throw new InvalidOperationException("Циклическая зависимость недопустима");

            if (!task.Dependencies.Any(d => d.Id == dependencyId))
                task.Dependencies.Add(dependency);

            await _db.SaveChangesAsync(ct);
            return (await QueryWithDetails().AsNoTracking().FirstAsync(t => t.Id == id, ct)).ToDto();
        }

        public async Task<ProjectTaskDto?> RemoveDependencyAsync(Guid id, Guid dependencyId, CancellationToken ct)
        {
            var task = await _db.ProjectTasks
                .Include(t => t.Dependencies)
                .FirstOrDefaultAsync(t => t.Id == id, ct);

            if (task is null)
                return null;

            var target = task.Dependencies.FirstOrDefault(d => d.Id == dependencyId);
            if (target is not null)
                task.Dependencies.Remove(target);

            await _db.SaveChangesAsync(ct);
            return (await QueryWithDetails().AsNoTracking().FirstAsync(t => t.Id == id, ct)).ToDto();
        }

        public async Task<ProjectTaskDto?> AssignExecutorAsync(Guid id, Guid executorId, CancellationToken ct)
        {
            var task = await _db.ProjectTasks
                .Include(t => t.Executors)
                .Include(t => t.Comments)
                .FirstOrDefaultAsync(t => t.Id == id, ct);

            if (task is null)
                return null;

            var executor = await _db.Executors.Include(e => e.Student).FirstOrDefaultAsync(e => e.Id == executorId, ct)
                ?? throw new InvalidOperationException("Исполнитель не найден");

            if (executor.TeamId != task.TeamId)
                throw new InvalidOperationException("Исполнитель должен принадлежать той же команде");

            if (!task.Executors.Any(e => e.Id == executorId))
                task.Executors.Add(executor);

            await _db.SaveChangesAsync(ct);
            return (await QueryWithDetails().AsNoTracking().FirstAsync(t => t.Id == id, ct)).ToDto();
        }

        public async Task<ProjectTaskDto?> UnassignExecutorAsync(Guid id, Guid executorId, CancellationToken ct)
        {
            var task = await _db.ProjectTasks
                .Include(t => t.Executors)
                .Include(t => t.Comments)
                .FirstOrDefaultAsync(t => t.Id == id, ct);

            if (task is null)
                return null;

            var executor = task.Executors.FirstOrDefault(e => e.Id == executorId);
            if (executor is not null)
                task.Executors.Remove(executor);

            await _db.SaveChangesAsync(ct);
            return (await QueryWithDetails().AsNoTracking().FirstAsync(t => t.Id == id, ct)).ToDto();
        }

        public async Task<IReadOnlyList<TaskCommentDto>> GetCommentsAsync(Guid taskId, CancellationToken ct)
        {
            var task = await _db.ProjectTasks
                .Include(t => t.Comments).ThenInclude(c => c.Student)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId, ct);

            if (task is null) return Array.Empty<TaskCommentDto>();
            return task.Comments.OrderBy(c => c.CreatedAt).Select(c => c.ToDto()).ToList();
        }

        public async Task<TaskCommentDto?> AddCommentAsync(Guid taskId, TaskCommentCreateDto dto, CancellationToken ct)
        {
            var task = await _db.ProjectTasks.FirstOrDefaultAsync(t => t.Id == taskId, ct);
            if (task is null) return null;

            var student = await _db.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Id == dto.StudentId, ct);
            if (student is null)
                throw new InvalidOperationException("Студент не найден");

            var comment = new TaskComment
            {
                TaskId = taskId,
                StudentId = dto.StudentId,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            _db.TaskComments.Add(comment);
            await _db.SaveChangesAsync(ct);

            var created = await _db.TaskComments
                .Include(c => c.Student)
                .AsNoTracking()
                .FirstAsync(c => c.Id == comment.Id, ct);

            return created.ToDto();
        }

        public async Task<TaskCommentDto?> UpdateCommentAsync(Guid taskId, Guid commentId, TaskCommentUpdateDto dto, CancellationToken ct)
        {
            var comment = await _db.TaskComments
                .Include(c => c.Student)
                .FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == taskId, ct);

            if (comment is null) return null;

            comment.Content = dto.Content;
            await _db.SaveChangesAsync(ct);

            return comment.ToDto();
        }

        public async Task<bool> DeleteCommentAsync(Guid taskId, Guid commentId, CancellationToken ct)
        {
            var comment = await _db.TaskComments.FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == taskId, ct);
            if (comment is null) return false;

            _db.TaskComments.Remove(comment);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        private async Task<Project> EnsureProjectExists(Guid projectId, CancellationToken ct)
        {
            var project = await _db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == projectId, ct);
            if (project is null)
                throw new InvalidOperationException("Проект не найден");

            return project;
        }

        private async Task EnsureTeamExists(Guid teamId, CancellationToken ct)
        {
            var exists = await _db.Teams.AnyAsync(t => t.Id == teamId, ct);
            if (!exists)
                throw new InvalidOperationException("Команда не найдена");
        }

        private async Task EnsureSameProjectTask(Guid projectId, Guid taskId, CancellationToken ct, Guid? currentTaskId = null)
        {
            var task = await _db.ProjectTasks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId, ct) ?? throw new InvalidOperationException("Задача не найдена");

            if (task.ProjectId != projectId)
                throw new InvalidOperationException("Связанная задача должна принадлежать тому же проекту");

            if (currentTaskId.HasValue && taskId == currentTaskId.Value)
                throw new InvalidOperationException("Нельзя сделать задачу родителем самой себя");
        }

        private async Task LoadAndAttachDependencies(ProjectTask task, IList<Guid>? ids, CancellationToken ct)
        {
            if (ids is null || ids.Count == 0)
                return;

            var deps = await _db.ProjectTasks
                .Include(t => t.Dependencies)
                .Where(t => ids.Contains(t.Id))
                .ToListAsync(ct);

            if (deps.Count != ids.Count)
                throw new InvalidOperationException("Некоторые зависимости не найдены");

            if (deps.Any(d => d.ProjectId != task.ProjectId))
                throw new InvalidOperationException("Зависимости должны быть в пределах одного проекта");

            if (ids.Contains(task.Id) || deps.Any(d => IsCircularDependency(d, task.Id)))
                throw new InvalidOperationException("Циклическая зависимость недопустима");

            foreach (var dep in deps)
                task.Dependencies.Add(dep);
        }

        private async Task LoadAndAttachExecutors(ProjectTask task, IList<Guid>? ids, CancellationToken ct)
        {
            if (ids is null || ids.Count == 0)
                return;

            var executors = await _db.Executors
                .Include(e => e.Student)
                .Where(e => ids.Contains(e.Id))
                .ToListAsync(ct);

            if (executors.Count != ids.Count)
                throw new InvalidOperationException("Некоторые исполнители не найдены");

            if (executors.Any(e => e.TeamId != task.TeamId))
                throw new InvalidOperationException("Исполнители должны принадлежать команде задачи");

            foreach (var executor in executors)
                task.Executors.Add(executor);
        }

        private bool IsCircularDependency(ProjectTask start, Guid targetId)
        {
            var stack = new Stack<ProjectTask>();
            var visited = new HashSet<Guid>();
            stack.Push(start);

            while (stack.Count > 0)
            {
                var current = stack.Pop();
                if (!visited.Add(current.Id))
                    continue;

                if (current.Dependencies.Any(d => d.Id == targetId))
                    return true;

                foreach (var dep in current.Dependencies)
                    stack.Push(dep);
            }

            return false;
        }

        private async Task<(ProjectTask? task, ProjectTask? dependency)> LoadTasksWithDeps(Guid taskId, Guid dependencyId, CancellationToken ct)
        {
            var tasks = await _db.ProjectTasks
                .Include(t => t.Dependencies)
                .ThenInclude(d => d.Dependencies)
                .Where(t => t.Id == taskId || t.Id == dependencyId)
                .ToListAsync(ct);

            return (tasks.FirstOrDefault(t => t.Id == taskId), tasks.FirstOrDefault(t => t.Id == dependencyId));
        }
    }
}