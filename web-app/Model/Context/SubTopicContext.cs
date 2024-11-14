using Microsoft.EntityFrameworkCore;

namespace web_app.Model.Context
{
    public class SubTopicContext : DbContext
    {
        public DbSet<SubTopic> SubTopics { get; set; }

        public SubTopicContext(DbContextOptions<SubTopicContext> options) : base(options)
        { }
    }
}
