using System.Text;
using gantt_server.Data;
using gantt_server.Options;
using gantt_server.Services;
using gantt_server.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// ---------------- JWT ----------------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
          ?? throw new InvalidOperationException("Конфигурация Jwt отсутствует");

if (string.IsNullOrWhiteSpace(jwt.Issuer))
    throw new InvalidOperationException("Jwt:Issuer не настроен");

if (string.IsNullOrWhiteSpace(jwt.Audience))
    throw new InvalidOperationException("Jwt:Audience не настроен");

if (string.IsNullOrWhiteSpace(jwt.Key))
    throw new InvalidOperationException("Jwt:Key не настроен");

static byte[] ResolveJwtKeyBytes(string key)
{
    try
    {
        return Convert.FromBase64String(key);
    }
    catch (FormatException)
    {
        return Encoding.UTF8.GetBytes(key);
    }
}

var jwtKeyBytes = ResolveJwtKeyBytes(jwt.Key);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ---------------- Controllers ----------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = ctx =>
        {
            var errors = ctx.ModelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .ToDictionary(
                    kv => kv.Key.Split('.').Last(),
                    kv => string.Join("; ", kv.Value!.Errors.Select(e => e.ErrorMessage))
                );

            return new BadRequestObjectResult(errors);
        };
    });

// ---------------- Redis ----------------
var redisConn = builder.Configuration["Redis:Connection"];

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    if (string.IsNullOrWhiteSpace(redisConn))
        return ConnectionMultiplexer.Connect("localhost:6379,abortConnect=false");

    var redisConfig = ConfigurationOptions.Parse(redisConn);
    redisConfig.AbortOnConnectFail = false;
    redisConfig.ConnectRetry = 3;
    redisConfig.ConnectTimeout = 5000;
    redisConfig.SyncTimeout = 5000;
    redisConfig.AllowAdmin = true;

    return ConnectionMultiplexer.Connect(redisConfig);
});

// ---------------- Swagger ----------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "gantt_server",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IProjectTaskService, ProjectTaskService>();
builder.Services.AddSingleton<ICacheService, RedisCacheService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var allowedOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                     ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var ex = feature?.Error;

        if (ex != null)
        {
            var logger = context.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("GlobalExceptionHandler");

            logger.LogError(ex, "Unhandled exception");
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new
        {
            error = "Internal server error"
        });
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "gantt_server v1");
    });
}

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();
}

app.UseCors("client");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/debug/redis", async (ICacheService cache, ILogger<Program> logger) =>
{
    var results = new List<string>();

    try
    {
        var testKey = $"test:{Guid.NewGuid()}";
        var testValue = "Redis works!";

        await cache.SetAsync(testKey, testValue, TimeSpan.FromSeconds(30));
        results.Add($"✅ Запись: OK (ключ {testKey})");

        var readValue = await cache.GetAsync<string>(testKey);
        results.Add($"✅ Чтение: {(readValue == testValue ? "OK" : "FAIL")}");

        await cache.RemoveAsync(testKey);
        var afterDelete = await cache.GetAsync<string>(testKey);
        results.Add($"✅ Удаление: {(afterDelete == null ? "OK" : "FAIL")}");

        var counter = 0;

        var result1 = await cache.GetOrSetAsync("test:counter", TimeSpan.FromSeconds(10), async () =>
        {
            counter++;
            return 42;
        });
        results.Add($"✅ GetOrSet (первый вызов): counter={counter}, result={result1}");

        var result2 = await cache.GetOrSetAsync("test:counter", TimeSpan.FromSeconds(10), async () =>
        {
            counter++;
            return 99;
        });
        results.Add($"✅ GetOrSet (второй вызов): counter={counter}, result={result2} (должен быть 42)");

        return Results.Ok(new
        {
            status = "Redis OK",
            checks = results,
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Redis check failed");
        return Results.Problem($"Redis error: {ex.Message}");
    }
});

app.Run();
