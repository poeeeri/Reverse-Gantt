const API_URL = import.meta.env.VITE_API_URL;

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

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

    if (response.status === 401) {
        clearToken();
        throw new Error('Не получилось авторизоваться. Попробуйте еще раз');
    }

    const contentType = response.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw new Error(data?.message || 'Ошибка запроса');
    }

    return data;
}

export const login = (credentials) => apiFetch('/auth/login', { method: 'POST', body: credentials });
export const register = (userData) => apiFetch('/auth/register', { method: 'POST', body: userData });
export const getMe = () => apiFetch('/auth/me', { method: 'GET' });