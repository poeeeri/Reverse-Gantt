var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();      // если Microsoft.AspNetCore.OpenApi

var app = builder.Build();
app.MapOpenApi();                   // если Microsoft.AspNetCore.OpenApi
app.MapControllers();
app.Run();
