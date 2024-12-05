using web_app.Model.Context;
using web_app.Repository.IRepository;

namespace web_app.Repository
{
    public class UserRepository:IUserRepository
    {
        private readonly UserContext _context;
        public UserRepository(UserContext context)
        {
            _context = context;
        }
        public void insertUser(Model.User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges();
        }
    }
}
