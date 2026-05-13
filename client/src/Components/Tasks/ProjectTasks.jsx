import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStudentTeamsAndTasks } from '../../api/student';
import GanttTaskReactWrapper from '../Gantt/GanttTaskReactWrapper';
import '../Projects/ProjectDetailModal.css';
import './ProjectTasks.css';
import TaskComments from './TaskComments';
import TaskSolutionModal from './TaskSolutionModal';

const toCamel = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamel);

    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        acc[camelKey] = toCamel(obj[key]);
        return acc;
    }, {});
};

const mergeTasks = (tasks) => {
    const map = new Map();
    tasks.forEach((task) => map.set(task.id, { ...map.get(task.id), ...task }));
    return Array.from(map.values());
};

const normalizeStatus = (status) => {
    if (status === undefined || status === null) return null;
    if (typeof status === 'number') {
        const codes = ['Created', 'Available', 'InProgress', 'Done', 'Cancelled'];
        return codes[status] ?? status;
    }
    return status;
};

const formatStatus = (status) => {
    const normalized = normalizeStatus(status);
    if (!normalized) return 'Без статуса';

    const map = {
        Created: 'Создано',
        Available: 'Доступно',
        InProgress: 'В процессе',
        Done: 'Сделано',
        Cancelled: 'Отменено'
    };

    return map[normalized] || normalized;
};

const statusProgress = (status) => {
    switch (normalizeStatus(status)) {
        case 'Created': return 10;
        case 'Available': return 25;
        case 'InProgress': return 60;
        case 'Done': return 100;
        case 'Cancelled': return 0;
        default: return 15;
    }
};

const statusClass = (status) => {
    const map = {
        Created: 'status-created',
        Available: 'status-available',
        InProgress: 'status-in-progress',
        Done: 'status-done',
        Cancelled: 'status-cancelled'
    };

    return map[normalizeStatus(status)] || 'status-unknown';
};

const buildTree = (tasks) => {
    const map = new Map();
    tasks.forEach((task) => map.set(task.id, { ...task, children: [] }));

    map.forEach((node) => {
        if (node.parentTaskId && map.has(node.parentTaskId)) {
            map.get(node.parentTaskId).children.push(node);
        }
    });

    return Array.from(map.values()).filter((node) => !node.parentTaskId);
};

const formatAssignedDate = (value) => {
    if (!value) return 'Недавно';

    try {
        return new Date(value).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'short'
        });
    } catch {
        return 'Недавно';
    }
};

const uniqueById = (items) => {
    const map = new Map();
    items.forEach((item) => {
        if (item?.id) map.set(item.id, item);
    });
    return Array.from(map.values());
};

const normalizeSearch = (value) => String(value || '').trim().toLowerCase();

const collectParentIds = (nodes, result = new Set()) => {
    nodes.forEach((node) => {
        if (node.children?.length) {
            result.add(node.id);
            collectParentIds(node.children, result);
        }
    });

    return result;
};

const countTreeNodes = (nodes) => nodes.reduce((sum, node) => sum + 1 + countTreeNodes(node.children || []), 0);

const updateUnreadInTree = (items, taskId, unreadCommentsCount) => {
    return (items || []).map((item) => {
        const next = { ...item };
        const currentId = next.id || next.Id;

        if (currentId === taskId) {
            next.unreadCommentsCount = unreadCommentsCount;
            next.UnreadCommentsCount = unreadCommentsCount;
        }

        if (next.projects) next.projects = updateUnreadInTree(next.projects, taskId, unreadCommentsCount);
        if (next.Projects) next.Projects = updateUnreadInTree(next.Projects, taskId, unreadCommentsCount);
        if (next.projectTasks) next.projectTasks = updateUnreadInTree(next.projectTasks, taskId, unreadCommentsCount);
        if (next.ProjectTasks) next.ProjectTasks = updateUnreadInTree(next.ProjectTasks, taskId, unreadCommentsCount);

        return next;
    });
};

