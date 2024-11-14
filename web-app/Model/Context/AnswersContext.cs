using Microsoft.EntityFrameworkCore;

namespace web_app.Model.Context
{
    public class AnswersContext : DbContext
    {
        public DbSet<Answers> Answers { get; set; }

        public AnswersContext(DbContextOptions<AnswersContext> options) : base(options)
        { }
    }
}
