using web_app.Model;
using web_app.Model.context;
using web_app.Repository.IRepository;
namespace web_app.Repository
{
    public class QuestionRepository : IQuestionRepository
    {
        private readonly QuestionContext _context;
        public QuestionRepository(QuestionContext context)
        {
            _context = context;
        }

        public Question GetQuestionsByWeight()
        {
            Question ans = _context.Questions.OrderByDescending(q => q.weight).First();
            return ans;
        }

        public Question GetQuestions(int id)
        {
            Question ans = _context.Questions.First(q => q.Id == id);
            return ans;
        }


        public void InsertQuestion(Question q)
        {
            _context.Add(q);
            _context.SaveChanges();
        }

        public Question GetQuestions()
        {
            //dum test grej innan vi har inserted fråga
            //Question q = new Question { Course= "q", CourseCategory ="q", DifficultyLevel=1, QuestionText="text", weight=2};
            //InsertQuestion(q);
            Question q1 = GetQuestionsByWeight();
            return q1;
        }

        public void InsertQuestion(string text)
        {
            return;
        }
    }
}
