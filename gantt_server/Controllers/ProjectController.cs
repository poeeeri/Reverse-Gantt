using gantt_server.Dtos.ProjectDtos;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace gantt_server.Controllers
{
    [ApiController]
    [Route("api/projects")]
    [Authorize]
    public sealed class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectsController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectReadDto>>> GetAll(CancellationToken ct)
        {
            var items = await _projectService.GetAllAsync(ct);
            return Ok(items);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ProjectReadDto>> Get(Guid id, CancellationToken ct)
        {
            var project = await _projectService.GetByIdAsync(id, ct);
            return project is null ? NotFound() : Ok(project);
        }

        [HttpPost]
        public async Task<ActionResult<ProjectReadDto>> Create([FromBody] ProjectCreateDto dto, CancellationToken ct)
        {
            var created = await _projectService.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPatch("{id:guid}")]
        public async Task<ActionResult<ProjectReadDto>> Update(Guid id, [FromBody] ProjectUpdateDto dto, CancellationToken ct)
        {
            var updated = await _projectService.UpdateAsync(id, dto, ct);
            return updated is null ? NotFound() : Ok(updated);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var ok = await _projectService.DeleteAsync(id, ct);
            return ok ? NoContent() : NotFound();
        }
    }
}
