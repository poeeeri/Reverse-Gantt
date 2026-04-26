namespace gantt_server.Options
{
    public sealed class TelegramBotOptions
    {
        public string? BotToken { get; set; }
        public long? AdminChatId { get; set; }
        public string? WebhookSecret { get; set; }
    }
}
