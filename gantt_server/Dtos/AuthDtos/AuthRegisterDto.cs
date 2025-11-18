using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace gantt_server.Dtos.AuthDtos
{
    public sealed class AuthRegisterDto : IValidatableObject
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string Name { get; set; }
        public required string LastName { get; set; }
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Email is not null && string.IsNullOrWhiteSpace(Email))
            {
                yield return new ValidationResult("невалидный email",
                    new[] { nameof(Email) });
            }

            if (Email != null && !Regex.IsMatch(Email, @"^(?=.{1,254}$)(?=.{1,64}@)(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$"))
            {
                yield return new ValidationResult("невалидный email",
                    new[] { nameof(Email) });
            }

            if (Password.Length < 8)
            {
                yield return new ValidationResult("Пароль не может быть меньше 8 символов",
                    new[] { nameof(Password) });
            }
        }
    }
}