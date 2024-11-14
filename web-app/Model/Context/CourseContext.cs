using Microsoft.EntityFrameworkCore;

namespace web_app.Model.Context
{
    public class CourseContext : DbContext
    {
        public DbSet<Course> Courses { get; set; }

        public CourseContext(DbContextOptions<CourseContext> options) : base(options)
        { }
    }
}
