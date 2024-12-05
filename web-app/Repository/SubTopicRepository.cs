using web_app.Migrations.SubTopic;
using web_app.Migrations.Topic;
using web_app.Model;
using web_app.Model.Context;
using web_app.Repository.IRepository;

namespace web_app.Repository
{
    public class SubTopicRepository : ISubTopicRepository
    {
        private readonly SubTopicContext _context;
        public SubTopicRepository(SubTopicContext context)
        {
            _context = context;
        }

        public int[] getSubTopicAns(int topicID)
        {
            int[] result = _context.SubTopics.Where(x => x.TopicID == topicID).Select(x => x.QuestionIDs).First();
            return result;
        }
        public int? GetNoTry(int topicID)
        {
            int subTopicID = _context.SubTopics.Where(x => x.TopicID == topicID && x.CorrectAns == 0 && x.WrongAns == 0).Select(x => x.Id).FirstOrDefault();
            return subTopicID;
        }

        public int? GetQuestionID(int? id) {
            //int questionID = _context.SubTopics.Where(x => x.Id == id && x.weight == 0 eller en variabel man kan byta som input).SelectMany(x => x.QuestionIDs).OrderBy(x => Guid.NewGuid()).FirstOrDefault();
            int questionID = _context.SubTopics.Where(x => x.Id == id).SelectMany(x => x.QuestionIDs).OrderBy(x => Guid.NewGuid()).FirstOrDefault();

            return questionID;
        }
        public void insertSubQuestion(int topic, String coursetopic, int right = 0, int wrong = 0)
        {
            Model.SubTopic subtopic = _context.SubTopics.Where(x => x.TopicID == topic && x.Name == coursetopic).First();
            subtopic.WrongAns = subtopic.WrongAns + wrong;
            subtopic.CorrectAns = subtopic.CorrectAns + right;
            _context.SubTopics.Add(subtopic);
            _context.SaveChanges();
        }
        public void updatePriority(int id, double value)
        {
            Model.SubTopic sub = _context.SubTopics.Where(x => x.Id == id).First();
            sub.Priority = sub.Priority - value;
            _context.SubTopics.Add(sub);
            _context.SaveChanges();
        }

        public double getPriority(int id)
        {
            double prio = _context.SubTopics.Where(x => x.Id == id).Select(x => x.Priority).First();
            return prio;
        }

        public int getRight(int id) {
            int right = _context.SubTopics.Where(x => x.Id == id).Select(x => x.CorrectAns).First();
            return right;
        }
        public int getWrong(int id)
        {
            int wrong = _context.SubTopics.Where(x => x.Id == id).Select(x => x.WrongAns).First();
            return wrong;
        }
        public void insertSubTopic(Model.SubTopic topic)
        {
            _context.Add(topic);
            _context.SaveChanges();
        }

    }
}