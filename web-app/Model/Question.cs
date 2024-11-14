using Microsoft.EntityFrameworkCore;

namespace web_app.Model;

[PrimaryKey(nameof(Id))]
public class Question
{
    public int Id { get; set; }
    
    public required string Course { get; set; }
    
    public required string CourseCategory { get; set; }

    public required string QuestionText {get; set;}

    public required int DifficultyLevel { get; set;}

}