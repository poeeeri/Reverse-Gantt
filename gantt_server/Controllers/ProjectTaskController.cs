using gantt_server.Dtos.ProjectTaskDtos;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace gantt_server.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public sealed class ProjectTasksController : ControllerBase
    {
        private readonly IProjectTaskService _projectTaskService;

        public ProjectTasksController(IProjectTaskService projectTaskService) { _projectTaskService = projectTaskService; }

        [HttpGet("projects/{projectId:guid}/tasks")]
        public async Task<ActionResult<IEnumerable<ProjectTaskDto>>> GetByProject(Guid projectId, CancellationToken ct)
        {
            var items = await _projectTaskService.GetByProjectAsync(projectId, ct);
            return Ok(items);
        }

        [HttpGet("tasks/{id:guid}")]
        public async Task<ActionResult<ProjectTaskDto>> Get(Guid id, CancellationToken ct)
        {
            var dto = await _projectTaskService.GetByIdAsync(id, ct);
            return dto is null ? NotFound() : Ok(dto);
        }

        [HttpPost("projects/{projectId:guid}/tasks")]
        public async Task<ActionResult<ProjectTaskDto>> Create(Guid projectId, [FromBody] ProjectTaskCreateDto dto, CancellationToken ct)
        {
            dto.ProjectId = projectId;
            var created = await _projectTaskService.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPatch("tasks/{id:guid}")]
        public async Task<ActionResult<ProjectTaskDto>> Update(Guid id, [FromBody] ProjectTaskUpdateDto dto, CancellationToken ct)
        {
            var updated = await _projectTaskService.UpdateAsync(id, dto, ct);
            return updated is null ? NotFound() : Ok(updated);
        }

        [HttpDelete("tasks/{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var ok = await _projectTaskService.DeleteAsync(id, ct);
            return ok ? NoContent() : NotFound();
        }

        [HttpPatch("tasks/{id:guid}/status")]
        public async Task<IActionResult> SetStatus(Guid id, [FromBody] ProjectTaskStatusDto dto, CancellationToken ct)
        {
            var ok = await _projectTaskService.SetStatusAsync(id, dto.Status, ct);
            return ok ? NoContent() : NotFound();
        }

        [HttpPost("tasks/{id:guid}/dependencies")]
        public async Task<ActionResult<ProjectTaskDto>> AddDependency(Guid id, [FromBody] Guid dependencyId, CancellationToken ct)
        {
            var dto = await _projectTaskService.AddDependencyAsync(id, dependencyId, ct);
            return dto is null ? NotFound() : Ok(dto);
        }

        [HttpDelete("tasks/{id:guid}/dependencies/{dependencyId:guid}")]
        public async Task<ActionResult<ProjectTaskDto>> RemoveDependency(Guid id, Guid dependencyId, CancellationToken ct)
        {
            var dto = await _projectTaskService.RemoveDependencyAsync(id, dependencyId, ct);
            return dto is null ? NotFound() : Ok(dto);
        }

        [HttpPost("tasks/{id:guid}/executors")]
        public async Task<ActionResult<ProjectTaskDto>> AssignExecutor(Guid id, [FromBody] Guid executorId, CancellationToken ct)
        {
            var dto = await _projectTaskService.AssignExecutorAsync(id, executorId, ct);
            return dto is null ? NotFound() : Ok(dto);
        }

        [HttpDelete("tasks/{id:guid}/executors/{executorId:guid}")]
        public async Task<ActionResult<ProjectTaskDto>> UnassignExecutor(Guid id, Guid executorId, CancellationToken ct)
        {
            var dto = await _projectTaskService.UnassignExecutorAsync(id, executorId, ct);
            return dto is null ? NotFound() : Ok(dto);
        }

        [HttpGet("tasks/{id:guid}/comments")]
        public async Task<ActionResult<IEnumerable<TaskCommentDto>>> GetComments(Guid id, CancellationToken ct)
        {
            var items = await _projectTaskService.GetCommentsAsync(id, ct);
            return Ok(items);
        }

        [HttpPost("tasks/{id:guid}/comments")]
        public async Task<ActionResult<TaskCommentDto>> AddComment(Guid id, [FromBody] TaskCommentCreateDto dto, CancellationToken ct)
        {
            var created = await _projectTaskService.AddCommentAsync(id, dto, ct);
            return created is null ? NotFound() : Ok(created);
        }

        [HttpPatch("tasks/{taskId:guid}/comments/{commentId:guid}")]
        public async Task<ActionResult<TaskCommentDto>> UpdateComment(Guid taskId, Guid commentId, [FromBody] TaskCommentUpdateDto dto, CancellationToken ct)
        {
            var updated = await _projectTaskService.UpdateCommentAsync(taskId, commentId, dto, ct);
            return updated is null ? NotFound() : Ok(updated);
        }

        [HttpDelete("tasks/{taskId:guid}/comments/{commentId:guid}")]
        public async Task<IActionResult> DeleteComment(Guid taskId, Guid commentId, CancellationToken ct)
        {
            var ok = await _projectTaskService.DeleteCommentAsync(taskId, commentId, ct);
            return ok ? NoContent() : NotFound();
        }
    }
}