using System.ComponentModel.DataAnnotations;
using gantt_server.Models;

namespace gantt_server.Dtos.ProjectTaskDtos
{
    public sealed class ProjectTaskCreateDto : IValidatableObject
    {
        [Required(ErrorMessage = "Название задачи обязательно")]
        public required string Name { get; set; }

        public string? Description { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Длительность должна быть не меньше 1 дня")]
        public int DurationDays { get; set; } = 1;

        public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.Created;

        public DateTime? Deadline { get; set; }

        public Guid? ParentTaskId { get; set; }

        public Guid ProjectId { get; set; }

        public Guid TeamId { get; set; }

        public IList<Guid>? DependencyIds { get; set; }

        public IList<int>? ExecutorIds { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Deadline.HasValue && Deadline.Value.Kind == DateTimeKind.Unspecified)
            {
                yield return new ValidationResult("Нужно указать дедлайн", new[] { nameof(Deadline) });
            }
        }
    }
}