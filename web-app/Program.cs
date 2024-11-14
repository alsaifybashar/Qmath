var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllersWithViews();

//builder.Services.AddDbContext<CourseContext>(options =>
//{
//    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
//             o => o.MigrationsHistoryTable(
//            tableName: HistoryRepository.DefaultTableName,
//            schema: "Course"));
//});

builder.Services.AddDbContext<TopicContext>(options =>
{
    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
             o => o.MigrationsHistoryTable(
            tableName: HistoryRepository.DefaultTableName,
            schema: "Topic"));
});
builder.Services.AddDbContext<SubTopicContext>(options =>
{
    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
             o => o.MigrationsHistoryTable(
            tableName: HistoryRepository.DefaultTableName,
            schema: "SubTopic"));
});
builder.Services.AddDbContext<UserContext>(options =>
{
    options.UseSqlServer("server = DESKTOP-IHI3C6H\\SQLEXPRESS;database=QMath;trusted_connection=true;trustservercertificate=true;",
             o => o.MigrationsHistoryTable(
            tableName: HistoryRepository.DefaultTableName,
            schema: "User"));
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

