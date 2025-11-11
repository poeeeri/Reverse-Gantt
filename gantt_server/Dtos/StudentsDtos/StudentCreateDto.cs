using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace gantt_server.Dtos.StudentDtos
{
    public sealed class StudentCreateDto : IValidatableObject
    {
        [Required(ErrorMessage = "поле обязательно должно быть заполнено")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "поле обязательно должно быть заполнено")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "поле обязательно должно быть заполнено")]
        public string Email { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Email is not null && string.IsNullOrWhiteSpace(Email))
            {
                yield return new ValidationResult("невалидный email", 
                    new[] { nameof(Email) });
            }    


            if (Email != null && !Regex.IsMatch(Email, @"^(?=.{1,254}$)(?=.{1,64}@)(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$")
            )
            {
                yield return new ValidationResult("невалидный email",
                    new[] { nameof(Email) });
            }
        }
    }
}
