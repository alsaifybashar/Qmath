using web_app.Model;

namespace web_app.Repository.IRepository
{
    public interface ISubQuestionRepository
    {
        SubQuestion GetSubQuestion(int QuestionId);
        void InsertSubQuestion(SubQuestion q);
    }
}
