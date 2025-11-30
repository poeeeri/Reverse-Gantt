import React, { useState, useEffect } from 'react';
import { getMyProjects } from '../../api/project';
import CreateProjectModal from './CreateProjectModal';
import './Projects.css';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const projectsData = await getMyProjects();
            console.log('Projects data:', projectsData);

            const processedProjects = (projectsData || []).map(project => ({
                id: project.Id,
                name: project.Name,
                description: project.Description,
                subject: project.Subject,
                finalDeadline: project.FinalDeadline,
                status: project.Status,
                teamId: project.TeamId,
                projectTasks: project.ProjectTasks || []
            }));

            setProjects(processedProjects);
        } catch (err) {
            setError('Ошибка загрузки проектов');
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status) => {
        const statuses = {
            0: 'Запланирован',
            1: 'В работе',
            2: 'Завершен'
        };
        return statuses[status] || 'Запланирован';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const handleProjectCreated = () => {
        setCreateModalOpen(false);
        loadProjects();
    };

    return (
        <div className="projects-container">
            <div className="projects-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="projects-title">Мои проекты</h1>
                        <p className="projects-subtitle">
                            Управляйте своими проектами и задачами
                        </p>
                    </div>
                    <button
                        className="create-project-btn"
                        onClick={() => setCreateModalOpen(true)}
                    >
                        + Создать проект
                    </button>
                </div>
            </div>

            <div className="projects-list">
                {!projects || projects.length === 0 ? (
                    <div className="no-projects">
                        <p>У вас пока нет проектов</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} className="project-card">
                            <div className="project-header">
                                <h2 className="project-name">{project.name || 'Без названия'}</h2>
                                <span className={`project-status ${project.status === 2 ? 'status-completed' : project.status === 1 ? 'status-in-progress' : 'status-planned'}`}>
                                    {getStatusText(project.status)}
                                </span>
                            </div>
                            {project.description && (
                                <p className="project-description">{project.description}</p>
                            )}
                            <div className="project-details">
                                <div className="project-detail">
                                    <strong>Предмет:</strong> {project.subject || 'Не указан'}
                                </div>
                                <div className="project-detail">
                                    <strong>Дедлайн:</strong> {formatDate(project.finalDeadline)}
                                </div>
                            </div>
                            <div className="project-tasks">
                                <h3>Задачи проекта</h3>
                                {project.projectTasks.length > 0 ? (
                                    <ul className="tasks-list">
                                        {project.projectTasks.map(task => (
                                            <li key={task.Id} className="task-item">
                                                <span className="task-name">{task.Name}</span>
                                                <span className="task-status">{getStatusText(task.Status)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Нет задач</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreateProjectModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />
        </div>
    );
};

export default Projects;