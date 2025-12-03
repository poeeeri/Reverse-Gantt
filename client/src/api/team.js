import { apiFetch } from './http';

export const getMyTeams = async () => {
    try {
        const response = await apiFetch('/teams');
        return response;
    } catch (error) {
        console.error('Error fetching teams:', error);
        throw error;
    }
};

export const createTeam = async (teamData) => {
    return await apiFetch('/teams', {
        method: 'POST',
        body: teamData
    });
};

export const updateTeam = async (teamId, teamData) => {
    return await apiFetch(`/teams/${teamId}`, {
        method: 'PATCH',
        body: teamData
    });
};

export const deleteTeam = async (teamId) => {
    return await apiFetch(`/teams/${teamId}`, {
        method: 'DELETE'
    });
};