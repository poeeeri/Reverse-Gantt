using gantt_server.Dtos.AuthDtos;
using gantt_server.Models;

namespace gantt_server.Mappings
{
    public static class AuthMappings
    {
        public static Student ToStudent(this AuthRegisterDto dto)
        {
            var email = StudentMappings.NormalizeEmail(dto.Email);
            // var (first, last) = StudentMappings.SplitDisplayName(dto.Name, email);

            return new Student
            {
                Id = Guid.NewGuid(),
                FirstName = dto.Name,
                LastName = dto.LastName,
                Email = email,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static AuthStudentDto ToAuthStudentDto(this Student student) => new()
        {
            Id = student.Id,
            Email = student.Email,
            FirstName = student.FirstName,
            LastName = student.LastName
        };
    }
}
