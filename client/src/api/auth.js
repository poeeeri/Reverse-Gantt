import { apiFetch, setToken } from './http';

export const login = async (credentials) => {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
            email: credentials.email,
            password: credentials.password
        }
    });

    const token = data.token ?? data.Token;
    if (token) {
        setToken(token);
    }

    return data;
};

export const register = async (payload) => {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: {
            email: payload.email,
            password: payload.password,
            name: payload.name,
            lastName: payload.lastName
        }
    });
};

export const resendConfirmation = async (email) => {
    return apiFetch('/auth/resend-confirmation', {
        method: 'POST',
        body: { email }
    });
};

export const getMe = async () => apiFetch('/auth/me');
