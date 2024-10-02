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
            //console.writeline(ans);
            return ans;

            // Get a list of all topics and their respective weights from the database
            // Input them as a list of weights and randomly choose a topic with the reverse of that score
            // Randomize a question from that topic 
            // Need a separate table for user topic weights 

            // Hur ser databasen ut exakt, vad har vi för tables? Samma som repository?
            // Tror inte merge mellan master och server add fick med allt
            // Hur får jag igång databas så det funkar på min sida också? Skicka över fil?
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
