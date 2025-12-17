import React, { useState, useEffect } from 'react';
import { getMyProjects } from '../../api/project';
import { getMyTeams } from '../../api/team';
import CreateProjectModal from './CreateProjectModal';
import ProjectDetailModal from './ProjectDetailModal';
import { useLocation } from 'react-router-dom';
import './Projects.css';

const Projects = ({ user }) => {
    const [allProjects, setAllProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [userTeams, setUserTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    const location = useLocation();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (location.state?.openProjectId && filteredProjects.length > 0) {
            const projectToOpen = filteredProjects.find(p => p.id === location.state.openProjectId);
            if (projectToOpen) {
                setSelectedProject(projectToOpen);
                setDetailModalOpen(true);
                window.history.replaceState({}, document.title);
            }
        }
    }, [filteredProjects, location.state]);

    const loadData = async () => {
        try {
            setLoading(true);

            const projectsData = await getMyProjects();
            console.log('All projects from server:', projectsData);

            const teamsData = await getMyTeams();
            console.log('All teams from server:', teamsData);

            const userTeamsFiltered = (teamsData || []).filter(team => {
                const isUserInTeam = team.Executors?.some(executor =>
                    executor.StudentId === user.id
                );
                return isUserInTeam;
            });

            console.log('User teams (filtered):', userTeamsFiltered);
            setUserTeams(userTeamsFiltered);

            const allProjectsProcessed = (projectsData || []).map(project => ({
                id: project.Id,
                name: project.Name,
                description: project.Description,
                subject: project.Subject,
                finalDeadline: project.FinalDeadline,
                status: project.Status,
                teamId: project.TeamId
            }));

            setAllProjects(allProjectsProcessed);

            const userTeamIds = userTeamsFiltered.map(team => team.Id);
            console.log('User team IDs:', userTeamIds);

            const userProjects = allProjectsProcessed.filter(project => {
                return userTeamIds.includes(project.teamId);
            });

            console.log('Filtered projects for user:', userProjects);
            setFilteredProjects(userProjects);

        } catch (err) {
            setError('Ошибка загрузки данных');
            console.error('Error loading data:', err);
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
        loadData();
    };

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setDetailModalOpen(true);
    };

    const canCreateProject = () => {
        return userTeams.some(team => {
            const userExecutor = team.Executors?.find(executor =>
                executor.StudentId === user.id
            );
            return userExecutor?.Role === 1;
        });
    };

    if (loading) {
        return (
            <div className="projects-container">
                <div className="projects-loading">Загрузка проектов...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="projects-container">
                <div className="projects-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="projects-container">
            <div className="projects-header">
                <div className="projects-title-section">
                    <div>
                        <h1 className="projects-title">Мои проекты</h1>
                        <p className="projects-subtitle">
                            Управляйте проектами из ваших команд
                        </p>
                        <p className="projects-subtitle" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                            Показано проектов: {filteredProjects.length} из {allProjects.length}
                        </p>
                    </div>
                    <button
                        className="create-project-main-btn"
                        onClick={() => setCreateModalOpen(true)}
                        disabled={!canCreateProject()}
                        title={canCreateProject() ? "Создать новый проект" : "Вы не являетесь лидером ни в одной команде"}
                    >
                        + Создать проект
                    </button>
                </div>
            </div>

            <div className="projects-list-simple">
                {!filteredProjects || filteredProjects.length === 0 ? (
                    <div className="no-projects">
                        <p>У вас пока нет проектов</p>
                        {userTeams.length === 0 ? (
                            <p>Вы не состоите ни в одной команде. Проекты создаются в командах.</p>
                        ) : !canCreateProject() ? (
                            <p>Вы не являетесь лидером ни в одной команде. Только лидеры команд могут создавать проекты.</p>
                        ) : (
                            <p>Создайте первый проект в одной из ваших команд.</p>
                        )}
                    </div>
                ) : (
                    filteredProjects.map(project => {
                        const projectTeam = userTeams.find(team => team.Id === project.teamId);

                        return (
                            <div key={project.id} className="project-card-simple" onClick={() => handleProjectClick(project)}>
                                <div className="project-card-header">
                                    <div className="project-main-info">
                                        <div style={{ flex: 1 }}>
                                            <h2 className="project-name">{project.name || 'Без названия'}</h2>
                                            {projectTeam && (
                                                <p style={{ color: '#a3163a', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
                                                    Команда: {projectTeam.Name}
                                                </p>
                                            )}
                                        </div>
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
                        );
                    })
                )}
            </div>

            <CreateProjectModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onProjectCreated={handleProjectCreated}
                userTeams={userTeams}
                user={user}
            />

            <ProjectDetailModal
                project={selectedProject}
                isOpen={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedProject(null);
                }}
                onUpdate={(updatedProject) => {
                    setFilteredProjects(prev => prev.map(p =>
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
                userTeams={userTeams}
            />
        </div>
    );
};

export default Projects;