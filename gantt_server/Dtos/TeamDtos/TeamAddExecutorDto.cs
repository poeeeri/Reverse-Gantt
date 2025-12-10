using gantt_server.Models;

namespace gantt_server.Dtos.TeamDtos
{
    public sealed class TeamAddExecutorDto
    {
        public Guid StudentId { get; init; }
        public ExecutorRole Role { get; init; } = ExecutorRole.Member;
    }
}
