using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using RentalApi;
using RentalApi.Data;

// колонки в БД - "timestamp without time zone", тому вмикаємо класичну поведінку DateTime
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Render передає порт у змінній PORT
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port)) builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connectionString = ConnectionHelper.Build(builder.Configuration);
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());
builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler(err => err.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    var isDb = ex is DbUpdateException;
    ctx.Response.StatusCode = isDb ? 409 : 500;
    await ctx.Response.WriteAsJsonAsync(new
    {
        message = isDb ? "Операцію не виконано: конфлікт з повʼязаними даними" : "Внутрішня помилка сервера"
    });
}));

await DbInitializer.InitAsync(app.Services);

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html");
app.Run();
