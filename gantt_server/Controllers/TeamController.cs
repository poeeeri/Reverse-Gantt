using gantt_server.Dtos.TeamDtos;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace gantt_server.Controllers
{
    [ApiController]
    [Route("api/teams")]
    [Authorize]
    public sealed class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamReadDto>>> GetAll(CancellationToken ct)
            => Ok(await _teamService.GetAllAsync(ct));

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<TeamReadDto>> Get(Guid id, CancellationToken ct)
        {
            var dto = await _teamService.GetByIdAsync(id, ct);
            return dto is null ? NotFound() : Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<TeamReadDto>> Create([FromBody] TeamCreateDto dto, CancellationToken ct)
        {
            var created = await _teamService.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPatch("{id:guid}")]
        public async Task<ActionResult<TeamReadDto>> Update(Guid id, [FromBody] TeamUpdateDto dto, CancellationToken ct)
        {
            var updated = await _teamService.UpdateAsync(id, dto, ct);
            return updated is null ? NotFound() : Ok(updated);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var ok = await _teamService.DeleteAsync(id, ct);
            return ok ? NoContent() : NotFound();
        }

        [HttpPost("{id:guid}/executors")]
        public async Task<ActionResult<TeamExecutorDto>> AddExecutor(Guid id, [FromBody] TeamAddExecutorDto dto, CancellationToken ct)
        {
            try
            {
                var executor = await _teamService.AddExecutorAsync(id, dto, ct);
                return Ok(executor);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{teamId:guid}/executors/{executorId:int}")]
        public async Task<IActionResult> RemoveExecutor(Guid teamId, Guid executorId, CancellationToken ct)
        {
            var ok = await _teamService.RemoveExecutorAsync(teamId, executorId, ct);
            return ok ? NoContent() : NotFound();
        }
    }
}
