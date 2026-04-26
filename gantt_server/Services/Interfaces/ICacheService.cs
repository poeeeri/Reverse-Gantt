public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan ttl);
    Task<T> GetOrSetAsync<T>(string key, TimeSpan ttl, Func<Task<T>> factory);
    Task RemoveAsync(string key);
}
