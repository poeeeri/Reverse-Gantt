import { apiFetch } from './http';

export const updateStudent = async (studentData) => {
    if (!studentData.id) {
        throw new Error('ID пользователя отсутствует');
    }
    if (!studentData.firstName || !studentData.lastName || !studentData.email) {
        throw new Error('Все поля должны быть заполнены');
    }

    try {
        const requestData = {
            FirstName: studentData.firstName,
            LastName: studentData.lastName,
            Email: studentData.email
        };

        const response = await apiFetch(`/students/${studentData.id}`, {
            method: 'PATCH',
            body: requestData
        });

        return response;
    } catch (error) {
        throw error;
    }
};

export const getStudentProfile = async (id) => {
    const response = await apiFetch(`/students/${id}`);
    return response;
};