using System.Net.Http.Json;
using System.Text.Json;
using gantt_server.Models;
using gantt_server.Options;
using gantt_server.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace gantt_server.Services
{
    public sealed class TelegramApprovalService : ITelegramApprovalService
    {
        private readonly HttpClient _httpClient;
        private readonly TelegramBotOptions _options;
        private readonly IPendingRegistrationService _pendingRegistrations;
        private readonly ILogger<TelegramApprovalService> _logger;

        public TelegramApprovalService(
            HttpClient httpClient,
            IOptions<TelegramBotOptions> options,
            IPendingRegistrationService pendingRegistrations,
            ILogger<TelegramApprovalService> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _pendingRegistrations = pendingRegistrations;
            _logger = logger;
        }

        public bool IsEnabled =>
            !string.IsNullOrWhiteSpace(_options.BotToken) &&
            _options.AdminChatId.HasValue;

        public async Task SendPendingRegistrationAsync(PendingRegistration pending, CancellationToken ct)
        {
            if (!IsEnabled)
                return;

            var text = $"""
Новая заявка в Reverse Gantt

Имя: {pending.FirstName} {pending.LastName}
Email: {pending.Email}
Создана: {pending.CreatedAt:dd.MM.yyyy HH:mm} UTC
""";

            var payload = new
            {
                chat_id = _options.AdminChatId!.Value,
                text,
                reply_markup = new
                {
                    inline_keyboard = new[]
                    {
                        new[]
                        {
                            new { text = "Одобрить", callback_data = $"approve:{pending.Id}" },
                            new { text = "Отклонить", callback_data = $"reject:{pending.Id}" }
                        }
                    }
                }
            };

            await PostAsync("sendMessage", payload, ct);
        }

        public async Task HandleWebhookAsync(string requestBody, CancellationToken ct)
        {
            if (!IsEnabled || string.IsNullOrWhiteSpace(requestBody))
                return;

            using var document = JsonDocument.Parse(requestBody);
            if (!document.RootElement.TryGetProperty("callback_query", out var callbackQuery))
                return;

            await HandleCallbackQueryAsync(callbackQuery, ct);
        }

        public async Task<long?> PollUpdatesAsync(long? offset, CancellationToken ct)
        {
            if (!IsEnabled)
                return offset;

            var payload = new
            {
                offset,
                timeout = 25,
                allowed_updates = new[] { "callback_query" }
            };

            using var response = await _httpClient.PostAsJsonAsync(
                $"https://api.telegram.org/bot{_options.BotToken}/getUpdates",
                payload,
                ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Telegram API getUpdates failed: {Status} {Body}", response.StatusCode, body);
                return offset;
            }

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            if (!document.RootElement.TryGetProperty("result", out var result) ||
                result.ValueKind != JsonValueKind.Array)
            {
                return offset;
            }

            long? nextOffset = offset;
            foreach (var update in result.EnumerateArray())
            {
                if (update.TryGetProperty("update_id", out var updateIdElement))
                    nextOffset = updateIdElement.GetInt64() + 1;

                if (update.TryGetProperty("callback_query", out var callbackQuery))
                    await HandleCallbackQueryAsync(callbackQuery, ct);
            }

            return nextOffset;
        }

        private async Task HandleCallbackQueryAsync(JsonElement callbackQuery, CancellationToken ct)
        {
            var callbackId = callbackQuery.GetProperty("id").GetString();
            var data = callbackQuery.GetProperty("data").GetString();

            if (!callbackQuery.TryGetProperty("message", out var message) ||
                !message.TryGetProperty("chat", out var chat) ||
                !chat.TryGetProperty("id", out var chatIdElement) ||
                chatIdElement.GetInt64() != _options.AdminChatId)
            {
                await AnswerCallbackAsync(callbackId, "Недостаточно прав", ct);
                return;
            }

            if (string.IsNullOrWhiteSpace(data))
                return;

            var parts = data.Split(':', 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2 || !Guid.TryParse(parts[1], out var registrationId))
            {
                await AnswerCallbackAsync(callbackId, "Неизвестная команда", ct);
                return;
            }

            try
            {
                if (parts[0] == "approve")
                {
                    await _pendingRegistrations.ApproveAsync(registrationId, verificationToken: null, ct);
                    await AnswerCallbackAsync(callbackId, "Заявка подтверждена", ct);
                    await UpdateMessageAsync(message, "Заявка одобрена", ct);
                }
                else if (parts[0] == "reject")
                {
                    await _pendingRegistrations.RejectAsync(registrationId, ct);
                    await AnswerCallbackAsync(callbackId, "Заявка отклонена", ct);
                    await UpdateMessageAsync(message, "Заявка отклонена", ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Telegram approval callback failed for registration {RegistrationId}", registrationId);
                await AnswerCallbackAsync(callbackId, ex.Message, ct);
            }
        }

        private async Task UpdateMessageAsync(JsonElement message, string statusText, CancellationToken ct)
        {
            if (!message.TryGetProperty("chat", out var chat) ||
                !chat.TryGetProperty("id", out var chatId) ||
                !message.TryGetProperty("message_id", out var messageId))
            {
                return;
            }

            var payload = new
            {
                chat_id = chatId.GetInt64(),
                message_id = messageId.GetInt32(),
                text = statusText
            };

            await PostAsync("editMessageText", payload, ct);
        }

        private async Task AnswerCallbackAsync(string? callbackId, string text, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(callbackId))
                return;

            await PostAsync("answerCallbackQuery", new { callback_query_id = callbackId, text }, ct);
        }

        private async Task PostAsync(string method, object payload, CancellationToken ct)
        {
            if (!IsEnabled)
                return;

            using var response = await _httpClient.PostAsJsonAsync(
                $"https://api.telegram.org/bot{_options.BotToken}/{method}",
                payload,
                ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Telegram API {Method} failed: {Status} {Body}", method, response.StatusCode, body);
            }
        }
    }
}
