using System.Text.Json;
using StackExchange.Redis;

public sealed class RedisCacheService : ICacheService
{
    private readonly IDatabase _db;
    public RedisCacheService(IConnectionMultiplexer mux) => _db = mux.GetDatabase();

    public async Task<T?> GetAsync<T>(string key)
    {
        var v = await _db.StringGetAsync(key);
        return v.HasValue ? JsonSerializer.Deserialize<T>(v!) : default;
    }

    public Task SetAsync<T>(string key, T value, TimeSpan ttl)
    {
        var json = JsonSerializer.Serialize(value);
        return _db.StringSetAsync(key, json, ttl);
    }

    public async Task<T> GetOrSetAsync<T>(string key, TimeSpan ttl, Func<Task<T>> factory)
    {
        var cached = await GetAsync<T>(key);
        if (cached is not null && !cached.Equals(default(T))) return cached;

        var fresh = await factory();
        await SetAsync(key, fresh, ttl);
        return fresh;
    }

    public Task RemoveAsync(string key) => _db.KeyDeleteAsync(key);
}
