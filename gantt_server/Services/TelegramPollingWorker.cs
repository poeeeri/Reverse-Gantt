using gantt_server.Services.Interfaces;

namespace gantt_server.Services
{
    public sealed class TelegramPollingWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TelegramPollingWorker> _logger;
        private long? _offset;

        public TelegramPollingWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<TelegramPollingWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var telegramApprovalService = scope.ServiceProvider.GetRequiredService<ITelegramApprovalService>();

                    if (!telegramApprovalService.IsEnabled)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                        continue;
                    }

                    var nextOffset = await telegramApprovalService.PollUpdatesAsync(_offset, stoppingToken);
                    if (nextOffset.HasValue)
                        _offset = nextOffset;
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Telegram polling iteration failed");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
        }
    }
}
