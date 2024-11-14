namespace web_app.Repository.IRepository
{
    public interface ITopicRepository
    {
        int[] getTopicAns(int userID);
        void insertQuestion(int userID, String coursetopic, int right = 0, int wrong = 0);
    }
}
