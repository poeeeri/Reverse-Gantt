import { apiFetch } from './http';

export const updateStudent = async (studentData) => {
    const requestData = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email
    };

    const response = await apiFetch(`/students/${studentData.id}`, {
        method: 'PATCH',
        body: requestData
    });
    return response;
};

export const getStudentProfile = async (id) => {
    const response = await apiFetch(`/students/${id}`);
    return response;
};