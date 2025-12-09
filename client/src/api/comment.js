import { apiFetch } from './http';

export const getTaskComments = async (taskId) => {
    return apiFetch(`/tasks/${taskId}/comments`, {
        method: 'GET'
    });
};

export const addTaskComment = async (taskId, content, studentId) => {
    return apiFetch(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: { StudentId: studentId, Content: content }
    });
};

export const updateTaskComment = async (taskId, commentId, content) => {
    return apiFetch(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'PATCH',
        body: { Content: content }
    });
};

export const deleteTaskComment = async (taskId, commentId) => {
    return apiFetch(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE'
    });
};
