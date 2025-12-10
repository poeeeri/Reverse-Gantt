namespace gantt_server.Options
{
    public sealed class JwtOptions
    {
        public string Issuer { get; set; } = "gantt-server";
        public string Audience { get; set; } = "gantt-client";
        public required string Key { get; set; }
        public int LifetimeMinutes { get; set; } = 60;
    }
}