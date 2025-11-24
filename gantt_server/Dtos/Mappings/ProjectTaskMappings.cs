using gantt_server.Dtos.ProjectTaskDtos;
using gantt_server.Models;

namespace gantt_server.Mappings
{
    public static class ProjectTaskMappings
    {
        public static ProjectTaskDto ToDto(this ProjectTask task) => new()
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            TeamId = task.TeamId,
            Name = task.Name,
            Description = task.Description,
            DurationDays = task.DurationDays,
            Status = task.Status,
            Deadline = task.Deadline,
            ParentTaskId = task.ParentTaskId,
            SubtaskIds = task.Subtasks.Select(t => t.Id).ToArray(),
            DependencyIds = task.Dependencies.Select(t => t.Id).ToArray(),
            DependentIds = task.DependentTasks.Select(t => t.Id).ToArray(),
            Executors = task.Executors.Select(e => e.ToDto()).ToArray(),
            AssignedAt = task.AssignedAt
        };

        public static IEnumerable<ProjectTaskDto> ToDtos(this IEnumerable<ProjectTask> tasks) =>
            tasks.Select(ToDto);

        public static ProjectTask ToEntity(this ProjectTaskCreateDto dto) => new()
        {
            Id = Guid.NewGuid(),
            ProjectId = dto.ProjectId,
            TeamId = dto.TeamId,
            Name = dto.Name,
            Description = dto.Description,
            DurationDays = dto.DurationDays,
            Status = dto.Status,
            Deadline = dto.Deadline,
            ParentTaskId = dto.ParentTaskId,
            AssignedAt = DateTime.UtcNow
        };

        public static void Apply(this ProjectTask entity, ProjectTaskUpdateDto dto)
        {
            if (dto.Name is not null)
                entity.Name = dto.Name;

            if (dto.Description is not null)
                entity.Description = dto.Description;

            if (dto.DurationDays.HasValue)
                entity.DurationDays = dto.DurationDays.Value;

            if (dto.Status.HasValue)
                entity.Status = dto.Status.Value;

            if (dto.Deadline.HasValue)
                entity.Deadline = dto.Deadline;

            if (dto.ParentTaskId.HasValue)
                entity.ParentTaskId = dto.ParentTaskId;
        }

        public static ProjectTaskExecutorDto ToDto(this Executor executor) => new()
        {
            Id = executor.Id,
            StudentId = executor.StudentId,
            StudentName = $"{executor.Student.FirstName} {executor.Student.LastName}".Trim(),
            Role = executor.Role,
            JoinedAt = executor.JoinedAt
        };
    }
}