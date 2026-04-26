using gantt_server.Options;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace gantt_server.Controllers
{
    [ApiController]
    [Route("api/integrations/telegram")]
    public sealed class TelegramBotController : ControllerBase
    {
        private readonly ITelegramApprovalService _telegramApprovalService;
        private readonly TelegramBotOptions _options;

        public TelegramBotController(
            ITelegramApprovalService telegramApprovalService,
            IOptions<TelegramBotOptions> options)
        {
            _telegramApprovalService = telegramApprovalService;
            _options = options.Value;
        }

        [HttpPost("webhook/{secret?}")]
        public async Task<IActionResult> Webhook([FromRoute] string? secret, CancellationToken ct)
        {
            if (!_telegramApprovalService.IsEnabled)
                return NotFound();

            if (!string.IsNullOrWhiteSpace(_options.WebhookSecret) &&
                !string.Equals(secret, _options.WebhookSecret, StringComparison.Ordinal))
            {
                return Unauthorized();
            }

            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync(ct);
            await _telegramApprovalService.HandleWebhookAsync(body, ct);
            return Ok();
        }
    }
}
