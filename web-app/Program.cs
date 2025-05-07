using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using web_app.Model.context;
using web_app.Model.Context;
using web_app.Repository;
using web_app.Repository.IRepository;
using MySql.EntityFrameworkCore.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();
builder.Services.AddScoped<ISubQuestionRepository, SubQuestionRepository>();
builder.Services.AddScoped<IAnswerRepository, AnswerRepository>();


var connectionString = "server=localhost;database=QMath;user=root;password=yourpassword;";


builder.Services.AddDbContext<QuestionContext>(options =>
{
    options.UseMySQL(connectionString);
});

builder.Services.AddDbContext<SubQuestionContext>(options =>
{
    options.UseMySQL(connectionString);
});

builder.Services.AddDbContext<AnswersContext>(options =>
{
    options.UseMySQL(connectionString);
});


builder.Services.AddDbContext<TopicContext>(options =>
{
    options.UseMySQL(connectionString);
});

builder.Services.AddDbContext<SubTopicContext>(options =>
{
    options.UseMySQL(connectionString);
});

builder.Services.AddDbContext<UserContext>(options =>
{
    options.UseMySQL(connectionString);
});
//builder.Services.AddDbContext<QuestionContext>(options =>
//{
//    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
//     o => o.MigrationsHistoryTable(
//            tableName: HistoryRepository.DefaultTableName,
//            schema: "Question"));
//});

//builder.Services.AddDbContext<SubQuestionContext>(options =>
//{
//    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
//            o => o.MigrationsHistoryTable(
//            tableName: HistoryRepository.DefaultTableName,
//            schema: "SubQuestion"));
//});

//builder.Services.AddDbContext<AnswersContext>(options =>
//{
//    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
//             o => o.MigrationsHistoryTable(
//            tableName: HistoryRepository.DefaultTableName,
//            schema: "Answer"));
//});

////builder.Services.AddDbContext<CourseContext>(options =>
////{
////    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
////             o => o.MigrationsHistoryTable(
////            tableName: HistoryRepository.DefaultTableName,
////            schema: "Course"));
////});

//builder.Services.AddDbContext<TopicContext>(options =>
//{
//    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
//             o => o.MigrationsHistoryTable(
//            tableName: HistoryRepository.DefaultTableName,
//            schema: "Topic"));
//});
//builder.Services.AddDbContext<SubTopicContext>(options =>
//{
//    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
//             o => o.MigrationsHistoryTable(
//            tableName: HistoryRepository.DefaultTableName,
//            schema: "SubTopic"));
//});
//builder.Services.AddDbContext<UserContext>(options =>
//{
//    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
//             o => o.MigrationsHistoryTable(
//            tableName: HistoryRepository.DefaultTableName,
//            schema: "User"));
//});


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

