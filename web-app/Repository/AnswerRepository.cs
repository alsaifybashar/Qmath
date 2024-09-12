using web_app.Model;
using web_app.Model.Context;
using web_app.Repository.IRepository;

namespace web_app.Repository
{
    public class AnswerRepository : IAnswerRepository
    {
        private readonly AnswersContext _context;
        public AnswerRepository(AnswersContext context)
        {
            _context = context;
        }

        public Answers GetAns(int QuestionId)
        {
            Answers ans = _context.Answers.First();
            return ans;
        }

        public void InsertAns(Answers a)
        {
            _context.Add(a);
            _context.SaveChanges();
        }
    }
}
