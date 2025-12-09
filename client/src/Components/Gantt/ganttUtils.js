export const DAY_WIDTH = 50;

export function diffDays(d1, d2) {
    const ms = Math.abs(new Date(d2) - new Date(d1));
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function buildGraph(tasks) {
    const graph = {};

    if (!tasks || !Array.isArray(tasks)) {
        return graph;
    }

    tasks.forEach(task => {
        if (task && task.id) {
            graph[task.id] = { 
                ...task, 
                next: [],
                duration: task.duration || 1,
                assignedAt: task.assignedAt ? (typeof task.assignedAt === 'number' ? task.assignedAt : Date.parse(task.assignedAt)) : undefined,
                createdIndex: undefined
            };
        }
    });

  tasks.forEach((task, idx) => {
      if (task && task.dependencies && Array.isArray(task.dependencies)) {
          task.dependencies.forEach(depId => {
              if (graph[depId]) {
                  graph[depId].next.push(task.id);
              }
          });
      }
  });

  tasks.forEach((task, idx) => {
      if (task && task.id && graph[task.id]) {
          graph[task.id].createdIndex = idx;
      }
    });

    return graph;
}

export function calculateReverseDates(tasks, projectDeadline) {
    if (!tasks || tasks.length === 0) return {};
    if (!projectDeadline) return {};

    try {
        const graph = buildGraph(tasks);
        const taskDates = {};
        const deadline = new Date(projectDeadline);
        
        if (isNaN(deadline.getTime())) {
            console.error('Invalid project deadline:', projectDeadline);
            return {};
        }

      function calc(taskId) {
          if (taskDates[taskId]) return taskDates[taskId];

          const task = graph[taskId];
          if (!task) {
              console.warn('Task not found in graph:', taskId);
              return null;
          }

        const duration = task.duration || 1;

        const terminalIds = Object.values(graph)
            .filter(t => !t.next || t.next.length === 0)
            .map(t => t.id);

        if (terminalIds.length > 0) {
            terminalIds.sort((a, b) => {
                const va = typeof graph[a].assignedAt === 'number' ? graph[a].assignedAt : (graph[a].assignedAt ? Date.parse(graph[a].assignedAt) : undefined);
                const vb = typeof graph[b].assignedAt === 'number' ? graph[b].assignedAt : (graph[b].assignedAt ? Date.parse(graph[b].assignedAt) : undefined);

                if (typeof va === 'number' && typeof vb === 'number') return va - vb;
                const ca = typeof graph[a].createdIndex === 'number' ? graph[a].createdIndex : Number(graph[a].Id || graph[a].id || a) || 0;
                const cb = typeof graph[b].createdIndex === 'number' ? graph[b].createdIndex : Number(graph[b].Id || graph[b].id || b) || 0;
                return ca - cb;
          });

          let currentEnd = new Date(deadline);
          terminalIds.forEach(tid => {
              const td = graph[tid];
              const dur = td?.duration || 1;
              const end = new Date(currentEnd);
              const start = addDays(end, -dur);
              taskDates[tid] = { start, end, duration: dur };
              currentEnd = start;
          });
        }

        if (!task.next || task.next.length === 0) {
            if (taskDates[taskId]) return taskDates[taskId];
            const end = new Date(deadline);
            const start = addDays(end, -duration);
            return (taskDates[taskId] = { start, end, duration });
        }

        let earliestNextStart = null;

        task.next.forEach(nextId => {
            const nextDates = calc(nextId);
            if (nextDates && nextDates.start) {
                if (!earliestNextStart || nextDates.start < earliestNextStart) {
                    earliestNextStart = nextDates.start;
                }
            }
        });

        if (!earliestNextStart) {
            earliestNextStart = new Date(deadline);
        }

        const end = new Date(earliestNextStart);
        const start = addDays(end, -duration);

        return (taskDates[taskId] = { start, end, duration });
    }

      Object.keys(graph).forEach(calc);
      return taskDates;
    } catch (error) {
        console.error('Error calculating reverse dates:', error);
        return {};
    }
}

export function calculateCriticalPath(tasks) {
    try {
        const graph = buildGraph(tasks);
        const memo = {};

        function dfs(id) {
            if (memo[id]) return memo[id];
            const task = graph[id];
            if (!task) return 0;

            if (!task.next || task.next.length === 0) return task.duration || 1;

            const maxNext = Math.max(...task.next.map(dfs).filter(v => v > 0));
            return (memo[id] = (task.duration || 1) + maxNext);
        }

        let startId = null;
        let max = 0;

        Object.values(graph).forEach(task => {
            const len = dfs(task.id);
            if (len > max) {
                max = len;
                startId = task.id;
            }
        });

        if (!startId) return [];

        const path = [];
        let current = startId;

        while (current) {
            path.push(current);
            const next = graph[current]?.next || [];
            if (next.length === 0) break;
            current = next.sort((a, b) => dfs(b) - dfs(a))[0];
        }

        return path;
    } catch (error) {
        console.error('Error calculating critical path:', error);
        return [];
    }
}

