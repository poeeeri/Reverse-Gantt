using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gantt_server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTaskDeadline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Deadline",
                table: "ProjectTasks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "Deadline",
                table: "ProjectTasks",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}