using Microsoft.EntityFrameworkCore;

namespace web_app.Model.Context
{
    public class TopicContext : DbContext
    {
        public DbSet<Topic> Topics { get; set; }

        public TopicContext(DbContextOptions<TopicContext> options) : base(options)
        { }
    }
}
