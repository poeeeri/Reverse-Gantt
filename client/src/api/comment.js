import { apiFetch } from './http';

export const getTaskComments = async (taskId, viewerStudentId = null) => {
    const query = viewerStudentId ? `?viewerStudentId=${viewerStudentId}` : '';
    return apiFetch(`/tasks/${taskId}/comments${query}`, {
        method: 'GET'
    });
};

export const addTaskComment = async (taskId, content, studentId, attachmentDataUrls = []) => {
    return apiFetch(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: { StudentId: studentId, Content: content, AttachmentDataUrls: attachmentDataUrls }
    });
};

export const updateTaskComment = async (taskId, commentId, content, attachmentDataUrls = null) => {
    return apiFetch(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'PATCH',
        body: { Content: content, AttachmentDataUrls: attachmentDataUrls }
    });
};

export const deleteTaskComment = async (taskId, commentId) => {
    return apiFetch(`/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE'
    });
};
