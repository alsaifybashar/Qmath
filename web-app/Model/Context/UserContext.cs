using Microsoft.EntityFrameworkCore;

namespace web_app.Model.Context
{
    public class UserContext : DbContext
    {
        public DbSet<User> Users { get; set; }

        public UserContext(DbContextOptions<UserContext> options) : base(options)
        { }
    }
}
