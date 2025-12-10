import { apiFetch } from './http';

export const createTask = async (projectId, payload) => {
    return apiFetch(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: payload
    });
};

export const updateTask = async (taskId, payload) => {
    return apiFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: payload
    });
};

export const setTaskStatus = async (taskId, status) => {
    return apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: { Status: status }
    });
};

export const addTaskDependency = async (taskId, dependencyId) => {
    return apiFetch(`/tasks/${taskId}/dependencies`, {
        method: 'POST',
        body: dependencyId
    });
};

export const removeTaskDependency = async (taskId, dependencyId) => {
    return apiFetch(`/tasks/${taskId}/dependencies/${dependencyId}`, {
        method: 'DELETE'
    });
};

export const assignTaskExecutor = async (taskId, executorId) => {
    return apiFetch(`/tasks/${taskId}/executors`, {
        method: 'POST',
        body: executorId
    });
};

export const unassignTaskExecutor = async (taskId, executorId) => {
    return apiFetch(`/tasks/${taskId}/executors/${executorId}`, {
        method: 'DELETE'
    });
};

export const deleteTask = async (taskId, actorExecutorId) => {
    return apiFetch(`/tasks/${taskId}?actorExecutorId=${actorExecutorId}`, {
        method: 'DELETE'
    });
};