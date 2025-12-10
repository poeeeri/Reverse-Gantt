using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace gantt_server.Dtos.StudentDtos
{
    public sealed class StudentCreateDto : IValidatableObject
    {
        [Required(ErrorMessage = "Имя не может быть пустым")]
        public string FirstName { get; set; } = null!;

        [Required(ErrorMessage = "Фамилия не может быть пустой")]
        public string LastName { get; set; } = null!;

        [Required(ErrorMessage = "Почта не может быть пустой")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Пароль не может быть пустым")]
        public string Password { get; set; } = null!;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Email is not null && string.IsNullOrWhiteSpace(Email))
            {
                yield return new ValidationResult("Почта не может быть пустой",
                    new[] { nameof(Email) });
            }

            if (Email != null && !Regex.IsMatch(Email, @"^(?=.{1,254}$)(?=.{1,64}@)(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$"))
            {
                yield return new ValidationResult("Невалидный email",
                    new[] { nameof(Email) });
            }
        }
    }
}
