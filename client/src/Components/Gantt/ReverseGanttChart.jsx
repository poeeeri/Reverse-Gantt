import React, { useMemo } from 'react';
import GanttGrid from './GanttGrid';
//import GanttTaskBar from './GanttTaskBar';
import {
    calculateReverseDates,
    calculateCriticalPath,
    diffDays,
    DAY_WIDTH
} from './ganttUtils';
import { addDays } from './ganttUtils';
import './Gantt.css';

export default function ReverseGanttChart({ tasks, projectDeadline, onEditTask, onDeleteTask, hasActions, depMirror = false }) {
    if (!tasks || tasks.length === 0) {
        return <div className="gantt-container"><p>Нет задач для отображения</p></div>;
    }

    if (!projectDeadline) {
        return <div className="gantt-container"><p>Не указан дедлайн проекта</p></div>;
    }

    try {
        const deadlineDate = new Date(projectDeadline);
        if (isNaN(deadlineDate.getTime())) {
            return <div className="gantt-container"><p>Неверный формат дедлайна</p></div>;
        }
    } catch (e) {
        return <div className="gantt-container"><p>Ошибка обработки дедлайна</p></div>;
    }

    const taskDates = useMemo(
        () => calculateReverseDates(tasks, projectDeadline),
        [tasks, projectDeadline]
    );

    const criticalPath = useMemo(
        () => {
            try {
                return calculateCriticalPath(tasks);
            } catch (e) {
                console.error('Error calculating critical path:', e);
                return [];
            }
        },
        [tasks]
    );

    const projectStart = useMemo(() => {
        try {
            const dates = Object.values(taskDates).filter(d => d && d.start);
            if (dates.length === 0) {
                return new Date(projectDeadline);
            }
            const minTime = Math.min(...dates.map(d => d.start.getTime()));
            return new Date(minTime);
        } catch (e) {
            console.error('Error calculating project start:', e);
            return new Date(projectDeadline);
        }
    }, [taskDates, projectDeadline]);

    const PAD_DAYS_BEFORE = 3;
    const PAD_DAYS_AFTER = 3;

    const paddedStart = useMemo(() => addDays(projectStart, -PAD_DAYS_BEFORE), [projectStart]);
    const paddedEnd = useMemo(() => addDays(new Date(projectDeadline), PAD_DAYS_AFTER), [projectDeadline]);

    const width = useMemo(() => {
        try {
            return diffDays(paddedStart, paddedEnd) * DAY_WIDTH + 200;
        } catch (e) {
            return 1000;
        }
    }, [paddedStart, paddedEnd]);

    return (
        <div className="gantt-container" style={{ width }}>
            <GanttGrid
                projectStart={paddedStart}
                projectEnd={paddedEnd}
            />

            <div className="gantt-tasks">
                {tasks.map((task, i) => {
                    if (!task || !task.id) return null;
                    return (
                        <GanttTaskBar
                            key={task.id}
                            task={task}
                            index={i}
                            projectStart={paddedStart}
                            taskDates={taskDates}
                            isCritical={criticalPath.includes(task.id)}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            hasActions={hasActions}
                        />
                    );
                })}
            </div>
        </div>
    );
}