const ProjectTasks = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [teamsData, setTeamsData] = useState([]);
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [collapsedTasks, setCollapsedTasks] = useState(new Set());
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCommentsTask, setActiveCommentsTask] = useState(null);
    const [activeSolutionTask, setActiveSolutionTask] = useState(null);
    const [ganttModalOpen, setGanttModalOpen] = useState(false);
    const [focusedTaskId, setFocusedTaskId] = useState(null);
    const cardRefs = useRef({});

    const toggleTaskCollapse = (id) => {
        setCollapsedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openComments = (task) => setActiveCommentsTask(task);
    const closeComments = () => setActiveCommentsTask(null);

    const closeSolution = () => setActiveSolutionTask(null);

    const handleCommentsRead = (taskId) => {
        setAssignedTasks((prev) => updateUnreadInTree(prev, taskId, 0));
        setTeamsData((prev) => updateUnreadInTree(prev, taskId, 0));
        setActiveCommentsTask((prev) => (prev?.id === taskId ? { ...prev, unreadCommentsCount: 0 } : prev));
    };

    const handleSolutionSaved = (taskId, solution) => {
        const updateSolution = (items) => (items || []).map((item) => {
            const next = { ...item };
            const currentId = next.id || next.Id;

            if (currentId === taskId) {
                next.solution = solution;
                next.Solution = solution;
            }

            if (next.projects) next.projects = updateSolution(next.projects);
            if (next.Projects) next.Projects = updateSolution(next.Projects);
            if (next.projectTasks) next.projectTasks = updateSolution(next.projectTasks);
            if (next.ProjectTasks) next.ProjectTasks = updateSolution(next.ProjectTasks);
            if (next.subtasks) next.subtasks = updateSolution(next.subtasks);
            if (next.Subtasks) next.Subtasks = updateSolution(next.Subtasks);

            return next;
        });

        setAssignedTasks((prev) => updateSolution(prev));
        setTeamsData((prev) => updateSolution(prev));
        setActiveSolutionTask((prev) => (prev?.id === taskId ? { ...prev, solution } : prev));
    };

    useEffect(() => {
        if (!user?.id) return;

        setLoading(true);
        setError('');

        getStudentTeamsAndTasks(user.id)
            .then((resp) => {
                const data = toCamel(resp);
                setTeamsData(data.teams || []);
                setAssignedTasks(data.tasks || []);
            })
            .catch((err) => setError(err.message || 'Не удалось загрузить задачи'))
            .finally(() => setLoading(false));
    }, [user]);

    useEffect(() => {
        if (!focusedTaskId) return undefined;

        const timeoutId = window.setTimeout(() => setFocusedTaskId(null), 2200);
        return () => window.clearTimeout(timeoutId);
    }, [focusedTaskId]);

    const leaderTeamIds = useMemo(() => {
        return (teamsData || [])
            .filter((team) => team.executors?.some((executor) => executor.studentId === user?.id && executor.role === 1))
            .map((team) => team.id);
    }, [teamsData, user]);

    const leaderTasks = useMemo(() => {
        const result = [];

        teamsData.forEach((team) => {
            if (!leaderTeamIds.includes(team.id)) return;

            team.projects?.forEach((project) => {
                project.projectTasks?.forEach((task) => {
                    result.push({
                        ...task,
                        projectName: project.name,
                        projectFinalDeadline: project.finalDeadline,
                        teamName: team.name,
                        scope: 'leader'
                    });
                });
            });
        });

        return result;
    }, [leaderTeamIds, teamsData]);

    const assignedTasksWithContext = useMemo(() => {
        const teamsById = new Map(teamsData.map((team) => [team.id, team]));

        return (assignedTasks || []).map((task) => {
            const team = teamsById.get(task.teamId);
            const project = team?.projects?.find((item) => item.id === task.projectId);

            return {
                ...task,
                projectName: project?.name || 'Без названия',
                projectFinalDeadline: project?.finalDeadline,
                teamName: team?.name || 'Без команды',
                scope: 'member'
            };
        });
    }, [assignedTasks, teamsData]);

    const combinedTasks = useMemo(
        () => mergeTasks([...assignedTasksWithContext, ...leaderTasks]),
        [assignedTasksWithContext, leaderTasks]
    );

    const ownTasks = useMemo(() => {
        const isMine = (task) => task.executors?.some((executor) => executor.studentId === user?.id);
        return combinedTasks.filter((task) => isMine(task) || task.scope === 'member');
    }, [combinedTasks, user]);

    const taskMap = useMemo(() => new Map(ownTasks.map((task) => [task.id, task])), [ownTasks]);

    const getLeaderExecutorId = (task) => {
        const team = teamsData.find((item) => item.id === task.teamId);
        const executor = team?.executors?.find((item) => item.studentId === user?.id && item.role === 1);
        return executor?.id || null;
    };

    const baseTaskTree = useMemo(() => buildTree(ownTasks), [ownTasks]);
    const parentTaskIds = useMemo(() => collectParentIds(baseTaskTree), [baseTaskTree]);

    useEffect(() => {
        setCollapsedTasks((prev) => {
            const next = new Set(prev);
            parentTaskIds.forEach((id) => next.add(id));
            return next;
        });
    }, [parentTaskIds]);

    const taskTree = useMemo(() => {
        const query = normalizeSearch(searchQuery);
        const matchesSearch = (task) => {
            if (!query) return true;
            return [
                task.name,
                task.description,
                task.projectName,
                task.teamName,
                formatStatus(task.status)
            ].some((value) => normalizeSearch(value).includes(query));
        };

        const match = (task) => normalizeStatus(task.status) === statusFilter;
        const matchesStatus = (task) => statusFilter === 'all' || match(task);
        const filterTree = (nodes) => nodes.flatMap((node) => {
            const filteredChildren = filterTree(node.children || []);
            const isMatch = matchesStatus(node) && matchesSearch(node);
            if (isMatch || filteredChildren.length > 0) {
                return [{ ...node, children: filteredChildren }];
            }
            return [];
        });

        return filterTree(baseTaskTree);
    }, [baseTaskTree, searchQuery, statusFilter]);

    const visibleTaskCount = useMemo(() => countTreeNodes(taskTree), [taskTree]);

    const ganttTasks = useMemo(() => {
        return ownTasks
            .filter((task) => !task.parentTaskId)
            .map((task) => ({
                id: task.id,
                name: task.name || 'Без названия',
                duration: task.durationDays || 1,
                dependencies: task.dependencyIds || [],
                status: task.status,
                progress: statusProgress(task.status)
            }));
    }, [ownTasks]);

    const maxDeadline = useMemo(() => {
        const deadlines = ownTasks
            .map((task) => task.projectFinalDeadline)
            .filter(Boolean)
            .map((value) => new Date(value));

        if (deadlines.length === 0) {
            const future = new Date();
            future.setDate(future.getDate() + 30);
            return future.toISOString();
        }

        const max = new Date(Math.max(...deadlines.map((date) => date.getTime())));
        max.setDate(max.getDate() + 7);
        return max.toISOString();
    }, [ownTasks]);

    const openTaskById = (taskId) => {
        const nextExpanded = new Set(collapsedTasks);
        let cursor = taskMap.get(taskId);

        while (cursor?.parentTaskId) {
            nextExpanded.delete(cursor.parentTaskId);
            cursor = taskMap.get(cursor.parentTaskId);
        }

        setCollapsedTasks(nextExpanded);
        setFocusedTaskId(taskId);

        window.setTimeout(() => {
            cardRefs.current[taskId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
    };

    const resolveTaskRefs = (items, ids) => {
        if (items?.length) {
            return items.map((item) => ({
                id: item.id,
                name: item.name,
                status: item.status
            }));
        }

        return uniqueById((ids || []).map((id) => {
            const task = taskMap.get(id);
            return task ? { id: task.id, name: task.name, status: task.status } : null;
        }));
    };

    const renderTaskLinks = (label, items, ids) => {
        const refs = resolveTaskRefs(items, ids);
        if (refs.length === 0) return null;

        return (
            <div className="task-links-row">
                <span className="task-links-label">{label}</span>
                <div className="task-links-list">
                    {refs.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`task-link-chip ${statusClass(item.status)}`}
                            onClick={() => openTaskById(item.id)}
                        >
                            <span className="task-link-chip__name">{item.name}</span>
                            <span className="task-link-chip__meta">{formatStatus(item.status)}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderBranch = (task, level = 0) => {
        const hasChildren = task.children?.length > 0;
        const isCollapsed = !searchQuery.trim() && collapsedTasks.has(task.id);
        const executors = task.executors || [];
        const unreadCommentsCount = task.unreadCommentsCount || 0;

        return (
            <div key={task.id} className={`task-node level-${level}`}>
                <div
                    ref={(element) => {
                        if (element) cardRefs.current[task.id] = element;
                    }}
                    className={`task-card ${focusedTaskId === task.id ? 'task-card--focused' : ''}`}
                >
                    <div className="task-progress">
                        <div className={`progress-status ${statusClass(task.status)}`}>{formatStatus(task.status)}</div>
                        <div className="task-progress__line">
                            <span style={{ width: `${statusProgress(task.status)}%` }} />
                        </div>
                    </div>

                    <div className="task-details">
                        <div className="task-header-row">
                            <div className="task-header-main">
                                {hasChildren && (
                                    <button
                                        type="button"
                                        className={`task-toggle ${isCollapsed ? 'collapsed' : 'expanded'}`}
                                        onClick={() => toggleTaskCollapse(task.id)}
                                        aria-label={isCollapsed ? 'Показать подзадачи' : 'Скрыть подзадачи'}
                                    >
                                        {isCollapsed ? '▸' : '▾'}
                                    </button>
                                )}
                                <div>
                                    <h3 className="task-title">{task.name}</h3>
                                    <div className="task-title__subline">
                                        <span>Старт: {formatAssignedDate(task.assignedAt)}</span>
                                        <span>Длительность: {task.durationDays} дн.</span>
                                        <span>Комментариев: {task.comments?.length || 0}</span>
                                        {unreadCommentsCount > 0 && <span className="task-unread-meta">Новых: {unreadCommentsCount}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="task-header-side">
                                <span className={`role-chip ${task.scope === 'leader' ? 'leader' : 'member'}`}>
                                    {task.scope === 'leader' ? 'Лидерский обзор' : 'Моя зона'}
                                </span>
                            </div>
                        </div>

                        {task.description && <p className="task-desc">{task.description}</p>}

                        <div className="task-meta-row">
                            <div className="task-meta-card">
                                <span className="task-meta-card__label">Проект</span>
                                <strong>{task.projectName || '—'}</strong>
                            </div>
                            <div className="task-meta-card">
                                <span className="task-meta-card__label">Команда</span>
                                <strong>{task.teamName || '—'}</strong>
                            </div>
                            <div className="task-meta-card">
                                <span className="task-meta-card__label">Исполнители</span>
                                <div className="task-people">
                                    {executors.length > 0
                                        ? executors.map((executor) => (
                                            <span key={executor.id} className="task-person-chip">
                                                {executor.studentName}
                                            </span>
                                        ))
                                        : <span className="task-people__empty">Не назначены</span>}
                                </div>
                            </div>
                        </div>

                        {renderTaskLinks('Зависит от', task.dependencyTasks, task.dependencyIds)}
                        {renderTaskLinks('Разблокирует', task.dependentTasks, task.dependentIds)}
                    </div>

                    <div className="task-footer">
                        <button
                            className="comments-toggle"
                            onClick={() => openComments(task)}
                            aria-label="Открыть обсуждение"
                        >
                            <span className="comments-toggle__icon">💬</span>
                            <span>Обсудить</span>
                            {unreadCommentsCount > 0 && (
                                <span className="comments-toggle__badge">{unreadCommentsCount}</span>
                            )}
                        </button>
                        <button
                            className="comments-toggle"
                            onClick={() => setActiveSolutionTask(task)}
                            aria-label="Открыть решение"
                        >
                            <span>{task.solution ? 'Решение' : 'Добавить решение'}</span>
                        </button>
                    </div>
                </div>

                {hasChildren && !isCollapsed && (
                    <div className="task-children">{task.children.map((child) => renderBranch(child, level + 1))}</div>
                )}
            </div>
        );
    };

    if (loading) return <div className="tasks-wrapper">Загрузка задач...</div>;
    if (error) return <div className="tasks-wrapper error">Ошибка: {error}</div>;

    return (
        <>
            <div className="tasks-wrapper">
                <div className="tasks-hero">
                    <div>
                        <span className="tasks-hero__eyebrow">Workspace</span>
                        <h2 className="tasks-title">Панель задач команды</h2>
                        <p className="tasks-hero__text">
                            Здесь видно, что у вас в работе, какие задачи блокируют прогресс и где появились новые сообщения от команды.
                        </p>
                    </div>

                    {ganttTasks.length > 0 && (
                        <button className="gantt-view-btn" onClick={() => setGanttModalOpen(true)}>
                            Диаграмма Ганта
                        </button>
                    )}
                </div>

                <div className="tasks-toolbar">
                    <div className="tasks-toolbar__item">
                        <span className="filter-label">Статус</span>
                        <select
                            id="statusFilter"
                            className="filter-select"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="all">Все</option>
                            <option value="Created">Создано</option>
                            <option value="Available">Доступно</option>
                            <option value="InProgress">В процессе</option>
                            <option value="Done">Сделано</option>
                            <option value="Cancelled">Отменено</option>
                        </select>
                    </div>

                    <div className="tasks-toolbar__item tasks-toolbar__search">
                        <span className="filter-label">Поиск</span>
                        <input
                            className="task-search-input"
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Название, проект, команда"
                        />
                    </div>

                    <div className="tasks-toolbar__summary">
                        <span>{visibleTaskCount === ownTasks.length ? ownTasks.length : `${visibleTaskCount} / ${ownTasks.length}`} задач в видимости</span>
                        <span>{ownTasks.filter((task) => normalizeStatus(task.status) === 'InProgress').length} активных</span>
                        <span>{ownTasks.reduce((sum, task) => sum + (task.unreadCommentsCount || 0), 0)} новых комментариев</span>
                    </div>
                </div>

                <div className="tasks-list">
                    {taskTree.length === 0 && (
                        <div className="tasks-empty">Под выбранный фильтр ничего не попало.</div>
                    )}
                    {taskTree.map((task) => renderBranch(task, 0))}
                </div>

                {activeCommentsTask && (
                    <TaskComments
                        taskId={activeCommentsTask.id}
                        taskName={activeCommentsTask.name}
                        currentUser={user}
                        onClose={closeComments}
                        onCommentsRead={handleCommentsRead}
                    />
                )}

                {activeSolutionTask && (
                    <TaskSolutionModal
                        task={activeSolutionTask}
                        actorExecutorId={getLeaderExecutorId(activeSolutionTask)}
                        canEdit={Boolean(getLeaderExecutorId(activeSolutionTask))}
                        onClose={closeSolution}
                        onSaved={(solution) => handleSolutionSaved(activeSolutionTask.id, solution)}
                    />
                )}
            </div>

            {ganttModalOpen && (
                <div className="detail-modal-overlay" onClick={() => setGanttModalOpen(false)}>
                    <div
                        className="detail-modal gantt-modal"
                        onClick={(event) => event.stopPropagation()}
                        style={{ maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }}
                    >
                        <div className="detail-modal-header">
                            <h2>Диаграмма Ганта моих задач</h2>
                            <button
                                className="detail-modal-close"
                                onClick={() => setGanttModalOpen(false)}
                                aria-label="Закрыть"
                            >
                                ×
                            </button>
                        </div>
                        <div className="gantt-modal-content">
                            {ganttTasks.length > 0 ? (
                                <GanttTaskReactWrapper
                                    tasks={ganttTasks}
                                    projectDeadline={maxDeadline}
                                    onEditTask={(taskId) => openTaskById(taskId)}
                                    onDeleteTask={() => {}}
                                    hasActions={true}
                                />
                            ) : (
                                <p>Нет задач для отображения в диаграмме Ганта.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectTasks;
