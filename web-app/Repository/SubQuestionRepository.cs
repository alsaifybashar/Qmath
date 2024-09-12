using Microsoft.EntityFrameworkCore;
using web_app.Model;
using web_app.Model.context;
using web_app.Repository.IRepository;

namespace web_app.Repository
{
    public class SubQuestionRepository : ISubQuestionRepository
    {
        private readonly SubQuestionContext _context;

        public SubQuestionRepository(SubQuestionContext context)
        {
            _context = context;
        }
        public SubQuestion GetSubQuestion(int QuestionId)
        {   
            //test funktion
            //SubQuestions s = new SubQuestions();
            //s.QuestionId = QuestionId;
            //s.subQuestionText = ["exempel", "exepme"];
            //InsertSubQuestion(s);
            
            SubQuestion ans = _context.SubQuestions.First();
            return ans;

        }

        public void InsertSubQuestion(SubQuestion q)
        {
            _context.Add(q);
            _context.SaveChanges();
        }
    }
}
