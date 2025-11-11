using Microsoft.AspNetCore.Mvc;
using gantt_server.Dtos.StudentDtos;
using gantt_server.Services.Interfaces;
using gantt_server.Services;

namespace gantt_server.Controllers
{
    [ApiController]
    [Route("api/students")]
    public sealed class StudentsController : ControllerBase
    {
        private readonly IStudentService _studentService;
        public StudentsController(IStudentService studentService) { _studentService = studentService; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentReadDto>>> GetAll(CancellationToken ct)
            => Ok(await _studentService.GetAllStudents(ct));

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<StudentReadDto>> Get(Guid id, CancellationToken ct)
        {
            var dto = await _studentService.GetStudentById(id, ct);
            return dto == null ? NotFound() : Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<StudentReadDto>> Create([FromBody] StudentCreateDto dto, CancellationToken ct)
        {
            try
            {
                var created = await _studentService.CreateStudent(dto, ct);
                return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
            }
            catch (StudentConflictException conflictEx)
            {
                return Conflict(conflictEx.Errors);
            }

        }

        [HttpPatch("{id:guid}")]
        public async Task<ActionResult<StudentReadDto>> Patch(Guid id, [FromBody] StudentPatchDto dto,
            CancellationToken ct
        )
        {
            var isEmpty =
                dto.FirstName == null &&
                dto.LastName == null &&
                dto.Email == null;

            if (isEmpty)
                return BadRequest(new { error = "изменение не применено. все поля пусты" });

            var result = await _studentService.PatchStudent(id, dto, ct);
            return result is null ? NotFound() : Ok(result);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var ok = await _studentService.DeleteStudent(id, ct);
            return ok ? NoContent() : NotFound();
        }
    }
}
