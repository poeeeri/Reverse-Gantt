namespace gantt_server.Options
{
    public sealed class EmailOptions
    {
        public string? SmtpHost { get; set; }
        public int SmtpPort { get; set; } = 587;
        public bool EnableSsl { get; set; } = true;
        public string? SmtpUsername { get; set; }
        public string? SmtpPassword { get; set; }
        public string? FromEmail { get; set; }
        public string? FromName { get; set; }
        public string? ConfirmationBaseUrl { get; set; }
    }
}
