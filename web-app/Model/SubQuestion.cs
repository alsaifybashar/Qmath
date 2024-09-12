using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace web_app.Model
{
    [PrimaryKey(nameof(Id))]
    public class SubQuestion
    {
        public int Id { get; set; }

        [ForeignKey("Question")]
        public int QuestionId { get; set; }

        public string[] subQuestionText { get; set; }

    }
}
