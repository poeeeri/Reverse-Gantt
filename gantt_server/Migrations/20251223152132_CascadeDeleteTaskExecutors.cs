using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gantt_server.Migrations
{
    /// <inheritdoc />
    public partial class CascadeDeleteTaskExecutors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskExecutors_ProjectTasks_TaskId",
                table: "TaskExecutors");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskExecutors_ProjectTasks_TaskId",
                table: "TaskExecutors",
                column: "TaskId",
                principalTable: "ProjectTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskExecutors_ProjectTasks_TaskId",
                table: "TaskExecutors");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskExecutors_ProjectTasks_TaskId",
                table: "TaskExecutors",
                column: "TaskId",
                principalTable: "ProjectTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
