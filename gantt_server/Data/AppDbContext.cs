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
        public DbSet<PendingRegistration> PendingRegistrations => Set<PendingRegistration>();
        public DbSet<TaskComment> TaskComments => Set<TaskComment>();
        public DbSet<TaskCommentAttachment> TaskCommentAttachments => Set<TaskCommentAttachment>();
        public DbSet<TaskCommentRead> TaskCommentReads => Set<TaskCommentRead>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            OnModelStudentCreating(modelBuilder);
            OnModelTeamCreating(modelBuilder);
            OnModelExecutorCreating(modelBuilder);
            OnModelProjectCreating(modelBuilder);
            OnModelProjectTaskCreating(modelBuilder);
            OnModelPendingRegistrationCreating(modelBuilder);
            OnModelTaskDependenciesCreating(modelBuilder);
            OnModelTaskExecutorsCreating(modelBuilder);
            OnModelTaskCommentsCreating(modelBuilder);
            OnModelTaskCommentAttachmentsCreating(modelBuilder);
            OnModelTaskCommentReadsCreating(modelBuilder);
        }

        private static void OnModelStudentCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Student>(b =>
            {
                b.ToTable("Students");
                b.HasKey(s => s.Id);

                b.Property(s => s.FirstName).IsRequired();
                b.Property(s => s.LastName).IsRequired();
                b.Property(s => s.Email).IsRequired();
                b.Property(s => s.EmailConfirmed).IsRequired();
                b.Property(s => s.PasswordHash).IsRequired();
                b.Property(s => s.CreatedAt).IsRequired();

                b.HasIndex(s => s.Email).IsUnique();
            });
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
                .WithMany(s => s.Executors)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Executor>()
                .HasOne(e => e.Team)
                .WithMany(t => t.Executors)
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

        private static void OnModelPendingRegistrationCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PendingRegistration>(b =>
            {
                b.ToTable("PendingRegistrations");
                b.HasKey(r => r.Id);
                b.Property(r => r.FirstName).IsRequired();
                b.Property(r => r.LastName).IsRequired();
                b.Property(r => r.Email).IsRequired();
                b.Property(r => r.PasswordHash).IsRequired();
                b.Property(r => r.VerificationToken).IsRequired();
                b.Property(r => r.VerificationTokenExpiresAt).IsRequired();
                b.Property(r => r.CreatedAt).IsRequired();
                b.HasIndex(r => r.Email).IsUnique();
            });
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

        private static void OnModelTaskCommentsCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TaskComment>().ToTable("TaskComments");

            modelBuilder.Entity<TaskComment>()
                .HasOne(c => c.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskComment>()
                .HasOne(c => c.Student)
                .WithMany()
                .HasForeignKey(c => c.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        private static void OnModelTaskCommentAttachmentsCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TaskCommentAttachment>().ToTable("TaskCommentAttachments");

            modelBuilder.Entity<TaskCommentAttachment>()
                .HasOne(a => a.Comment)
                .WithMany(c => c.Attachments)
                .HasForeignKey(a => a.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskCommentAttachment>()
                .Property(a => a.ImageDataUrl)
                .IsRequired();
        }

        private static void OnModelTaskCommentReadsCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TaskCommentRead>().ToTable("TaskCommentReads");
            modelBuilder.Entity<TaskCommentRead>().HasKey(r => new { r.CommentId, r.StudentId });

            modelBuilder.Entity<TaskCommentRead>()
                .HasOne(r => r.Comment)
                .WithMany(c => c.Reads)
                .HasForeignKey(r => r.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskCommentRead>()
                .HasOne(r => r.Student)
                .WithMany(s => s.ReadTaskComments)
                .HasForeignKey(r => r.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
