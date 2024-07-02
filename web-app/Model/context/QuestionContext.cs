using Microsoft.EntityFrameworkCore;

namespace web_app.Model.context
{
    public class QuestionContext : DbContext
    {
        public DbSet<Question> Question { get; set; }

        public QuestionContext(DbContextOptions options) : base(options)
        { }
    }
}
