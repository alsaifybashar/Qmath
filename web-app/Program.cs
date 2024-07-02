using Microsoft.EntityFrameworkCore;
using web_app.Model.context;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllersWithViews();

//För varje context vi lägger till så måste vi lägga till den innan vi bygger sidan.
//Vi kan skriva om den lite senare då vi har bättre koll på vad och hur saker ska kopplas ihop.
builder.Services.AddDbContext<QuestionContext>(options =>
{
    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=qMath;trusted_connection=true;trustservercertificate=true;");
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();


app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");

app.Run();

