using System.ComponentModel.DataAnnotations.Schema;

namespace web_app.Model
{
    public class SubTopic
    {
        public int Id { get; set; }
        public string Name { get; set; }
        [ForeignKey("Topic")]
        public int TopicID { get; set; }
        public int[] QuestionIDs {  get; set; }
        public int CorrectAns { get; set; }
        public int WrongAns { get; set; }
        public double Priority { get; set; } = 1;
    }
}
