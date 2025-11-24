using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace gantt_server.Dtos.StudentDtos
{
    public sealed class StudentPatchDto
    {
        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public string? Email { get; set; }
    }
}