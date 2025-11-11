using gantt_server.Dtos.StudentDtos;
using gantt_server.Models;

namespace gantt_server.Mappings
{
    public static class StudentMappings
    {
        public static StudentReadDto ToReadDto(this Student s) => new()
        {
            Id = s.Id,
            FirstName = s.FirstName,
            LastName = s.LastName,
            Email = s.Email,
            Executors = Array.Empty<ExecutorReadDto>()
        };

        public static IEnumerable<StudentReadDto> ToReadDtos(this IEnumerable<Student> src) =>
            src.Select(ToReadDto);

        public static Student ToCreate(this StudentCreateDto dto) => new()
        {
            Id = Guid.NewGuid(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email
        };

        public static void Apply(this Student entity, StudentPatchDto dto)
        {
            if (dto.FirstName is not null)
                entity.FirstName = dto.FirstName;

            if (dto.LastName is not null)
                entity.LastName = dto.LastName;
                
            if (dto.Email is not null) 
                entity.Email = dto.Email;
        }
    }
}

