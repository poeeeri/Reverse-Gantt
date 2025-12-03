import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/http';
import './ProjectDetailModal.css';

const ProjectDetailModal = ({ project, isOpen, onClose, onUpdate, user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProject, setEditedProject] = useState({});
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [team, setTeam] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (project && isOpen) {
            setEditedProject({
                name: project.name,
                description: project.description,
                subject: project.subject,
                status: project.status,
                finalDeadline: project.finalDeadline.split('T')[0] // Форматируем дату
            });
            loadProjectDetails();
        }
    }, [project, isOpen]);

    const loadProjectDetails = async () => {
        try {
            // Загружаем задачи проекта
            const projectDetails = await apiFetch(`/projects/${project.id}`);
            setTasks(projectDetails.ProjectTasks || []);

            // Загружаем информацию о команде
            if (project.teamId) {
                const teamData = await apiFetch(`/teams/${project.teamId}`);
                setTeam(teamData);
            }
        } catch (err) {
            console.error('Error loading project details:', err);
        }
    };

    // ProjectDetailModal.jsx - правильная функция isUserLeader
    const isUserLeader = () => {
        // Проверяем, является ли пользователь лидером команды этого проекта
        if (!team || !user) return false;

        const userId = user.id; // У пользователя свойство 'id' (с маленькой буквы)

        return team.Executors?.some(executor =>
            executor.StudentId === userId && executor.Role === 1
        ) || false;
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const updatedData = {
                name: editedProject.name,
                description: editedProject.description,
                subject: editedProject.subject,
                status: parseInt(editedProject.status),
                finalDeadline: new Date(editedProject.finalDeadline).toISOString()
            };

            const updatedProject = await apiFetch(`/projects/${project.id}`, {
                method: 'PATCH',
                body: updatedData
            });

            setIsEditing(false);
            if (onUpdate) {
                onUpdate(updatedProject);
            }
            alert('Проект успешно обновлен!');
        } catch (err) {
            setError('Ошибка при обновлении проекта');
            console.error('Error updating project:', err);
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

    if (!isOpen || !project) return null;

    return (
        <div className="detail-modal-overlay" onClick={onClose}>
            <div className="detail-modal" onClick={e => e.stopPropagation()}>
                <button className="detail-modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="detail-modal-header">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedProject.name}
                            onChange={e => setEditedProject({ ...editedProject, name: e.target.value })}
                            className="detail-edit-input"
                        />
                    ) : (
                        <h2 className="detail-project-name">{project.name}</h2>
                    )}

                    {isUserLeader() && !isEditing && (
                        <button
                            className="edit-project-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            Редактировать
                        </button>
                    )}
                </div>

                <div className="detail-modal-content">
                    {/* Основная информация */}
                    <div className="detail-section">
                        <h3>Основная информация</h3>
                        <div className="detail-info-grid">
                            <div className="detail-info-item">
                                <strong>Описание:</strong>
                                {isEditing ? (
                                    <textarea
                                        value={editedProject.description || ''}
                                        onChange={e => setEditedProject({ ...editedProject, description: e.target.value })}
                                        className="detail-edit-textarea"
                                        rows="3"
                                    />
                                ) : (
                                    <p>{project.description || 'Описание отсутствует'}</p>
                                )}
                            </div>

                            <div className="detail-info-item">
                                <strong>Команда:</strong>
                                <p>{team ? team.Name : 'Неизвестно'}</p>
                            </div>

                            <div className="detail-info-item">
                                <strong>Предмет:</strong>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedProject.subject}
                                        onChange={e => setEditedProject({ ...editedProject, subject: e.target.value })}
                                        className="detail-edit-input"
                                    />
                                ) : (
                                    <p>{project.subject}</p>
                                )}
                            </div>

                            <div className="detail-info-item">
                                <strong>Статус:</strong>
                                {isEditing ? (
                                    <select
                                        value={editedProject.status}
                                        onChange={e => setEditedProject({ ...editedProject, status: e.target.value })}
                                        className="detail-edit-select"
                                    >
                                        <option value="0">Запланирован</option>
                                        <option value="1">В работе</option>
                                        <option value="2">Завершен</option>
                                    </select>
                                ) : (
                                    <span className={`project-status ${project.status === 2 ? 'status-completed' : project.status === 1 ? 'status-in-progress' : 'status-planned'}`}>
                                        {getStatusText(project.status)}
                                    </span>
                                )}
                            </div>

                            <div className="detail-info-item">
                                <strong>Дедлайн:</strong>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editedProject.finalDeadline}
                                        onChange={e => setEditedProject({ ...editedProject, finalDeadline: e.target.value })}
                                        className="detail-edit-input"
                                    />
                                ) : (
                                    <p>{formatDate(project.finalDeadline)}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Задачи проекта */}
                    <div className="detail-section">
                        <h3>Задачи проекта ({tasks.length})</h3>
                        <div className="tasks-list">
                            {tasks.length > 0 ? (
                                tasks.map(task => (
                                    <div key={task.Id} className="task-item">
                                        <div className="task-header">
                                            <span className="task-name">{task.Name}</span>
                                            <span className="task-status">{getStatusText(task.Status)}</span>
                                        </div>
                                        {task.Description && (
                                            <p className="task-description">{task.Description}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="no-tasks">Нет задач</p>
                            )}
                        </div>
                    </div>

                    {/* Участники команды */}
                    {team && (
                        <div className="detail-section">
                            <h3>Участники команды ({team.Executors?.length || 0})</h3>
                            <div className="executors-list">
                                {team.Executors?.length > 0 ? (
                                    team.Executors.map(executor => (
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
                                                    {executor.Role === 1 ? 'Лидер' : 'Участник'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-executors">Нет участников</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {isEditing && (
                    <div className="detail-modal-actions">
                        <button
                            className="save-btn"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                            className="cancel-btn"
                            onClick={() => setIsEditing(false)}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                    </div>
                )}

                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default ProjectDetailModal;