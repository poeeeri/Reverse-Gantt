using gantt_server.Dtos.ProjectDtos;

namespace gantt_server.Dtos.TeamDtos
{
    public sealed class TeamReadDto
    {
        public Guid Id { get; init; }
        public required string Name { get; init; }
        public string? Description { get; init; }
        public IReadOnlyList<TeamExecutorDto> Executors { get; init; } = Array.Empty<TeamExecutorDto>();
        public IReadOnlyList<ProjectReadDto> Projects { get; init; } = Array.Empty<ProjectReadDto>();
    }
}
