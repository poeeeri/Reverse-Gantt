import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../api/http';
import { updateTask, deleteTask } from '../../api/task';
import TaskCreator from '../Tasks/TaskCreator';
import ReverseGanttChart from '../Gantt/ReverseGanttChart';
import GanttTaskReactWrapper from '../Gantt/GanttTaskReactWrapper';
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
    const [subtaskParent, setSubtaskParent] = useState(null);
    const [selectedExecutors, setSelectedExecutors] = useState([]);
    const [ganttModalOpen, setGanttModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [openTaskMenu, setOpenTaskMenu] = useState(null);

    useEffect(() => {
        if (project && isOpen) {
            setEditedProject({
                name: project.name || '',
                description: project.description || '',
                subject: project.subject || '',
                status: project.status || 0,
                finalDeadline: project.finalDeadline ? (typeof project.finalDeadline === 'string' ? project.finalDeadline.split('T')[0] : new Date(project.finalDeadline).toISOString().split('T')[0]) : ''
            });
            loadProjectDetails();
        }
    }, [project, isOpen]);

    useEffect(() => {
        if (ganttModalOpen) {
            const prev = document.documentElement.lang;
            document.documentElement.lang = 'ru';
            return () => { document.documentElement.lang = prev || ''; };
        }
    }, [ganttModalOpen]);

    const loadProjectDetails = async () => {
        setLoadingDetails(true);
        setError('');
        try {
            const projectDetails = await apiFetch(`/projects/${project.id}`);
            setTasks(projectDetails.ProjectTasks || []);

            if (project.teamId) {
                try {
                    const teamData = await apiFetch(`/teams/${project.teamId}`);
                    setTeam(teamData);
                } catch (teamErr) {
                    console.error('Error loading team:', teamErr);
                    setTeam(null);
                }
            }
        } catch (err) {
            console.error('Error loading project details:', err);
            setError('Не удалось загрузить детали проекта');
            setTasks([]);
        } finally {
            setLoadingDetails(false);
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

    const canEditTask = (task) => {
        return !!task;
    };

    const canDeleteTask = (task) => {
        return !!task;
    };

    const openEditTask = (task) => {
        setEditTask({
            ...task,
            DeadlineDateOnly: task.Deadline ? task.Deadline.split('T')[0] : ''
        });
        setTaskEditError('');
        setSelectedExecutors(task.Executors?.map((e) => e.Id) || []);
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

    const getProjectStatusText = (status) => {
        const statuses = {
            0: 'Запланирован',
            1: 'В работе',
            2: 'Завершен'
        };
        return statuses[status] || 'Запланирован';
    };

    const getTaskStatusText = (status) => {
        const statuses = {
            0: 'Создано',
            1: 'Доступно',
            2: 'В процессе',
            3: 'Сделано',
            4: 'Отменено'
        };
        return statuses[status] || 'Создана';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        try {
            return new Date(dateString).toLocaleDateString('ru-RU');
        } catch (e) {
            return 'Неверная дата';
        }
    };

    const ganttTasks = useMemo(() => {
        const mainTasks = tasks.filter(t => !t.ParentTaskId);
        return mainTasks.map(task => ({
            id: task.Id,
            name: task.Name || 'Без названия',
            duration: task.DurationDays || 1,
            dependencies: task.DependencyIds || [],
            assignedAt: task.AssignedAt || task.assignedAt || null
        }));
    }, [tasks]);

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
                    {error && <div className="error-message" style={{ color: '#ff6b6b', padding: '10px', marginBottom: '15px' }}>{error}</div>}
                    {loadingDetails ? (
                        <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
                    ) : (
                        <>
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
                                        {getProjectStatusText(project.status)}
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
                        {!isEditing && project.finalDeadline && (
                            <div style={{ marginTop: '15px' }}>
                                <button className="edit-project-btn" onClick={() => setGanttModalOpen(true)}>
                                    📊 Посмотреть диаграмму Ганта
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="detail-section">
                        <div className="tasks-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3>Задачи проекта ({tasks.length})</h3>
                            {team && (isUserLeader() || team.Executors?.some(ex => ex.StudentId === user?.id)) && (
                                <button
                                    className="open-task-modal-btn"
                                    type="button"
                                    onClick={() => setTaskModalOpen(true)}
                                    style={{
                                        background: '#cc1d49',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                <span className="task-name">{task.Name}</span>
                                                <span className="task-status">{getTaskStatusText(task.Status)}</span>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    className="task-menu-btn"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenTaskMenu(openTaskMenu === task.Id ? null : task.Id);
                                                    }}
                                                    aria-label="Меню задачи"
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="5" r="1"/>
                                                        <circle cx="12" cy="12" r="1"/>
                                                        <circle cx="12" cy="19" r="1"/>
                                                    </svg>
                                                </button>
                                                {openTaskMenu === task.Id && (
                                                    <div className="task-menu-dropdown">
                                                        {canEditTask(task) && (
                                                            <button
                                                                className="task-menu-item"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openEditTask(task);
                                                                    setOpenTaskMenu(null);
                                                                }}
                                                            >
                                                                Редактировать
                                                            </button>
                                                        )}

                                                        {canDeleteTask(task) && (
                                                            <button
                                                                className="task-menu-item task-menu-item-danger"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setOpenTaskMenu(null);

                                                                    const confirmMessage = task.Subtasks?.length > 0 
                                                                        ? `Внимание! У этой задачи есть подзадачи (${task.Subtasks.length}). Они также будут удалены. Вы уверены, что хотите удалить эту задачу?`
                                                                        : 'Вы уверены, что хотите удалить эту задачу?';

                                                                    if (window.confirm(confirmMessage)) {
                                                                        try {
                                                                            await deleteTask(task.Id);
                                                                            await loadProjectDetails();
                                                                            setError('');
                                                                        } catch (err) {
                                                                            const errorMessage = err.message || 'Неизвестная ошибка';
                                                                            setError('Ошибка при удалении задачи: ' + errorMessage);
                                                                            console.error('Error deleting task:', err);
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                Удалить
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {task.Description && (
                                            <p className="task-description">{task.Description}</p>
                                        )}
                                        <div className="task-actions">
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
                            </>
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

        {taskModalOpen && team && (isUserLeader() || team.Executors?.some(ex => ex.StudentId === user?.id)) && (
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

        {editTask && canEditTask(editTask) && (
            <div className="task-creator-modal-backdrop" onClick={() => setEditTask(null)}>
                <div className="task-creator-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="task-creator-modal__header">
                        <h3>Редактировать задачу</h3>
                        <button className="task-creator-modal__close" onClick={() => setEditTask(null)}>×</button>
                    </div>
                    <TaskCreator
                        projectId={project.id}
                        team={team}
                        tasks={tasks}
                        existingTask={editTask}
                        onUpdated={async (updated) => {
                            await loadProjectDetails();
                            setEditTask(null);
                        }}
                        onCancel={() => setEditTask(null)}
                        title={`Редактировать: ${editTask.Name || ''}`}
                    />
                </div>
            </div>
        )}

        {openTaskMenu && (
            <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                onClick={() => setOpenTaskMenu(null)}
            />
        )}

        {ganttModalOpen && (
            <div className="detail-modal-overlay" onClick={() => setGanttModalOpen(false)}>
                <div className="detail-modal gantt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', overflow: 'auto' }}>
                    <div className="detail-modal-header">
                        <h2>Диаграмма Ганта проекта</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button className="detail-modal-close" onClick={() => setGanttModalOpen(false)}>×</button>
                        </div>
                    </div>
                    <div className="gantt-modal-content">
                        {ganttTasks.length > 0 && project.finalDeadline ? (
                            <GanttTaskReactWrapper
                                tasks={ganttTasks}
                                projectDeadline={project.finalDeadline}
                                onEditTask={(taskId) => {
                                    const t = tasks.find(tt => (tt.Id === taskId) || (tt.id === taskId));
                                    if (t) openEditTask(t);
                                }}
                                onDeleteTask={async (taskId) => {
                                    const t = tasks.find(tt => (tt.Id === taskId) || (tt.id === taskId));
                                    if (!t) return;

                                    if (!canDeleteTask(t)) {
                                        setError('У вас нет прав для удаления этой задачи');
                                        return;
                                    }

                                    const confirmMessage = t?.Subtasks?.length > 0
                                        ? `Внимание! У этой задачи есть подзадачи (${t.Subtasks.length}). Они также будут удалены. Вы уверены, что хотите удалить эту задачу?`
                                        : 'Вы уверены, что хотите удалить эту задачу?';

                                    if (!window.confirm(confirmMessage)) return;

                                    try {
                                        await deleteTask(taskId);
                                        await loadProjectDetails();
                                        setError('');
                                    } catch (err) {
                                        const errorMessage = err.message || 'Неизвестная ошибка';
                                        setError('Ошибка при удалении задачи: ' + errorMessage);
                                        console.error('Error deleting task from Gantt:', err);
                                    }
                                }}
                                hasActions={(taskId) => {
                                    const t = tasks.find(tt => (tt.Id === taskId) || (tt.id === taskId));
                                    return !!t && (canEditTask(t) || canDeleteTask(t));
                                }}
                            />
                        ) : (
                            <p>Нет задач для отображения или не указан дедлайн проекта</p>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default ProjectDetailModal;