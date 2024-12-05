using Microsoft.AspNetCore.Mvc;
using web_app.Migrations.SubTopic;
using web_app.Model;
using web_app.Model.context;
using web_app.Repository.IRepository;

[ApiController]
[Route("[controller]")]
public class QuestionsController : ControllerBase
{
    private readonly ILogger<QuestionsController> _logger;
    private readonly IQuestionRepository _questionRepository;
    private readonly ISubQuestionRepository _subquestionRepository;
    private readonly ITopicRepository _topicRepository;
    private readonly ISubTopicRepository _subtopicRepository; 

    public QuestionsController(ILogger<QuestionsController> logger, IQuestionRepository questionRepository, ISubQuestionRepository subQuestionRepository
        , ITopicRepository topicRepository, ISubTopicRepository subTopicRepository)
    {
        _logger = logger;
        _questionRepository = questionRepository;
        _subquestionRepository = subQuestionRepository;
        _topicRepository = topicRepository;
        _subtopicRepository = subTopicRepository;
    }

    private static readonly string[][] SubQuestions = new[]
    {
        new string[] {"sub question 1", "subquestion 2"},
        new string[] {"sub question 1", "subquestion 2"},
        new string[] {"sub question 1", "subquestion 2"}
    };


  
    [HttpGet("getQ")]
    public IEnumerable<Question> Get()
    {
        //populate
        web_app.Model.User user = new web_app.Model.User();
        user.Name = "name";

        web_app.Model.Topic topic = new web_app.Model.Topic();
        topic.TopicName = "topic";
        topic.usrID = 1;
        topic.WrongAns = 0;
        topic.CorrectAns = 0;
        topic.QuestionIDs = new int[] { 1, 2, 3, 4, 5 };
        _topicRepository.insertTopic(topic);

        web_app.Model.SubTopic subtopic = new web_app.Model.SubTopic();
        subtopic.Name = "subtopic";
        subtopic.TopicID = 1;
        _subtopicRepository.insertSubTopic(subtopic);

        return GetQuestionList();

        //try
        //{
        //    var q = _questionRepository.GetQuestions();
        //    Questions[0] = q.QuestionText;
        //    return Enumerable.Range(0, Questions.Length).Select(index => new Question
        //    {
        //        QuestionText = q.QuestionText,
        //        //weight = q.weight,
        //        DifficultyLevel = q.DifficultyLevel,
        //        CourseCategory = q.CourseCategory,
        //        Course = q.Course
        //    }).ToArray();

        //}
        //catch (Exception)
        //{

        //    throw;
        //}
    }
    [HttpGet("getSQ")]

    public IEnumerable<SubQuestion> GetSub()
    {
        //hämt exemple
        SubQuestion subQuestions = _subquestionRepository.GetSubQuestion(1);

        return Enumerable.Range(0, SubQuestions.Length).Select(index => new SubQuestion
        {
            subQuestionText = SubQuestions[index]
        }).ToArray();
    }

    private static readonly string[] Questions = new[]
    {
        "x+1=2",
        "x^2+4x+4=0",
        "x+3=5"
    };

    private static readonly string[] Answers = new[]
    {
        "1",
        "-2",
        "2"
    };


    [HttpGet("getA")]
    public IEnumerable<Answers> GetAns()
    {

        //Få in questionid
        //_ansRepository.GetAns(questionId)
        //retunr ans;
        return Enumerable.Range(0, Answers.Length).Select(index => new Answers
        {
            AnswersText = Answers[index],
            SubQuestionAns = ["a"]
        }).ToArray();
    }

    //vi behöver [Authurization tokens] och vilket topic vi är på
    public IEnumerable<Question> GetQuestionList()
    {
        int userID = 1;
        int topicID = 1;
        int? subTopicId = 1;
        int? questionID = 1;

        Question[] questions = new Question[5];
        Question question;

        for (int i = 0; i < 5; ++i)
        {
            subTopicId = _subtopicRepository.GetNoTry(topicID);
            if (subTopicId == null)
            {
                break;
            }
            questionID = _subtopicRepository.GetQuestionID(subTopicId);
            question = _questionRepository.GetQuestions((int)questionID);
            questions[i] = question;
            _subtopicRepository.updatePriority((int)subTopicId, 0.1);
        }

        if (questions[4] != null)
            return questions;

        //vi har priority variabel nu
        for (int i = 0; i < 5; ++i)
        {
            if (questions[i] == null)
            {
                subTopicId = i;
                questionID = _subtopicRepository.GetQuestionID(subTopicId);
                question = _questionRepository.GetQuestions((int)questionID);
                questions[i] = question;
                _subtopicRepository.updatePriority((int)subTopicId, 0.1);
            }
        }

        return questions;
    }

    public void UpdateAns(int subtopicID, bool correct)
    {
        double prio;
        int right;
        int wrong;

        prio = _subtopicRepository.getPriority(subtopicID);
        right = _subtopicRepository.getRight(subtopicID);
        wrong = _subtopicRepository.getWrong(subtopicID);

        //q1: 3 5, q2: 1 1, q3: 7 2 ,q4: 0 5
        //  fel/rätt
        if (correct)
            _subtopicRepository.updatePriority(subtopicID, 0.1 * prio);
        else
            _subtopicRepository.updatePriority(subtopicID, -0.1 * prio);
    }
}