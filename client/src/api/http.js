export const API_URL = import.meta.env.VITE_API_URL;

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

const extractErrorMessage = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data === 'string') return data;

    if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
    }

    if (typeof data.error === 'string' && data.error.trim()) {
        return data.error;
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.join('; ');
    }

    const values = Object.values(data)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value) => typeof value === 'string' && value.trim());

    return values.length > 0 ? values.join('; ') : fallback;
};

export async function apiFetch(path, options = {}) {
    const { method = 'GET', headers = {}, body, ...rest } = options;

    const finalHeaders = { ...headers };
    const token = getToken();

    if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
    }

    let finalBody = body;
    const isForm = body instanceof FormData;
    if (!isForm && body !== undefined) {
        finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
        if (finalHeaders['Content-Type'] === 'application/json' && typeof body !== 'string') {
            finalBody = JSON.stringify(body);
        }
    }

    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: finalHeaders,
        body: finalBody,
        ...rest
    });

    const contentType = response.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (response.status === 401) {
        clearToken();
        const message = extractErrorMessage(data, 'Не получилось авторизоваться. Попробуйте еще раз');
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message } }));
        throw new Error(message);
    }

    if (!response.ok) {
        console.error('Ошибка ответа:', data);
        throw new Error(extractErrorMessage(data, 'Ошибка запроса'));
    }

    return data;
}

export const login = (credentials) => apiFetch('/auth/login', { method: 'POST', body: credentials });
export const register = (userData) => apiFetch('/auth/register', { method: 'POST', body: userData });
export const getMe = () => apiFetch('/auth/me', { method: 'GET' });
