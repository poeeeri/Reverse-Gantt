import { apiFetch, setToken } from './http';

export const login = async (credentials) => {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
            email: credentials.email,
            password: credentials.password
        }
    });
    setToken(data.token);
    return data;
};

export const register = async (payload) => {
    const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: {
            email: payload.email,
            password: payload.password,
            name: payload.name,
            lastName: payload.lastName
        }
    });
    setToken(data.token);
    return data;
};

export const getMe = async () => apiFetch('/auth/me');
