import React, { useState, useEffect } from 'react';
import { getMyTeams } from '../../api/team';
import CreateProjectModal from '../Projects/CreateProjectModal';
import './Teams.css';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const teamsData = await getMyTeams();
            console.log('Teams data:', teamsData);

            const processedTeams = (teamsData || []).map(team => ({
                id: team.Id,
                name: team.Name,
                description: team.Description,
                executors: team.Executors || [],
                projects: team.Projects || []
            }));

            setTeams(processedTeams);
        } catch (err) {
            setError('Ошибка загрузки команд');
            console.error('Error loading teams:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleText = (role) => {
        const roles = {
            0: 'Участник',
            1: 'Лидер'
        };
        return roles[role] || 'Участник';
    };

    const isUserLeader = (team) => {
        // определить является ли текущий пользователь лидером команды
        return true;
    };

    const handleCreateProject = (team) => {
        setSelectedTeam(team);
        setCreateProjectModalOpen(true);
    };

    const handleProjectCreated = () => {
        setCreateProjectModalOpen(false);
        setSelectedTeam(null);
        loadTeams();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    if (loading) {
        return (
            <div className="teams-container">
                <div className="teams-loading">Загрузка команд...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="teams-container">
                <div className="teams-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="teams-container">
            <div className="teams-header">
                <h1 className="teams-title">Мои команды</h1>
                <p className="teams-subtitle">
                    Управляйте своими командами и просматривайте их проекты
                </p>
            </div>

            <div className="teams-list">
                {!teams || teams.length === 0 ? (
                    <div className="no-teams">
                        <p>Вы пока не состоите ни в одной команде</p>
                    </div>
                ) : (
                    teams.map(team => (
                        <div key={team.id} className="team-card">
                            <div className="team-header">
                                <div className="team-title-section">
                                    <h2 className="team-name">{team.name || 'Без названия'}</h2>
                                    {isUserLeader(team) && (
                                        <button
                                            className="create-project-btn"
                                            onClick={() => handleCreateProject(team)}
                                        >
                                            + Создать проект
                                        </button>
                                    )}
                                </div>
                                {team.description && (
                                    <p className="team-description">{team.description}</p>
                                )}
                            </div>

                            <div className="team-content">
                                <div className="team-section">
                                    <h3 className="section-title">Участники команды</h3>
                                    <div className="executors-list">
                                        {team.executors.length > 0 ? (
                                            team.executors.map(executor => (
                                                <div key={executor.Id} className="executor-item">
                                                    <div className="executor-avatar">
                                                        {executor.StudentName ?
                                                            executor.StudentName.split(' ').map(n => n[0]).join('') :
                                                            '??'
                                                        }
                                                    </div>
                                                    <div className="executor-info">
                                                        <span className="executor-name">
                                                            {executor.StudentName || 'Неизвестный участник'}
                                                        </span>
                                                        <span className={`executor-role ${executor.Role === 1 ? 'role-leader' : ''}`}>
                                                            {getRoleText(executor.Role)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-projects">Нет участников</p>
                                        )}
                                    </div>
                                </div>

                                <div className="team-section">
                                    <div className="projects-header">
                                        <h3 className="section-title">Проекты команды</h3>
                                    </div>
                                    <div className="projects-list">
                                        {team.projects.length > 0 ? (
                                            team.projects.map(project => (
                                                <div
                                                    key={project.Id}
                                                    className="project-item"
                                                >
                                                    <div className="project-info">
                                                        <h4 className="project-name">{project.Name || 'Без названия'}</h4>
                                                        <p className="project-description">
                                                            {project.Description || 'Описание отсутствует'}
                                                        </p>
                                                        <div className="project-meta">
                                                            <span className="project-subject">{project.Subject || 'Без темы'}</span>
                                                            <span className="project-deadline">
                                                                До: {formatDate(project.FinalDeadline)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-projects">Нет активных проектов</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreateProjectModal
                isOpen={createProjectModalOpen}
                onClose={() => setCreateProjectModalOpen(false)}
                onProjectCreated={handleProjectCreated}
                teamId={selectedTeam?.id}
                teamName={selectedTeam?.name}
            />
        </div>
    );
};

export default Teams;