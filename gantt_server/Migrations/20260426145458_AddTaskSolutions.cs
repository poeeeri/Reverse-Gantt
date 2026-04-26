using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gantt_server.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskSolutions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaskSolutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false),
                    UpdatedByExecutorId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskSolutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskSolutions_Executors_UpdatedByExecutorId",
                        column: x => x.UpdatedByExecutorId,
                        principalTable: "Executors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskSolutions_ProjectTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "ProjectTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskSolutionAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SolutionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageDataUrl = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskSolutionAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskSolutionAttachments_TaskSolutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "TaskSolutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskSolutionAttachments_SolutionId",
                table: "TaskSolutionAttachments",
                column: "SolutionId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskSolutions_TaskId",
                table: "TaskSolutions",
                column: "TaskId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskSolutions_UpdatedByExecutorId",
                table: "TaskSolutions",
                column: "UpdatedByExecutorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskSolutionAttachments");

            migrationBuilder.DropTable(
                name: "TaskSolutions");
        }
    }
}
