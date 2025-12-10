import React, { useState, useEffect } from 'react';
import { getMyTeams, deleteTeam } from '../../api/team';
import { deleteProject } from '../../api/project';
import CreateTeamModal from '../CreateTeam/CreateTeam';
import CreateProjectModal from '../Projects/CreateProjectModal';
import { useNavigate } from 'react-router-dom';
import TeamMemberModal from './TeamMemberModal';
import AddMemberModal from './AddMemberModal';
import './Teams.css';

const Teams = ({ user }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const navigate = useNavigate();

    const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [teamForAddingMember, setTeamForAddingMember] = useState(null);

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

    const handleProjectClick = (project) => {
        navigate('/projects', {
            state: {
                openProjectId: project.Id,
                openProjectDetails: true
            }
        });
    };

    const handleDeleteTeam = async (team) => {
        if (!isUserLeader(team)) return;
        const meExecutor = team.executors.find(e => e.StudentId === user.id);
        if (!meExecutor) return;
        if (!confirm(`Удалить команду "${team.name}"? Это действие необратимо.`)) return;
        try {
            await deleteTeam(team.id, meExecutor.Id);
            await loadTeams();
        } catch (err) {
            alert(err.message || 'Не удалось удалить команду');
        }
    };

    const handleDeleteProject = async (team, project) => {
        if (!isUserLeader(team)) return;
        const meExecutor = team.executors.find(e => e.StudentId === user.id);
        if (!meExecutor) return;
        if (!confirm(`Удалить проект "${project.Name}"?`)) return;
        try {
            await deleteProject(project.Id, meExecutor.Id);
            await loadTeams();
        } catch (err) {
            alert(err.message || 'Не удалось удалить проект');
        }
    };

    const handleMemberClick = (team, member) => {
        if (isUserLeader(team)) {
            setSelectedTeam(team);
            setSelectedMember(member);
            setMemberModalOpen(true);
        }
    };

    const handleMemberUpdated = () => {
        loadTeams();
        setMemberModalOpen(false);
        setSelectedMember(null);
        setSelectedTeam(null);
    };

    const handleAddMemberClick = (team) => {
        setTeamForAddingMember(team);
        setAddMemberModalOpen(true);
    };

    const isUserLeader = (team) => {
        if (!user || !team) return false;

        const userId = user.id;

        return team.executors.some(executor =>
            executor.StudentId === userId && executor.Role === 1
        );
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

    const handleTeamCreated = () => {
        setCreateTeamModalOpen(false);
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
                <div className="teams-title-section">
                    <div>
                        <h1 className="teams-title">Мои команды</h1>
                        <p className="teams-subtitle">
                            Управляйте своими командами и просматривайте их проекты
                        </p>
                    </div>
                    <button
                        className="create-team-btn"
                        onClick={() => setCreateTeamModalOpen(true)}
                    >
                        + Создать команду
                    </button>
                </div>
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

                                {isUserLeader(team) && (
                                    <button
                                        className="delete-team-btn"
                                        onClick={() => handleDeleteTeam(team)}
                                    >
                                        Удалить команду
                                    </button>
                                )}
                            </div>

                            <div className="team-content">
                                <div className="team-section">
                                    <h3 className="section-title">Участники команды</h3>
                                    <div className="executors-list">
                                        {team.executors.length > 0 ? (
                                            team.executors.map(executor => (
                                                <div key={executor.Id} className="executor-item" onClick={() => isUserLeader(team) && handleMemberClick(team, executor)} style={{
                                                    cursor: isUserLeader(team) ? 'pointer' : 'default',
                                                    position: 'relative'
                                                }}>
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
                                                    {isUserLeader(team) && (
                                                        <div className="member-actions-indicator">
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-projects">Нет участников</p>
                                        )}
                                    </div>

                                    {isUserLeader(team) && (
                                        <div className="add-members-section">
                                            <button
                                                className="add-member-btn"
                                                onClick={() => handleAddMemberClick(team)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M12 5v14M5 12h14" />
                                                </svg>
                                                Добавить участника
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="team-section">
                                    <div className="projects-list">
                                        {team.projects.length > 0 ? (
                                            team.projects.map(project => (
                                            <div
                                                key={project.Id}
                                                className="project-item"
                                            >
                                                <div className="project-info">
                                                    <h4 className="project-name" onClick={() => handleProjectClick(project)}>{project.Name || 'Без названия'}</h4>
                                                    <p className="project-description">
                                                        {project.Description || 'Описание отсутствует'}
                                                    </p>
                                                    <div className="project-meta">
                                                        <span className="project-subject">{project.Subject || 'Без темы'}</span>
                                                        <span className="project-deadline">
                                                            До: {formatDate(project.FinalDeadline)}
                                                        </span>
                                                    </div>
                                                    {isUserLeader(team) && (
                                                        <div className="project-actions">
                                                            <button
                                                                className="delete-project-btn"
                                                                onClick={() => handleDeleteProject(team, project)}
                                                            >
                                                                Удалить проект
                                                            </button>
                                                        </div>
                                                    )}
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

            <CreateTeamModal
                isOpen={createTeamModalOpen}
                onClose={() => setCreateTeamModalOpen(false)}
                onTeamCreated={handleTeamCreated}
            />

            <TeamMemberModal
                team={selectedTeam}
                member={selectedMember}
                currentExecutorId={selectedTeam?.executors?.find(e => e.StudentId === user?.id)?.Id}
                isOpen={memberModalOpen}
                onClose={() => {
                    setMemberModalOpen(false);
                    setSelectedMember(null);
                    setSelectedTeam(null);
                }}
                onMemberUpdated={handleMemberUpdated}
                isLeader={selectedTeam ? isUserLeader(selectedTeam) : false}
            />

            <AddMemberModal
                team={teamForAddingMember}
                isOpen={addMemberModalOpen}
                onClose={() => {
                    setAddMemberModalOpen(false);
                    setTeamForAddingMember(null);
                }}
                onMemberAdded={handleMemberUpdated}
            />
        </div>
    );
};

export default Teams;