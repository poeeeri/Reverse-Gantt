using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gantt_server.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskCommentAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaskCommentAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageDataUrl = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskCommentAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskCommentAttachments_TaskComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "TaskComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskCommentAttachments_CommentId",
                table: "TaskCommentAttachments",
                column: "CommentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskCommentAttachments");
        }
    }
}
