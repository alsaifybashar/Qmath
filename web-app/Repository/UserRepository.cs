using web_app.Model.Context;

namespace web_app.Repository
{
    public class UserRepository
    {
        private readonly UserContext _context;
        public UserRepository(UserContext context)
        {
            _context = context;
        }
    }
}
