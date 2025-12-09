import React, { useMemo, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { calculateReverseDates, DAY_WIDTH } from './ganttUtils';
import './Gantt.css';

export default function GanttTaskReactWrapper({ tasks, projectDeadline, onEditTask, onDeleteTask, hasActions }) {
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    if (!tasks || tasks.length === 0) {
        return <div className="gantt-container"><p>Нет задач для отображения</p></div>;
    }

    if (!projectDeadline) {
        return <div className="gantt-container"><p>Не указан дедлайн проекта</p></div>;
    }

    const taskDates = useMemo(() => calculateReverseDates(tasks, projectDeadline), [tasks, projectDeadline]);

    const libTasks = useMemo(() => {
        return tasks.map(t => {
            const dates = taskDates[t.id] || taskDates[t.Id] || null;
            const start = dates && dates.start ? new Date(dates.start) : new Date(projectDeadline);
            const end = dates && dates.end ? new Date(dates.end) : new Date(projectDeadline);

          return {
              id: t.id,
              name: t.name || t.Name || 'Без названия',
              start,
              end,
              type: 'task',
              progress: 0,
              dependencies: t.dependencies || t.DependencyIds || []
            };
        });
    }, [tasks, taskDates, projectDeadline]);

    const handleDoubleClick = (task) => {
        if (!task) return;
        if (onEditTask) onEditTask(task.id || task.Id);
    };

    const handleSelect = (task) => {
        if (!task) return setSelectedTaskId(null);
        setSelectedTaskId(task.id || task.Id);
    };

    return (
        <div className="gantt-container" style={{ width: '100%' }}>
            <Gantt
              tasks={libTasks}
              viewMode={ViewMode.Day}
              onDoubleClick={handleDoubleClick}
              onSelect={handleSelect}
              locale={"ru-RU"}
            />
        </div>
    );
}
