using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using RentalApi.Data;

namespace RentalApi;

public static class Statuses
{
    public static readonly string[] Equipment = { "доступний", "в оренді", "на ТО", "списано" };
    public static readonly string[] Rental = { "активна", "завершена", "скасована" };
}

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

public static class QueryExtensions
{
    public static IOrderedQueryable<T> SortBy<T, TKey>(this IQueryable<T> q, Expression<Func<T, TKey>> key, bool desc)
        => desc ? q.OrderByDescending(key) : q.OrderBy(key);

    public static async Task<PagedResult<T>> ToPagedAsync<T>(this IQueryable<T> q, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var total = await q.CountAsync();
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<T>(items, total, page, pageSize);
    }

    public static string? Clean(this string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}

public static class ConnectionHelper
{
    // Підтримує і формат Npgsql, і URL виду postgresql://user:pass@host:port/db (Render, Neon)
    public static string Build(IConfiguration cfg)
    {
        var url = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrWhiteSpace(url))
            return cfg.GetConnectionString("Default") ?? throw new InvalidOperationException("Немає рядка підключення");
        if (!url.StartsWith("postgres")) return url;

        var uri = new Uri(url);
        var userInfo = uri.UserInfo.Split(':', 2);
        var b = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
            Database = uri.AbsolutePath.TrimStart('/')
        };
        if (url.Contains("sslmode=require")) b.SslMode = SslMode.Require;
        return b.ToString();
    }
}

public static class DbInitializer
{
    // Якщо таблиць немає - створює схему і заливає дані з init.sql
    public static async Task InitAsync(IServiceProvider services)
    {
        var log = services.GetRequiredService<ILoggerFactory>().CreateLogger("DbInit");
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                using var scope = services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var conn = db.Database.GetDbConnection();
                await conn.OpenAsync();
                await using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT to_regclass('public.users') IS NOT NULL";
                var exists = (bool)(await cmd.ExecuteScalarAsync())!;
                if (!exists)
                {
                    log.LogInformation("Таблиць не знайдено - виконую init.sql");
                    cmd.CommandText = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "init.sql"));
                    await cmd.ExecuteNonQueryAsync();
                }
                await conn.CloseAsync();
                log.LogInformation("База даних готова");
                return;
            }
            catch (Exception ex) when (attempt < 10)
            {
                log.LogWarning("БД недоступна (спроба {Attempt}): {Message}", attempt, ex.Message);
                await Task.Delay(3000);
            }
        }
    }
}
