namespace web_app.Repository.IRepository
{
    public interface ISubTopicRepository
    {
        int[] getSubTopicAns(int userID);
        void insertSubQuestion(int topic, String coursetopic, int right = 0, int wrong = 0);
        public int? GetNoTry(int topicID);
        public int? GetQuestionID(int? id);
        public void updatePriority(int id, double value);
        public double getPriority(int id);
        public int getWrong(int id);
        public int getRight(int id);
        public void insertSubTopic(Model.SubTopic topic);

    }
}