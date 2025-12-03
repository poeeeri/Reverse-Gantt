import { apiFetch } from './http';

export const getMyProjects = async () => {
    try {
        const response = await apiFetch('/projects');
        return response;
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
};

export const createProject = async (projectData) => {
    return await apiFetch('/projects', {
        method: 'POST',
        body: projectData
    });
};

export const updateProject = async (projectId, projectData) => {
    return await apiFetch(`/projects/${projectId}`, {
        method: 'PATCH',
        body: projectData
    });
};

export const deleteProject = async (projectId) => {
    return await apiFetch(`/projects/${projectId}`, {
        method: 'DELETE'
    });
};