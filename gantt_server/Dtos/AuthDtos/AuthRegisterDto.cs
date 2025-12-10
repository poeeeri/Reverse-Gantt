using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace gantt_server.Dtos.AuthDtos
{
    public sealed class AuthRegisterDto : IValidatableObject
    {
        public required string Name { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (string.IsNullOrWhiteSpace(Email))
            {
                yield return new ValidationResult("Email не может быть пустым",
                    new[] { nameof(Email) });
            }

            if (!Regex.IsMatch(Email, @"^(?=.{1,254}$)(?=.{1,64}@)(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$"))
            {
                yield return new ValidationResult("Невалидный email",
                    new[] { nameof(Email) });
            }

            if (string.IsNullOrWhiteSpace(Password))
            {
                yield return new ValidationResult("Пароль не может быть пустым",
                    new[] { nameof(Password) });
            }

            if (Password.Length < 8)
            {
                yield return new ValidationResult("Пароль должен содержать минимум 8 символов",
                    new[] { nameof(Password) });
            }

            if (!Regex.IsMatch(Password, @"[A-Za-z]"))
            {
                yield return new ValidationResult("Пароль должен содержать буквы",
                    new[] { nameof(Password) });
            }

            if (!Regex.IsMatch(Password, @"[0-9]"))
            {
                yield return new ValidationResult("Пароль должен содержать цифры",
                    new[] { nameof(Password) });
            }

            if (string.IsNullOrWhiteSpace(Name))
            {
                yield return new ValidationResult("Имя не может быть пустым",
                    new[] { nameof(Name) });
            }

            if (string.IsNullOrWhiteSpace(LastName))
            {
                yield return new ValidationResult("Фамилия не может быть пустым",
                    new[] { nameof(LastName) });
            }
        }
    }
}


// using System.ComponentModel.DataAnnotations;
// using System.Text.RegularExpressions;

// namespace gantt_server.Dtos.AuthDtos
// {
//     public sealed class AuthRegisterDto : IValidatableObject
//     {
//         public required string Email { get; set; }
//         public required string Password { get; set; }
//         public required string Name { get; set; }
//         public required string LastName { get; set; }
//         public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
//         {
//             if (Email is not null && string.IsNullOrWhiteSpace(Email))
//             {
//                 yield return new ValidationResult("невалидный email",
//                     new[] { nameof(Email) });
//             }

//             if (Email != null && !Regex.IsMatch(Email, @"^(?=.{1,254}$)(?=.{1,64}@)(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$"))
//             {
//                 yield return new ValidationResult("невалидный email",
//                     new[] { nameof(Email) });
//             }

//             if (Password.Length < 8)
//             {
//                 yield return new ValidationResult("Пароль не может быть меньше 8 символов",
//                     new[] { nameof(Password) });
//             }
//         }
//     }
// }