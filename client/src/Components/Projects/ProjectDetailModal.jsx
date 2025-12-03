import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/http';
import { updateTask } from '../../api/task';
import TaskCreator from '../Tasks/TaskCreator';
import './ProjectDetailModal.css';

const ProjectDetailModal = ({ project, isOpen, onClose, onUpdate, user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProject, setEditedProject] = useState({});
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [team, setTeam] = useState(null);
    const [error, setError] = useState('');
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [taskEditError, setTaskEditError] = useState('');
    const [taskEditLoading, setTaskEditLoading] = useState(false);
    const [subtaskParent, setSubtaskParent] = useState(null);
    const [selectedExecutors, setSelectedExecutors] = useState([]);

    useEffect(() => {
        if (project && isOpen) {
            setEditedProject({
                name: project.name,
                description: project.description,
                subject: project.subject,
                status: project.status,
                finalDeadline: project.finalDeadline.split('T')[0]
            });
            loadProjectDetails();
        }
    }, [project, isOpen]);

    const loadProjectDetails = async () => {
        try {
            const projectDetails = await apiFetch(`/projects/${project.id}`);
            setTasks(projectDetails.ProjectTasks || []);

            if (project.teamId) {
                const teamData = await apiFetch(`/teams/${project.teamId}`);
                setTeam(teamData);
            }
        } catch (err) {
            console.error('Error loading project details:', err);
        }
    };

    const handleTaskCreated = async () => {
        await loadProjectDetails();
        setTaskModalOpen(false);
    };

    const isUserLeader = () => {
        if (!team || !user) return false;

        const userId = user.id;

        return team.Executors?.some(executor =>
            executor.StudentId === userId && executor.Role === 1
        ) || false;
    };

    const canCreateSubtask = (task) => {
        if (isUserLeader()) return true;
        if (!user) return false;
        return task.Executors?.some((ex) => ex.StudentId === user.id);
    };

    const openEditTask = (task) => {
        setEditTask({
            ...task,
            DeadlineDateOnly: task.Deadline ? task.Deadline.split('T')[0] : ''
        });
        setTaskEditError('');
        setSelectedExecutors(task.Executors?.map((e) => e.Id) || []);
    };

    const handleTaskUpdate = async (e) => {
        e.preventDefault();
        if (!editTask) return;
        setTaskEditError('');
        try {
            setTaskEditLoading(true);
            const payload = {
                Name: editTask.Name,
                Description: editTask.Description,
                DurationDays: Number(editTask.DurationDays) || 1,
                Status: Number(editTask.Status),
                Deadline: editTask.DeadlineDateOnly ? new Date(editTask.DeadlineDateOnly).toISOString() : null,
                ParentTaskId: editTask.ParentTaskId || null,
                ExecutorIds: selectedExecutors.length ? selectedExecutors : null
            };
            const updated = await updateTask(editTask.Id, payload);
            await loadProjectDetails();
            setEditTask(null);
            return updated;
        } catch (err) {
            setTaskEditError(err.message || 'Не удалось обновить задачу');
        } finally {
            setTaskEditLoading(false);
        }
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
        <>
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

                    <div className="detail-section">
                        <div className="tasks-header-row">
                            <h3>Задачи проекта ({tasks.length})</h3>
                            {isUserLeader() && (
                                <button
                                    className="open-task-modal-btn"
                                    type="button"
                                    onClick={() => setTaskModalOpen(true)}
                                >
                                    + Создать задачу
                                </button>
                            )}
                        </div>
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
                                        <div className="task-actions">
                                            {isUserLeader() && (
                                                <button
                                                    className="task-edit-btn"
                                                    type="button"
                                                    onClick={() => openEditTask(task)}
                                                >
                                                    Редактировать
                                                </button>
                                            )}
                                            {canCreateSubtask(task) && (
                                                <button
                                                    className="task-subtask-btn"
                                                    type="button"
                                                    onClick={() => setSubtaskParent(task)}
                                                >
                                                    + Подзадача
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-tasks">Нет задач</p>
                            )}
                        </div>
                    </div>

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

        {taskModalOpen && isUserLeader() && team && (
            <div className="task-creator-modal-backdrop" onClick={() => setTaskModalOpen(false)}>
                <div className="task-creator-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="task-creator-modal__header">
                        <h3>Новая задача</h3>
                        <button className="task-creator-modal__close" onClick={() => setTaskModalOpen(false)}>×</button>
                    </div>
                    <TaskCreator
                        projectId={project.id}
                        team={team}
                        tasks={tasks}
                        onCreated={handleTaskCreated}
                    />
                </div>
            </div>
        )}

        {subtaskParent && (
            <div className="task-creator-modal-backdrop" onClick={() => setSubtaskParent(null)}>
                <div className="task-creator-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="task-creator-modal__header">
                        <h3>Новая подзадача</h3>
                        <button className="task-creator-modal__close" onClick={() => setSubtaskParent(null)}>×</button>
                    </div>
                    <TaskCreator
                        projectId={project.id}
                        team={team}
                        tasks={tasks}
                        defaultParentId={subtaskParent?.Id}
                        lockParent
                        title={`Подзадача для: ${subtaskParent?.Name || ''}`}
                        onCreated={() => {
                            setSubtaskParent(null);
                            handleTaskCreated();
                        }}
                    />
                </div>
            </div>
        )}

        {editTask && isUserLeader() && (
            <div className="task-creator-modal-backdrop" onClick={() => setEditTask(null)}>
                <div className="task-creator-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="task-creator-modal__header">
                        <h3>Редактировать задачу</h3>
                        <button className="task-creator-modal__close" onClick={() => setEditTask(null)}>×</button>
                    </div>
                    <form className="task-creator__form" onSubmit={handleTaskUpdate}>
                        <div className="task-creator__grid">
                            <label className="task-creator__field">
                                <span>Название *</span>
                                <input
                                    type="text"
                                    value={editTask.Name}
                                    onChange={(e) => setEditTask({ ...editTask, Name: e.target.value })}
                                    required
                                />
                            </label>
                            <label className="task-creator__field">
                                <span>Длительность (дней)</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={editTask.DurationDays}
                                    onChange={(e) => setEditTask({ ...editTask, DurationDays: e.target.value })}
                                />
                            </label>
                            <label className="task-creator__field">
                                <span>Дедлайн</span>
                                <input
                                    type="date"
                                    value={editTask.DeadlineDateOnly || ''}
                                    onChange={(e) => setEditTask({ ...editTask, DeadlineDateOnly: e.target.value })}
                                />
                            </label>
                            <label className="task-creator__field">
                                <span>Статус</span>
                                <select
                                    value={editTask.Status}
                                    onChange={(e) => setEditTask({ ...editTask, Status: e.target.value })}
                                >
                                    <option value={0}>Создана</option>
                                    <option value={1}>Доступна</option>
                                    <option value={2}>В процессе</option>
                                    <option value={3}>Сделано</option>
                                    <option value={4}>Отменена</option>
                                </select>
                            </label>
                            <label className="task-creator__field task-creator__field--full">
                                <span>Описание</span>
                                <textarea
                                    rows="3"
                                    value={editTask.Description || ''}
                                    onChange={(e) => setEditTask({ ...editTask, Description: e.target.value })}
                                />
                            </label>

                            <div className="task-creator__list task-creator__field--full">
                                <div className="task-creator__list-title">Исполнители</div>
                                <div className="task-creator__checkboxes">
                                    {team?.Executors?.length ? (
                                        team.Executors.map((ex) => (
                                            <label key={ex.Id} className="task-creator__checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedExecutors.includes(ex.Id)}
                                                    onChange={() => {
                                                        setSelectedExecutors((prev) =>
                                                            prev.includes(ex.Id)
                                                                ? prev.filter((id) => id !== ex.Id)
                                                                : [...prev, ex.Id]
                                                        );
                                                    }}
                                                />
                                                <span>{ex.StudentName || 'Без имени'}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <span className="task-creator__empty">Нет исполнителей</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {taskEditError && (
                            <div className="task-creator__message error">{taskEditError}</div>
                        )}

                        <div className="task-creator__actions">
                            <button type="submit" className="task-creator__submit" disabled={taskEditLoading}>
                                {taskEditLoading ? 'Сохраняем...' : 'Сохранить изменения'}
                            </button>
                            <button
                                type="button"
                                className="task-creator__reset"
                                onClick={() => setEditTask(null)}
                                disabled={taskEditLoading}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default ProjectDetailModal;