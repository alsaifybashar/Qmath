using web_app.Model;
using web_app.Model.Context;
using web_app.Repository.IRepository;

namespace web_app.Repository
{
    public class TopicRepository : ITopicRepository
    {
        private readonly TopicContext _context;
        public TopicRepository(TopicContext context)
        {
            _context = context;
        }




        public int[] getTopicAns(int userID)
        {
            int[] result = _context.Topics.Where(x => x.usrID == userID).Select(x => x.QuestionIDs).First();
            return result;
        }

        public void insertQuestion(int userID,String coursetopic, int right = 0, int wrong = 0)
        {
            Topic topic = _context.Topics.Where(x => x.usrID == userID && x.TopicName == coursetopic).First();
            topic.WrongAns = topic.WrongAns+wrong;
            topic.CorrectAns = topic.CorrectAns + right;
            _context.Topics.Add(topic); 
            _context.SaveChanges();
        }
    }
}
