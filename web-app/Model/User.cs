using Microsoft.EntityFrameworkCore;

namespace web_app.Model
{
    [PrimaryKey(nameof(Id))]
    public class User
    {
        public int Id { get; set; }
        public required string Name { get; set; }
    }
}
