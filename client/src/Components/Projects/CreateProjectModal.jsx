import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/http';
import './CreateProjectModal.css';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated, teamId, teamName }) => {
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [finalDeadline, setFinalDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(teamId || '');
    const [showTeamsList, setShowTeamsList] = useState(false);

    useEffect(() => {
        if (isOpen && !teamId) {
            loadTeams();
        }
    }, [isOpen, teamId]);

    const loadTeams = async () => {
        try {
            const teamsData = await apiFetch('/teams');
            setTeams(teamsData || []);
        } catch (err) {
            console.error('Error loading teams:', err);
            setError('Ошибка загрузки списка команд');
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!projectName.trim() || !subject.trim() || !finalDeadline) {
            setError('Заполните обязательные поля');
            return;
        }

        if (!teamId && !selectedTeamId) {
            setError('Выберите команду');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const projectData = {
                name: projectName,
                description: description || '',
                subject,
                finalDeadline: new Date(finalDeadline).toISOString(),
                teamId: teamId || selectedTeamId
            };

            const createdProject = await apiFetch('/projects', {
                method: 'POST',
                body: projectData
            });

            alert('Проект успешно создан!');

            setProjectName('');
            setDescription('');
            setSubject('');
            setFinalDeadline('');
            if (!teamId) {
                setSelectedTeamId('');
            }

            if (onProjectCreated) {
                onProjectCreated(createdProject);
            }

            onClose();
        } catch (err) {
            setError(err.message || 'Ошибка создания проекта');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="modal-window" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h2>Создание проекта{teamName && ` для команды "${teamName}"`}</h2>

                <form className="form" onSubmit={handleSubmit}>
                    {!teamId && (
                        <div style={{ position: 'relative' }}>
                            <button type="button" className="team-select-btn" onClick={() => setShowTeamsList(s => !s)} disabled={loading}>
                                {selectedTeamId ? (teams.find(t => t.Id === selectedTeamId)?.Name || 'Выбрана команда') : 'Выбрать команду'}
                            </button>

                            {showTeamsList && (
                                <div className="team-dropdown">
                                    {teams.length === 0 ? (
                                        <div className="team-dropdown-empty">Команд нет</div>
                                    ) : (
                                        teams.map(t => (
                                            <button key={t.Id} type="button" className="team-item" onClick={() => { setSelectedTeamId(t.Id); setShowTeamsList(false); }}>
                                                {t.Name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Название проекта *"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <textarea
                        placeholder="Описание проекта"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        disabled={loading}
                        rows="3"
                    />

                    <input
                        type="text"
                        placeholder="Предмет *"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <input
                        type="datetime-local"
                        placeholder="Дедлайн *"
                        value={finalDeadline}
                        onChange={e => setFinalDeadline(e.target.value)}
                        required
                        disabled={loading}
                    />

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Создание...' : 'Создать проект'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;