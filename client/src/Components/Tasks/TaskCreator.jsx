import React, { useMemo, useState } from 'react';
import { createTask } from '../../api/task';
import './TaskCreator.css';

const statusOptions = [
    { value: 0, label: 'Создана' },
    { value: 1, label: 'Доступна' },
    { value: 2, label: 'В процессе' },
    { value: 3, label: 'Сделано' },
    { value: 4, label: 'Отменена' }
];

const TaskCreator = ({ projectId, team, tasks, onCreated, defaultParentId, lockParent = false, title = 'Создать задачу / подзадачу' }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [durationDays, setDurationDays] = useState(1);
    const [deadline, setDeadline] = useState('');
    const [status, setStatus] = useState(0);
    const [parentTaskId, setParentTaskId] = useState(defaultParentId || '');
    const [dependencyIds, setDependencyIds] = useState([]);
    const [executorIds, setExecutorIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const availableExecutors = useMemo(() => team?.Executors || [], [team]);

    const getDeadlineLimit = () => {
        const candidates = [];
        if (parentTaskId) {
            const parent = (tasks || []).find((t) => (t.Id || t.id) === parentTaskId);
            if (parent?.Deadline) candidates.push(new Date(parent.Deadline));
        }
        (dependencyIds || []).forEach((depId) => {
            const dep = (tasks || []).find((t) => (t.Id || t.id) === depId);
            if (dep?.Deadline) candidates.push(new Date(dep.Deadline));
        });
        if (!candidates.length) return null;
        return new Date(Math.min(...candidates.map((d) => d.getTime())));
    };

    React.useEffect(() => {
        setParentTaskId(defaultParentId || '');
    }, [defaultParentId]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setDurationDays(1);
        setDeadline('');
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

        const limit = getDeadlineLimit();
        if (deadline && limit && new Date(deadline) > limit) {
            setError(`Дедлайн не может быть позже ${limit.toLocaleDateString('ru-RU')}`);
            return;
        }

        try {
            setLoading(true);
            const payload = {
                Name: name.trim(),
                Description: description.trim() || null,
                DurationDays: Number(durationDays) || 1,
                Status: Number(status),
                Deadline: deadline ? new Date(deadline).toISOString() : null,
                ParentTaskId: parentTaskId || null,
                TeamId: team?.Id,
                DependencyIds: dependencyIds.length ? dependencyIds : null,
                ExecutorIds: executorIds.length ? executorIds : null
            };

            const created = await createTask(projectId, payload);
            setSuccess('Задача создана');
            resetForm();
            onCreated?.(created);
        } catch (err) {
            setError(err.message || 'Не удалось создать задачу');
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
                        <span>Дедлайн</span>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
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
                            {(tasks || []).length === 0 && <span className="task-creator__empty">Пока нет задач</span>}
                            {(tasks || []).map((t) => (
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
                        {loading ? 'Создаем...' : 'Создать задачу'}
                    </button>
                    <button type="button" className="task-creator__reset" onClick={resetForm} disabled={loading}>
                        Сбросить
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskCreator;