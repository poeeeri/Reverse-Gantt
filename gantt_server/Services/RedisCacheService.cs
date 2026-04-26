using System.Text.Json;
using StackExchange.Redis;

public sealed class RedisCacheService : ICacheService
{
    private readonly IDatabase _db;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConnectionMultiplexer mux, ILogger<RedisCacheService> logger)
    {
        _db = mux.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var v = await _db.StringGetAsync(key);
            return v.HasValue ? JsonSerializer.Deserialize<T>(v!) : default;
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis read failed for key {CacheKey}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl)
    {
        try
        {
            var json = JsonSerializer.Serialize(value);
            await _db.StringSetAsync(key, json, ttl);
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis write failed for key {CacheKey}", key);
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, TimeSpan ttl, Func<Task<T>> factory)
    {
        var cached = await GetAsync<T>(key);
        if (cached is not null && !cached.Equals(default(T))) return cached;

        var fresh = await factory();
        await SetAsync(key, fresh, ttl);
        return fresh;
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _db.KeyDeleteAsync(key);
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis remove failed for key {CacheKey}", key);
        }
    }
}
