import React, { useMemo, useState, useEffect } from 'react';
import { createTask, updateTask } from '../../api/task';
import './TaskCreator.css';

const statusOptions = [
    { value: 0, label: 'Создана' },
    { value: 1, label: 'Доступна' },
    { value: 2, label: 'В процессе' },
    { value: 3, label: 'Сделано' },
    { value: 4, label: 'Отменена' }
];

const TaskCreator = ({ projectId, team, tasks, user, onCreated, defaultParentId, lockParent = false, title = 'Создать задачу / подзадачу', existingTask = null, onUpdated = null, onCancel = null }) => {
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
        return (tasks || []).filter((t) => {
            const id = t.Id || t.id;
            if (!id) return false;
            if (currentTaskId && id === currentTaskId) return false;
            const deps = t.DependencyIds || t.dependencyIds || [];
            if (currentTaskId && deps.includes(currentTaskId)) return false;
            return true;
        });
    }, [tasks, currentTaskId]);

    React.useEffect(() => {
        setParentTaskId(defaultParentId || '');
    }, [defaultParentId]);

    useEffect(() => {
        if (existingTask) {
            setName(existingTask.Name || existingTask.name || '');
            setDescription(existingTask.Description || existingTask.description || '');
            setDurationDays(existingTask.DurationDays || existingTask.durationDays || 1);
            setStatus(existingTask.Status ?? existingTask.status ?? 0);
            setParentTaskId(existingTask.ParentTaskId || existingTask.parentTaskId || defaultParentId || '');
            setDependencyIds(existingTask.DependencyIds ? [...existingTask.DependencyIds] : (existingTask.dependencyIds ? [...existingTask.dependencyIds] : []));
            setExecutorIds(existingTask.ExecutorIds ? [...existingTask.ExecutorIds] : (existingTask.Executors ? existingTask.Executors.map(e => e.Id) : []));
        }
    }, [existingTask]);

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
        setDependencyIds((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );
    };

    const toggleExecutor = (id) => {
        setExecutorIds((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                ActorExecutorId: team?.Executors?.find((ex) => ex.StudentId === user?.id)?.Id
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

    const renderTaskOption = (t) => `${t.Name || t.name} (${t.Id || t.id})`;

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
                            onChange={(e) => setName(e.target.value)}
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
                            onChange={(e) => setDurationDays(e.target.value)}
                        />
                    </label>

                    <label className="task-creator__field">
                        <span>Статус</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="task-creator__field task-creator__field--full">
                        <span>Описание</span>
                        <textarea
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Кратко: что нужно получить в результате"
                        />
                    </label>

                    <label className="task-creator__field">
                        <span>Родительская задача</span>
                        <select
                            value={parentTaskId}
                            onChange={(e) => setParentTaskId(e.target.value)}
                            disabled={lockParent}
                        >
                            <option value="">Нет (корневая)</option>
                            {(tasks || []).map((t) => (
                                <option key={t.Id || t.id} value={t.Id || t.id}>
                                    {renderTaskOption(t)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="task-creator__lists">
                    <div className="task-creator__list">
                        <div className="task-creator__list-title">Зависимости</div>
                        <div className="task-creator__checkboxes">
                            {dependencyCandidates.length === 0 && <span className="task-creator__empty">Пока нет задач</span>}
                            {dependencyCandidates.map((t) => (
                                <label key={t.Id || t.id} className="task-creator__checkbox">
                                    <input
                                        type="checkbox"
                                        checked={dependencyIds.includes(t.Id || t.id)}
                                        onChange={() => toggleDependency(t.Id || t.id)}
                                        disabled={(t.Id || t.id) === parentTaskId}
                                    />
                                    <span>{renderTaskOption(t)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="task-creator__list">
                        <div className="task-creator__list-title">Исполнители</div>
                        <div className="task-creator__checkboxes">
                            {availableExecutors.length === 0 && <span className="task-creator__empty">Нет исполнителей в команде</span>}
                            {availableExecutors.map((ex) => (
                                <label key={ex.Id} className="task-creator__checkbox">
                                    <input
                                        type="checkbox"
                                        checked={executorIds.includes(ex.Id)}
                                        onChange={() => toggleExecutor(ex.Id)}
                                    />
                                    <span>{ex.StudentName || 'Без имени'}</span>
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