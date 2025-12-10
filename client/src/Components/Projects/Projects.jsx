import React, { useState, useEffect } from 'react';
import { getMyProjects } from '../../api/project';
import CreateProjectModal from './CreateProjectModal';
import ProjectDetailModal from './ProjectDetailModal';
import { useLocation } from 'react-router-dom';
import './Projects.css';

const Projects = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    const location = useLocation();

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (location.state?.openProjectId && projects.length > 0) {
            const projectToOpen = projects.find(p => p.id === location.state.openProjectId);
            if (projectToOpen) {
                setSelectedProject(projectToOpen);
                setDetailModalOpen(true);

                window.history.replaceState({}, document.title);
            }
        }
    }, [projects, location.state]);

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
                teamId: project.TeamId
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

    const getStatusClass = (status) => {
        const classes = {
            0: 'status-planned',
            1: 'status-in-progress',
            2: 'status-completed'
        };
        return classes[status] || 'status-planned';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const handleProjectCreated = () => {
        setCreateModalOpen(false);
        loadProjects();
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setDetailModalOpen(true);
    };

    return (
        <div className="projects-container">
            <div className="projects-header">
                <div className="projects-title-section">
                    <div>
                        <h1 className="projects-title">Мои проекты</h1>
                        <p className="projects-subtitle">
                            Управляйте своими проектами и задачами
                        </p>
                    </div>
                    <button
                        className="create-project-main-btn"
                        onClick={() => setCreateModalOpen(true)}
                    >
                        + Создать проект
                    </button>
                </div>
            </div>

            <div className="projects-list-simple">
                {!projects || projects.length === 0 ? (
                    <div className="no-projects">
                        <p>У вас пока нет проектов</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} className="project-card-simple" onClick={() => handleProjectClick(project)}>

                            <div className="project-card-header">

                                <div className="project-main-info">
                                    <h2 className="project-name">{project.name || 'Без названия'}</h2>
                                    <span className={`project-status ${getStatusClass(project.status)}`}>
                                        {getStatusText(project.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="project-card-content">
                                {project.description && (
                                    <p className="project-description">{project.description}</p>
                                )}

                                <div className="project-meta-info">
                                    <div className="project-meta-item">
                                        <strong>Предмет:</strong>
                                        <span>{project.subject || 'Не указан'}</span>
                                    </div>
                                    <div className="project-meta-item">
                                        <strong>Дедлайн:</strong>
                                        <span>{formatDate(project.finalDeadline)}</span>
                                    </div>
                                </div>
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

            <ProjectDetailModal
                project={selectedProject}
                isOpen={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedProject(null);
                }}
                onUpdate={(updatedProject) => {
                    setProjects(prev => prev.map(p =>
                        p.id === updatedProject.Id ? {
                            ...p,
                            name: updatedProject.Name,
                            description: updatedProject.Description,
                            subject: updatedProject.Subject,
                            status: updatedProject.Status,
                            finalDeadline: updatedProject.FinalDeadline
                        } : p
                    ));
                    setDetailModalOpen(false);
                }}
                user={user}
            />
        </div>
    );
};

export default Projects;