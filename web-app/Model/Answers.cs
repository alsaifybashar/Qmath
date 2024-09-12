using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace web_app.Model
{
    [PrimaryKey(nameof(Id))]
    public class Answers
    {
        public int Id { get; set; }
        public required string AnswersText { get; set; }
        public required string[] SubQuestionAns { get; set; }
        [ForeignKey("Question")]
        public int QuestionId { get; set; }
    }
}
