using web_app.Model;

namespace web_app.Repository.IRepository
{
    public interface IQuestionRepository
    {
        Question GetQuestions();
        
        void InsertQuestion(string text);

        Question GetQuestionsByWeight();

        Question GetQuestions(int id);

        void InsertQuestion(Question q);

    }
}
