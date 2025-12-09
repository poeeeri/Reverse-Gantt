import React from 'react';
import { diffDays, DAY_WIDTH } from './ganttUtils';

export default function GanttGrid({ projectStart, projectEnd }) {
  if (!projectStart || !projectEnd) {
    return <div className="gantt-grid">Ошибка: не указаны даты</div>;
  }

  try {
    const start = new Date(projectStart);
    const end = new Date(projectEnd);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return <div className="gantt-grid">Ошибка: неверный формат дат</div>;
    }

    const total = diffDays(start, end);
    if (total < 0 || total > 365) {
      return <div className="gantt-grid">Ошибка: некорректный диапазон дат</div>;
    }

    const days = Array.from({ length: total + 1 }, (_, i) => i);

    return (
      <div className="gantt-grid">
        {days.map(i => {
          const date = new Date(start);
          date.setDate(date.getDate() + i);

          return (
            <div
              key={i}
              className="gantt-grid-day"
              style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
            >
                  {date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    console.error('Error rendering GanttGrid:', e);
    return <div className="gantt-grid">Ошибка отображения</div>;
  }
}

