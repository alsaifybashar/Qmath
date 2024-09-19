using web_app.Model;

namespace web_app.Repository.IRepository
{
    public interface IAnswerRepository
    {
        Answers GetAns(int QuestionId);
        void InsertAns(Answers a);
    }
}
