using System.ComponentModel.DataAnnotations.Schema;

namespace web_app.Model
{

    public class Topic
    {
        public int Id { get; set; }
        public string TopicName { get; set; }
        [ForeignKey("User")]
        public int usrID { get; set; }
        public int CorrectAns { get; set; }
        public int WrongAns { get; set; }
        public int[] QuestionIDs { get; set; }

    }
}
