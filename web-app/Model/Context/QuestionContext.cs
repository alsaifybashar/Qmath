using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace web_app.Model.context
{
    public class QuestionContext : DbContext
    {
        public DbSet<Question> Questions { get; set; }

        public QuestionContext(DbContextOptions<QuestionContext> options) : base(options)
        { }
    }
}
