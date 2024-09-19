using Microsoft.AspNetCore.Mvc;
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
    public QuestionsController(ILogger<QuestionsController> logger, IQuestionRepository questionRepository, ISubQuestionRepository subQuestionRepository)
    {
        _logger = logger;
        _questionRepository = questionRepository;
        _subquestionRepository = subQuestionRepository;
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
        //Här hämtar vi questions


        try
        {
            var q = _questionRepository.GetQuestions();
            Questions[0] = q.QuestionText;
            return Enumerable.Range(0, Questions.Length).Select(index => new Question
            {
                QuestionText = Questions[index],
                weight = 0,
                DifficultyLevel = 0,
                CourseCategory = "matte",
                Course = "matte kurs"
            }).ToArray();

        }
        catch (Exception)
        {

            throw;
        }
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

    //public void adjustweight(bool ans, questId){
    // kör algo för titta på tidigare likande uppgifter har man misslyckat innan osv 
    //_questionRepository.update(question,weight)
    //}

}
