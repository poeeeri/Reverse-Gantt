import React, { useState, useEffect } from 'react';
import { updateStudent } from '../../api/student';
import './Profile.css';

const Profile = ({ user, onUpdateUser, onLogout }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const updatedUser = await updateStudent({
                id: user.id,
                ...formData
            });

            onUpdateUser(updatedUser);
            setSuccess('Данные успешно обновлены!');
            setIsEditing(false);
        } catch (err) {
            setError(err.message || 'Ошибка обновления данных');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        });
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    if (!user) {
        return <div>Пользователь не найден</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h1>Профиль пользователя</h1>

                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label>Имя:</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="profile-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Фамилия:</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="profile-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="profile-input"
                        />
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleCancel}
                                >
                                    Отмена
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Редактировать профиль
                                </button>
                                <button
                                    type="button"
                                    className="logout-btn"
                                    onClick={onLogout}
                                >
                                    Выйти
                                </button>
                            </>
                        )}
                    </div>
                </form>

                <div className="profile-info">
                    <h3>Дополнительная информация</h3>
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Дата регистрации:</strong> {new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;