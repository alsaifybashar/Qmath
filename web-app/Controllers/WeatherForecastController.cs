using Microsoft.AspNetCore.Mvc;

namespace web_app.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    private readonly ILogger<WeatherForecastController> _logger;

    public WeatherForecastController(ILogger<WeatherForecastController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IEnumerable<WeatherForecast> Get()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }
}

[ApiController]
[Route("[controller]")]
public class QuestionsController : ControllerBase
{
    private static readonly string[] Questions = new []
    {
        "x+1=2",
        "x^2+4x+4=0",
        "x+3=5"
    };

    private readonly ILogger<QuestionsController> _logger;

    public QuestionsController(ILogger<QuestionsController> logger) 
    {
        _logger = logger;
    }

    [HttpGet]
    public IEnumerable<Questions> Get()
    {
        return Enumerable.Range(0, Questions.Length).Select(index => new Questions
        {
            QuestionText = Questions[index]
        }).ToArray();
    }
}

[ApiController]
[Route("[controller]")]
public class AnswersController : ControllerBase
{

    private static readonly string[] Answers = new []
    {
        "1",
        "-2",
        "2"
    };

    private readonly ILogger<AnswersController> _logger;

    public AnswersController(ILogger<AnswersController> logger) 
    {
        _logger = logger;
    }

    [HttpGet]
    public IEnumerable<Answers> Get()
    {
        return Enumerable.Range(0,Answers.Length).Select(index => new Answers{
            AnswersText = Answers[index]
        }).ToArray();
    }
}

[ApiController]
[Route("[controller]")]
public class SubQuestionsController : ControllerBase
{

    private static readonly string[][] SubQuestions = new []
    {
        new string[] {"sub question 1", "subquestion 2"},
        new string[] {"sub question 1", "subquestion 2"},
        new string[] {"sub question 1", "subquestion 2"}
    };

    private readonly ILogger<SubQuestionsController> _logger;

    public SubQuestionsController(ILogger<SubQuestionsController> logger) 
    {
        _logger = logger;
    }

    [HttpGet]
    public IEnumerable<SubQuestions> Get()
    {
        return Enumerable.Range(0,SubQuestions.Length).Select(index => new SubQuestions{
            subQuestionText = SubQuestions[index]
        }).ToArray();
    }
}

