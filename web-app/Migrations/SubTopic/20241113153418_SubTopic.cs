using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace web_app.Migrations.SubTopic
{
    /// <inheritdoc />
    public partial class SubTopic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SubTopics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TopicID = table.Column<int>(type: "int", nullable: false),
                    QuestionIDs = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CorrectAns = table.Column<int>(type: "int", nullable: false),
                    WrongAns = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubTopics", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubTopics");
        }
    }
}
