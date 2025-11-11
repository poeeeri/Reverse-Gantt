using Microsoft.EntityFrameworkCore;
using gantt_server.Models;

namespace gantt_server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Student> Students => Set<Student>();
        public DbSet<Team> Teams => Set<Team>();
        public DbSet<Executor> Executors => Set<Executor>();
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            OnModelStudentCreating(modelBuilder);
            OnModelTeamCreating(modelBuilder);
            OnModelExecutorCreating(modelBuilder);
            OnModelProjectCreating(modelBuilder);
            OnModelProjectTaskCreating(modelBuilder);
            OnModelTaskDependenciesCreating(modelBuilder);
            OnModelTaskExecutorsCreating(modelBuilder);
        }

        private static void OnModelStudentCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Student>().ToTable("Students");
        }

        private static void OnModelTeamCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Team>().ToTable("Teams");
        }

        private static void OnModelExecutorCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Executor>().ToTable("Executors");
            modelBuilder.Entity<Executor>()
                .HasIndex(e => new { e.StudentId, e.TeamId })
                .IsUnique();

            modelBuilder.Entity<Executor>()
                .HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Executor>()
                .HasOne(e => e.Team)
                .WithMany()
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        private static void OnModelProjectCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Project>().ToTable("Projects");

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Team)
                .WithMany(t => t.Projects)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.Tasks)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        private static void OnModelProjectTaskCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ProjectTask>().ToTable("ProjectTasks");
            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.ParentTask)
                .WithMany(t => t.Subtasks)
                .HasForeignKey(t => t.ParentTaskId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        private static void OnModelTaskDependenciesCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ProjectTask>()
                .HasMany(t => t.Dependencies)
                .WithMany(t => t.DependentTasks)
                .UsingEntity<Dictionary<string, object>>(
                    "TaskDependencies",
                    j => j.HasOne<ProjectTask>().WithMany().HasForeignKey("DependencyId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<ProjectTask>().WithMany().HasForeignKey("TaskId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.ToTable("TaskDependencies");
                        j.HasKey("TaskId", "DependencyId");
                    });
        }

        private static void OnModelTaskExecutorsCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ProjectTask>()
                .HasMany(t => t.Executors)
                .WithMany(e => e.Tasks)
                .UsingEntity<Dictionary<string, object>>(
                    "TaskExecutors",
                    j => j.HasOne<Executor>().WithMany().HasForeignKey("ExecutorId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<ProjectTask>().WithMany().HasForeignKey("TaskId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.ToTable("TaskExecutors");
                        j.HasKey("TaskId", "ExecutorId");
                    });
        }
    }
}
