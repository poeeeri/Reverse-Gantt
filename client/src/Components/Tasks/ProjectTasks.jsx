import React, { useEffect, useMemo, useState } from 'react';
import { getStudentTeamsAndTasks } from '../../api/student';
import './ProjectTasks.css';
import './ProjectTasks.anim.css';

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
    tasks.forEach((t) => {
        map.set(t.id, { ...map.get(t.id), ...t });
    });
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
    return map[normalized] || map[String(normalized)] || normalized;
};

const statusProgress = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
        case 'Created': return 10;
        case 'Available': return 25;
        case 'InProgress': return 60;
        case 'Done': return 100;
        case 'Cancelled': return 0;
        default: return 15;
    }
};

const daysLeftText = (deadline) => {
    if (!deadline) return 'Без дедлайна';
    const now = new Date();
    const diff = Math.ceil((new Date(deadline) - now) / (1000 * 60 * 60 * 24));
    if (diff > 0) return `Осталось: ${diff} дн.`;
    if (diff === 0) return 'Срок сегодня';
    return `Просрочено на ${Math.abs(diff)} дн.`;
};

const buildTree = (tasks) => {
    const map = new Map();
    tasks.forEach((t) => map.set(t.id, { ...t, children: [] }));
    map.forEach((node) => {
        if (node.parentTaskId && map.has(node.parentTaskId)) {
            map.get(node.parentTaskId).children.push(node);
        }
    });
    return Array.from(map.values()).filter((n) => !n.parentTaskId);
};

const ProjectTasks = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [teamsData, setTeamsData] = useState([]);
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [collapsedTasks, setCollapsedTasks] = useState(() => new Set());
    const [statusFilter, setStatusFilter] = useState('all');

    const toggleTaskCollapse = (id) => {
        setCollapsedTasks(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
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

    const leaderTeamIds = useMemo(() => {
        if (!teamsData?.length) return [];
        return teamsData
            .filter((team) => team.executors?.some((e) => e.studentId === user?.id && e.role === 1))
            .map((t) => t.id);
    }, [teamsData, user]);

    const leaderTasks = useMemo(() => {
        const byTeam = [];
        teamsData.forEach((team) => {
            if (!leaderTeamIds.includes(team.id)) return;
            team.projects?.forEach((project) => {
                project.projectTasks?.forEach((task) => {
                    byTeam.push({
                        ...task,
                        projectName: project.name,
                        teamName: team.name,
                        scope: 'leader'
                    });
                });
            });
        });
        return byTeam;
    }, [leaderTeamIds, teamsData]);

    const assignedTasksWithContext = useMemo(() => {
        const teamsById = new Map(teamsData.map((t) => [t.id, t]));
        return (assignedTasks || []).map((task) => {
            const team = teamsById.get(task.teamId);
            const project = team?.projects?.find((p) => p.id === task.projectId);
            return {
                ...task,
                projectName: project?.name || 'Без названия',
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
        const isMine = (task) => task.executors?.some((ex) => ex.studentId === user?.id);
        return combinedTasks.filter((task) => isMine(task) || task.scope === 'member');
    }, [combinedTasks, user]);

    const taskTree = useMemo(() => {
        const baseTree = buildTree(ownTasks);
        if (statusFilter === 'all') return baseTree;

        const match = (task) => normalizeStatus(task.status) === statusFilter;
        const filterAndPromote = (nodes) => {
            return nodes.flatMap((node) => {
                const filteredChildren = filterAndPromote(node.children || []);
                const selfMatch = match(node);
                if (selfMatch) {
                    return [{ ...node, children: filteredChildren }];
                }
                // parent не подходит под фильтр — показываем только подходящих потомков
                return filteredChildren;
            });
        };

        return filterAndPromote(baseTree);
    }, [ownTasks, statusFilter]);

    const renderBranch = (task, level = 0) => {
        const hasChildren = task.children && task.children.length > 0;
        const isCollapsed = collapsedTasks.has(task.id);

        return (
            <div key={task.id} className={`task-node level-${level}`}>
                <div className="task-card">
                    <div className="task-progress">
                        <div className="progress-status">{formatStatus(task.status)}</div>
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
                                <h3 className="task-title">{task.name}</h3>
                            </div>

                            <span className={`role-chip ${task.scope === 'leader' ? 'leader' : 'member'}`}>
                                {task.scope === 'leader' ? 'Лидер' : 'Участник'}
                            </span>
                        </div>

                        {task.description && <p className="task-desc">{task.description}</p>}

                        <div className="task-meta-row">
                            <div className="task-meta-text"><strong>Проект:</strong> {task.projectName || '—'}</div>
                            <div className="task-meta-text"><strong>Команда:</strong> {task.teamName || '—'}</div>
                        </div>

                        <div className="task-footer">
                            <span className="deadline">{daysLeftText(task.deadline)}</span>
                            <span className="duration">Длительность: {task.durationDays} дн.</span>
                        </div>

                        {task.dependencies?.length > 0 && (
                            <div className="task-deps">
                                <span className="deps-label">Зависит от:</span>
                                <div className="deps-list">
                                    {task.dependencies.map((depId) => (
                                        <span key={depId} className="dep-chip">#{depId.toString().slice(0, 6)}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {hasChildren && !isCollapsed && (
                    <div className="task-children">
                        {task.children.map((child) => renderBranch(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="tasks-wrapper">Загрузка задач...</div>;
    }

    if (error) {
        return <div className="tasks-wrapper error">Ошибка: {error}</div>;
    }

    return (
        <div className="tasks-wrapper">
            <h2 className="tasks-title">Статистика задач</h2>

            <div className="tasks-filters">
                <label className="filter-label" htmlFor="statusFilter">Статус:</label>
                <select
                    id="statusFilter"
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >   
                    <option value="all">Все</option>
                    <option value="Created">Создано</option>
                    <option value="Available">Доступно</option>
                    <option value="InProgress">В процессе</option>
                    <option value="Done">Сделано</option>
                    <option value="Cancelled">Отменено</option>
                </select>
            </div>

            <div className="tasks-list">
                {taskTree.length === 0 && (
                    <div className="tasks-empty">Нет доступных задач</div>
                )}
                {taskTree.map((task) => renderBranch(task, 0))}
            </div>
        </div>
    );
};

export default ProjectTasks;
