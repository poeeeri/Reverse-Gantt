using gantt_server.Dtos.ProjectTaskDtos;
using gantt_server.Models;

namespace gantt_server.Mappings
{
    public static class ProjectTaskMappings
    {
        private static string GetStudentName(TaskComment comment)
        {
            var firstName = comment.Student?.FirstName?.Trim();
            var lastName = comment.Student?.LastName?.Trim();
            var fullName = $"{firstName} {lastName}".Trim();

            return string.IsNullOrWhiteSpace(fullName) ? "Участник команды" : fullName;
        }

        public static ProjectTaskDto ToDto(this ProjectTask task) => new()
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            TeamId = task.TeamId,
            Name = task.Name,
            Description = task.Description,
            DurationDays = task.DurationDays,
            Status = task.Status,
            ParentTaskId = task.ParentTaskId,
            SubtaskIds = task.Subtasks.Select(t => t.Id).ToArray(),
            DependencyIds = task.Dependencies.Select(t => t.Id).ToArray(),
            DependentIds = task.DependentTasks.Select(t => t.Id).ToArray(),
            DependencyTasks = task.Dependencies.Select(t => t.ToReferenceDto()).ToArray(),
            DependentTasks = task.DependentTasks.Select(t => t.ToReferenceDto()).ToArray(),
            Executors = task.Executors.Select(e => e.ToDto()).ToArray(),
            Comments = task.Comments.Select(c => c.ToDto()).ToArray(),
            UnreadCommentsCount = 0,
            AssignedAt = task.AssignedAt
        };

        public static ProjectTaskDto ToDto(this ProjectTask task, Guid viewerStudentId) => new()
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            TeamId = task.TeamId,
            Name = task.Name,
            Description = task.Description,
            DurationDays = task.DurationDays,
            Status = task.Status,
            ParentTaskId = task.ParentTaskId,
            SubtaskIds = task.Subtasks.Select(t => t.Id).ToArray(),
            DependencyIds = task.Dependencies.Select(t => t.Id).ToArray(),
            DependentIds = task.DependentTasks.Select(t => t.Id).ToArray(),
            DependencyTasks = task.Dependencies.Select(t => t.ToReferenceDto()).ToArray(),
            DependentTasks = task.DependentTasks.Select(t => t.ToReferenceDto()).ToArray(),
            Executors = task.Executors.Select(e => e.ToDto()).ToArray(),
            Comments = task.Comments.Select(c => c.ToDto(viewerStudentId)).ToArray(),
            UnreadCommentsCount = task.Comments.Count(c => c.StudentId != viewerStudentId && !c.Reads.Any(r => r.StudentId == viewerStudentId)),
            AssignedAt = task.AssignedAt
        };

        public static IEnumerable<ProjectTaskDto> ToDtos(this IEnumerable<ProjectTask> tasks) =>
            tasks.Select(ToDto);

        public static IEnumerable<ProjectTaskDto> ToDtos(this IEnumerable<ProjectTask> tasks, Guid viewerStudentId) =>
            tasks.Select(t => t.ToDto(viewerStudentId));

        public static ProjectTask ToEntity(this ProjectTaskCreateDto dto) => new()
        {
            Id = Guid.NewGuid(),
            ProjectId = dto.ProjectId,
            TeamId = dto.TeamId,
            Name = dto.Name,
            Description = dto.Description,
            DurationDays = dto.DurationDays,
            Status = dto.Status,
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

        public static TaskCommentDto ToDto(this TaskComment comment) => new()
        {
            Id = comment.Id,
            TaskId = comment.TaskId,
            StudentId = comment.StudentId,
            AuthorName = GetStudentName(comment),
            Content = comment.Content,
            Attachments = comment.Attachments.Select(a => a.ToDto()).ToArray(),
            CreatedAt = comment.CreatedAt,
            IsRead = false
        };

        public static TaskCommentDto ToDto(this TaskComment comment, Guid viewerStudentId) => new()
        {
            Id = comment.Id,
            TaskId = comment.TaskId,
            StudentId = comment.StudentId,
            AuthorName = GetStudentName(comment),
            Content = comment.Content,
            Attachments = comment.Attachments.Select(a => a.ToDto()).ToArray(),
            CreatedAt = comment.CreatedAt,
            IsRead = comment.StudentId == viewerStudentId || comment.Reads.Any(r => r.StudentId == viewerStudentId)
        };

        public static TaskCommentAttachmentDto ToDto(this TaskCommentAttachment attachment) => new()
        {
            Id = attachment.Id,
            ImageDataUrl = attachment.ImageDataUrl,
            CreatedAt = attachment.CreatedAt
        };

        public static ProjectTaskReferenceDto ToReferenceDto(this ProjectTask task) => new()
        {
            Id = task.Id,
            Name = task.Name,
            Status = task.Status
        };
    }
}
