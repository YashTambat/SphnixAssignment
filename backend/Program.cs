// Program.cs
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
//using Microsoft.EntityFrameworkCore.InMemory;
using PositionStore.Models;


var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Positions") ?? "Data Source=Positions.db";

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSqlite<PositionDbContext>(connectionString);

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PositionStore API",
        Description = "Managing positions on a canvas",
        Version = "v1"
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseSwagger();

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PositionStore API V1");
});

// Use CORS
app.UseCors();

app.MapGet("/", () => "Hello World!");


app.MapGet("/positions", async (PositionDbContext db) => await db.Positions.ToListAsync());

app.MapPost("/position", async (PositionDbContext db, Position position) =>
{
    var existingPosition = await db.Positions.FindAsync(position.Id);

    if (existingPosition != null)
    {
        // Entry with the same ID exists, update its xPos and yPos
        existingPosition.x = position.x;
        existingPosition.y = position.y;
    }
    else
    {
        // Entry does not exist, create a new one
        await db.Positions.AddAsync(position);
    }

    await db.SaveChangesAsync();
    return Results.Created($"/position/{position.Id}", position);
});



app.MapDelete("/positions", async (PositionDbContext db) =>
{
    try
    {
        db.Positions.RemoveRange(db.Positions);
        await db.SaveChangesAsync();
        return Results.Ok("All positions deleted successfully");
    }
    catch (Exception ex)
    {
        return Results.BadRequest("Failed to delete positions: " + ex.Message);
    }
});



app.Run();
