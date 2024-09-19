using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using web_app.Model.context;
using web_app.Model.Context;
using web_app.Repository;
using web_app.Repository.IRepository;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();
builder.Services.AddScoped<ISubQuestionRepository, SubQuestionRepository>();
builder.Services.AddScoped<IAnswerRepository, AnswerRepository>();



builder.Services.AddDbContext<QuestionContext>(options =>
{
    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
     o => o.MigrationsHistoryTable(
            tableName: HistoryRepository.DefaultTableName,
            schema: "Question"));
});

builder.Services.AddDbContext<SubQuestionContext>(options =>
{
    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
            o => o.MigrationsHistoryTable(
            tableName: HistoryRepository.DefaultTableName,
            schema: "SubQuestion"));
});

builder.Services.AddDbContext<AnswersContext>(options =>
{
    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
             o => o.MigrationsHistoryTable(
            tableName: HistoryRepository.DefaultTableName,
            schema: "Answer"));
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
    name: "deafult",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");

app.Run();

