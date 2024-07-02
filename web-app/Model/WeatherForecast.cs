namespace web_app.Model;

public class WeatherForecast
{
    public DateOnly Date { get; set; }

    public int TemperatureC { get; set; }

    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);

    public string? Summary { get; set; }
}

public class Questions
{
    public string QuestionText { get; set; }

}

public class Answers
{
    public string AnswersText { get; set; }
}

public class SubQuestions
{
    public string[] subQuestionText { get; set; }
}

