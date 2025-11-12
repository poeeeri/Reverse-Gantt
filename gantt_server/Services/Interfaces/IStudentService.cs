using gantt_server.Dtos.StudentDtos;

namespace gantt_server.Services.Interfaces
{
    public interface IStudentService
    {
        Task<IReadOnlyList<StudentReadDto>> GetAllStudents(CancellationToken ct);
        Task<StudentReadDto?> GetStudentById(Guid id, CancellationToken ct);
        Task<StudentReadDto> CreateStudent(StudentCreateDto dto, CancellationToken ct);
        Task<StudentReadDto?> PatchStudent(Guid id, StudentPatchDto dto, CancellationToken ct);
        Task<bool> DeleteStudent(Guid id, CancellationToken ct);
        Task<StudentReadDto> EnsureStudent(EnsureStudentDto dto, CancellationToken ct);
    }   
}
