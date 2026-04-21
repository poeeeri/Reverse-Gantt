using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gantt_server.Migrations
{
    /// <inheritdoc />
    public partial class FixExecutorTeamRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Executors_Teams_TeamId1",
                table: "Executors");

            migrationBuilder.DropIndex(
                name: "IX_Executors_TeamId1",
                table: "Executors");

            migrationBuilder.DropColumn(
                name: "TeamId1",
                table: "Executors");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TeamId1",
                table: "Executors",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Executors_TeamId1",
                table: "Executors",
                column: "TeamId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Executors_Teams_TeamId1",
                table: "Executors",
                column: "TeamId1",
                principalTable: "Teams",
                principalColumn: "Id");
        }
    }
}
