import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/http';
import './CreateProjectModal.css';

const CreateProjectModal = ({
    isOpen,
    onClose,
    onProjectCreated,
    teamId,
    teamName,
    userTeams,
    user
}) => {
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [finalDeadline, setFinalDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState(teamId || '');
    const [showTeamsList, setShowTeamsList] = useState(false);

    const availableTeams = React.useMemo(() => {
        const safeTeams = Array.isArray(userTeams) ? userTeams : [];
        if (!user || !user.id) return [];

        return safeTeams.filter(team => {
            const userExecutor = team.Executors?.find(executor => {
                return executor.StudentId === user.id;
            });

            return userExecutor && userExecutor.Role === 1;
        });
    }, [userTeams, user]);

    useEffect(() => {
        if (isOpen) {
            setProjectName('');
            setDescription('');
            setSubject('');
            setFinalDeadline('');
            setError('');

            if (teamId) {
                setSelectedTeamId(teamId);
            } else if (availableTeams.length > 0) {
                setSelectedTeamId(availableTeams[0].Id);
            }
        }
    }, [isOpen, teamId, availableTeams]);

    const selectedTeam = availableTeams.find(team => team.Id === selectedTeamId);


    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!projectName.trim()) {
            setError('Введите название проекта');
            return;
        }

        if (!subject.trim()) {
            setError('Введите предмет проекта');
            return;
        }

        if (!finalDeadline) {
            setError('Выберите дедлайн');
            return;
        }

        if (!teamId && !selectedTeamId) {
            setError('Выберите команду для проекта');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const projectData = {
                Name: projectName.trim(),
                Description: description.trim() || null,
                Subject: subject.trim(),
                FinalDeadline: new Date(finalDeadline).toISOString(),
                TeamId: teamId || selectedTeamId
            };


            const createdProject = await apiFetch('/projects', {
                method: 'POST',
                body: projectData
            });


            setProjectName('');
            setDescription('');
            setSubject('');
            setFinalDeadline('');

            if (!teamId) {
                setSelectedTeamId('');
            }

            alert('Проект успешно создан!');

            if (onProjectCreated) {
                onProjectCreated(createdProject);
            }

            onClose();
        } catch (err) {
            console.error('Error creating project:', err);
            setError(err.message || 'Ошибка создания проекта');
        } finally {
            setLoading(false);
        }
    };

    const canCreateProject = teamId || availableTeams.length > 0;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="modal-window" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2>
                    {teamName ? `Создание проекта для команды "${teamName}"` : 'Создание нового проекта'}
                </h2>

                {!canCreateProject ? (
                    <div className="no-teams-message">
                        <p style={{ color: '#cc1d49', textAlign: 'center', padding: '20px' }}>
                            Вы не являетесь лидером ни в одной команде.
                            Только лидеры команд могут создавать проекты.
                        </p>
                        <button
                            className="cancel-btn"
                            onClick={onClose}
                            style={{ marginTop: '10px' }}
                        >
                            Закрыть
                        </button>
                    </div>
                ) : (
                    <form className="form" onSubmit={handleSubmit}>
                        {!teamId && availableTeams.length > 0 && (
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Выберите команду *</label>
                                <button
                                    type="button"
                                    className="team-select-btn"
                                    onClick={() => setShowTeamsList(!showTeamsList)}
                                    disabled={loading}
                                >
                                    {selectedTeam ? selectedTeam.Name : 'Выберите команду...'}
                                </button>

                                {showTeamsList && (
                                    <div className="team-dropdown">
                                        {availableTeams.map(team => (
                                            <button
                                                key={team.Id}
                                                type="button"
                                                className="team-item"
                                                onClick={() => {
                                                    setSelectedTeamId(team.Id);
                                                    setShowTeamsList(false);
                                                }}
                                            >
                                                {team.Name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!teamId && availableTeams.length === 0 && canCreateProject && (
                            <div className="warning-message">
                                <p>Нет доступных команд для создания проекта</p>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Название проекта *</label>
                            <input
                                type="text"
                                placeholder="Введите название проекта"
                                value={projectName}
                                onChange={e => setProjectName(e.target.value)}
                                required
                                disabled={loading || !canCreateProject}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Описание</label>
                            <textarea
                                placeholder="Опишите ваш проект"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                disabled={loading || !canCreateProject}
                                rows="3"
                                className="form-textarea"
                            />
                        </div>

                        <div className="form-group">
                            <label>Предмет *</label>
                            <input
                                type="text"
                                placeholder="Например: Математика, Программирование"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                required
                                disabled={loading || !canCreateProject}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Дедлайн *</label>
                            <input
                                type="datetime-local"
                                value={finalDeadline}
                                onChange={e => setFinalDeadline(e.target.value)}
                                required
                                disabled={loading || !canCreateProject}
                                className="form-input"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading || !canCreateProject}
                                title={!canCreateProject ? "Вы не можете создавать проекты" : ""}
                            >
                                {loading ? 'Создание...' : 'Создать проект'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateProjectModal;