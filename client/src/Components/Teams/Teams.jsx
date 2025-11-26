import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/http';
import { getMyTeams } from '../../api/team';
import './Teams.css';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const teamsData = await getMyTeams();
            console.log('Teams data:', teamsData);

            const processedTeams = (teamsData || []).map(team => ({
                ...team,
                executors: team.executors || [],
                projects: team.projects || []
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

    const handleProjectClick = (projectId) => {
        console.log('Navigate to project:', projectId);
        alert(`Переход к проекту ${projectId} (заглушка)`);
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
                                <h2 className="team-name">{team.name || 'Без названия'}</h2>
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
                                                <div key={executor.id} className="executor-item">
                                                    <div className="executor-avatar">
                                                        {executor.studentName ?
                                                            executor.studentName.split(' ').map(n => n[0]).join('') :
                                                            '??'
                                                        }
                                                    </div>
                                                    <div className="executor-info">
                                                        <span className="executor-name">
                                                            {executor.studentName || 'Неизвестный участник'}
                                                        </span>
                                                        <span className={`executor-role ${executor.role === 1 ? 'role-leader' : ''}`}>
                                                            {getRoleText(executor.role)}
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
                                    <h3 className="section-title">Проекты команды</h3>
                                    <div className="projects-list">
                                        {team.projects.length > 0 ? (
                                            team.projects.map(project => (
                                                <div
                                                    key={project.id}
                                                    className="project-item"
                                                    onClick={() => handleProjectClick(project.id)}
                                                >
                                                    <div className="project-info">
                                                        <h4 className="project-name">{project.name || 'Без названия'}</h4>
                                                        <p className="project-description">
                                                            {project.description || 'Описание отсутствует'}
                                                        </p>
                                                        <span className="project-subject">{project.subject || 'Без темы'}</span>
                                                    </div>
                                                    <div className="project-arrow">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                                        </svg>
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
        </div>
    );
};

export default Teams;