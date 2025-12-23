// import React, { useState } from 'react';
// import { diffDays, DAY_WIDTH } from './ganttUtils';
// export default function GanttTaskBar({
//     task,
//     index,
//     projectStart,
//     taskDates,
//     isCritical
// }) {
//     const dates = taskDates[task.id];
//     if (!dates) return null;

//     const x = diffDays(projectStart, dates.start) * DAY_WIDTH;
//     const width = dates.duration * DAY_WIDTH;
 
//     return (
//         <div className="gantt-task-container" style={{ top: index * 40 + 60 }}>
//             <div
//                 className={`gantt-task ${isCritical ? 'critical' : ''}`}
//                 style={{ left: x, width }}
//                 title={`${task.name} (${dates.duration} дн)`}
//             >
//                 <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</span>
//             </div>
//         </div>
//     );
// }