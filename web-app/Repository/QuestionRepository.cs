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
            Question ans = _context.Questions.OrderByDescending(q => q.Id).First();
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
            //Question q = new Question { Course = "q", CourseCategory = "q", DifficultyLevel = 1, QuestionText = "svar1", weight = 2 };
            //InsertQuestion(q);
            //Question q1 = new Question { Course = "q", CourseCategory = "q", DifficultyLevel = 1, QuestionText = "svar2", weight = 2 };
            //InsertQuestion(q1);
            //Question q2 = new Question { Course = "q", CourseCategory = "q", DifficultyLevel = 2, QuestionText = "svar3", weight = 2 };
            //InsertQuestion(q2);
            //Question q3 = new Question { Course = "q", CourseCategory = "q", DifficultyLevel = 2, QuestionText = "svar4", weight = 2 };
            //InsertQuestion(q3);

            Question q4 = GetQuestionsByWeight();
            return q4;
        }

        public void InsertQuestion(string text)
        {
            return;
        }
    }
}
