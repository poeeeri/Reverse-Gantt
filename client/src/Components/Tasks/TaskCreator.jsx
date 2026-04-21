import React, { useEffect, useMemo, useState } from 'react';
import { createTask, updateTask } from '../../api/task';
import './TaskCreator.css';

const statusOptions = [
    { value: 0, label: 'Создана' },
    { value: 1, label: 'Доступна' },
    { value: 2, label: 'В процессе' },
    { value: 3, label: 'Сделана' },
    { value: 4, label: 'Отменена' }
];

const TaskCreator = ({
    projectId,
    team,
    tasks,
    user,
    onCreated,
    defaultParentId,
    lockParent = false,
    title = 'Создать задачу / подзадачу',
    existingTask = null,
    onUpdated = null,
    onCancel = null
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [durationDays, setDurationDays] = useState(1);
    const [status, setStatus] = useState(0);
    const [parentTaskId, setParentTaskId] = useState(defaultParentId || '');
    const [dependencyIds, setDependencyIds] = useState([]);
    const [executorIds, setExecutorIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const currentTaskId = existingTask?.Id || existingTask?.id || null;
    const availableExecutors = useMemo(() => team?.Executors || [], [team]);

    const dependencyCandidates = useMemo(() => {
        return (tasks || []).filter((task) => {
            const id = task.Id || task.id;
            if (!id) return false;
            if (currentTaskId && id === currentTaskId) return false;

            const deps = task.DependencyIds || task.dependencyIds || [];
            if (currentTaskId && deps.includes(currentTaskId)) return false;

            return true;
        });
    }, [tasks, currentTaskId]);

    useEffect(() => {
        setParentTaskId(defaultParentId || '');
    }, [defaultParentId]);

    useEffect(() => {
        if (!existingTask) return;

        setName(existingTask.Name || existingTask.name || '');
        setDescription(existingTask.Description || existingTask.description || '');
        setDurationDays(existingTask.DurationDays || existingTask.durationDays || 1);
        setStatus(existingTask.Status ?? existingTask.status ?? 0);
        setParentTaskId(existingTask.ParentTaskId || existingTask.parentTaskId || defaultParentId || '');
        setDependencyIds(existingTask.DependencyIds ? [...existingTask.DependencyIds] : (existingTask.dependencyIds ? [...existingTask.dependencyIds] : []));
        setExecutorIds(
            existingTask.ExecutorIds
                ? [...existingTask.ExecutorIds]
                : (existingTask.Executors ? existingTask.Executors.map((executor) => executor.Id) : [])
        );
    }, [existingTask, defaultParentId]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setDurationDays(1);
        setStatus(0);
        setParentTaskId(defaultParentId || '');
        setDependencyIds([]);
        setExecutorIds([]);
    };

    const toggleDependency = (id) => {
        setDependencyIds((prev) => (
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        ));
    };

    const toggleExecutor = (id) => {
        setExecutorIds((prev) => (
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        ));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Укажите название задачи.');
            return;
        }

        if (availableExecutors.length > 0 && executorIds.length === 0) {
            setError('Выберите хотя бы одного исполнителя для задачи.');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                Name: name.trim(),
                Description: description.trim() || null,
                DurationDays: Number(durationDays) || 1,
                Status: Number(status),
                ParentTaskId: parentTaskId || null,
                TeamId: team?.Id,
                DependencyIds: dependencyIds.length ? dependencyIds : null,
                ExecutorIds: executorIds.length ? executorIds : null,
                ActorExecutorId: team?.Executors?.find((executor) => executor.StudentId === user?.id)?.Id
            };

            if (existingTask) {
                const updated = await updateTask(existingTask.Id || existingTask.id, payload);
                setSuccess('Задача обновлена');
                onUpdated?.(updated);
            } else {
                const created = await createTask(projectId, payload);
                setSuccess('Задача создана');
                resetForm();
                onCreated?.(created);
            }
        } catch (err) {
            setError(err.message || (existingTask ? 'Не удалось обновить задачу' : 'Не удалось создать задачу'));
        } finally {
            setLoading(false);
        }
    };

    const renderTaskOption = (task) => {
        const taskStatus = task.Status ?? task.status;
        const label = statusOptions.find((option) => option.value === taskStatus)?.label || 'Без статуса';
        return `${task.Name || task.name} • ${label}`;
    };

    return (
        <div className="task-creator">
            <h3 className="task-creator__title">{title}</h3>

            <form onSubmit={handleSubmit} className="task-creator__form">
                <div className="task-creator__grid">
                    <label className="task-creator__field">
                        <span>Название *</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Например: Подготовить черновик отчета"
                            required
                        />
                    </label>

                    <label className="task-creator__field">
                        <span>Длительность (дней)</span>
                        <input
                            type="number"
                            min="1"
                            value={durationDays}
                            onChange={(event) => setDurationDays(event.target.value)}
                        />
                    </label>

                    <label className="task-creator__field">
                        <span>Статус</span>
                        <select value={status} onChange={(event) => setStatus(event.target.value)}>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="task-creator__field task-creator__field--full">
                        <span>Описание</span>
                        <textarea
                            rows="3"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Кратко: что нужно получить в результате"
                        />
                    </label>

                    <label className="task-creator__field">
                        <span>Родительская задача</span>
                        <select
                            value={parentTaskId}
                            onChange={(event) => setParentTaskId(event.target.value)}
                            disabled={lockParent}
                        >
                            <option value="">Нет, это корневая задача</option>
                            {(tasks || []).map((task) => (
                                <option key={task.Id || task.id} value={task.Id || task.id}>
                                    {renderTaskOption(task)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="task-creator__lists">
                    <div className="task-creator__list">
                        <div className="task-creator__list-title">Связанные задачи</div>
                        <div className="task-creator__list-note">
                            Отметьте задачи, от которых зависит текущая. После сохранения в карточке появятся кликабельные переходы.
                        </div>
                        <div className="task-creator__checkboxes">
                            {dependencyCandidates.length === 0 && <span className="task-creator__empty">Пока нет задач для связывания</span>}
                            {dependencyCandidates.map((task) => (
                                <label key={task.Id || task.id} className="task-creator__checkbox">
                                    <input
                                        type="checkbox"
                                        checked={dependencyIds.includes(task.Id || task.id)}
                                        onChange={() => toggleDependency(task.Id || task.id)}
                                        disabled={(task.Id || task.id) === parentTaskId}
                                    />
                                    <span>{renderTaskOption(task)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="task-creator__list">
                        <div className="task-creator__list-title">Исполнители</div>
                        <div className="task-creator__checkboxes">
                            {availableExecutors.length === 0 && <span className="task-creator__empty">Нет исполнителей в команде</span>}
                            {availableExecutors.map((executor) => (
                                <label key={executor.Id} className="task-creator__checkbox">
                                    <input
                                        type="checkbox"
                                        checked={executorIds.includes(executor.Id)}
                                        onChange={() => toggleExecutor(executor.Id)}
                                    />
                                    <span>{executor.StudentName || 'Без имени'}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {(error || success) && (
                    <div className={`task-creator__message ${error ? 'error' : 'success'}`}>
                        {error || success}
                    </div>
                )}

                <div className="task-creator__actions">
                    <button type="submit" className="task-creator__submit" disabled={loading}>
                        {loading ? (existingTask ? 'Сохраняем...' : 'Создаем...') : (existingTask ? 'Сохранить изменения' : 'Создать задачу')}
                    </button>

                    {existingTask ? (
                        <button type="button" className="task-creator__reset" onClick={() => onCancel?.()} disabled={loading}>
                            Отмена
                        </button>
                    ) : (
                        <button type="button" className="task-creator__reset" onClick={resetForm} disabled={loading}>
                            Сбросить
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default TaskCreator;
