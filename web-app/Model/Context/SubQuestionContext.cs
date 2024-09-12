using Microsoft.EntityFrameworkCore;

namespace web_app.Model.context
{
    public class SubQuestionContext : DbContext
    {

        public DbSet<SubQuestion> SubQuestions { get; set; }

        public SubQuestionContext(DbContextOptions<SubQuestionContext> options) : base(options)
        { }
        //protected override void OnModelCreating(ModelBuilder modelBuilder)
        //{
        //    modelBuilder.HasDefaultSchema("subquestion");
        //}
    }
}
