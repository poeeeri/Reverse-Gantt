import React, { useState, useEffect } from 'react';
import { updateStudent } from '../../api/student';
import './Profile.css';

const Profile = ({ user, onUpdateUser, onLogout }) => {
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

        if (!user || !user.id) {
            setError('Пользователь не загружен. Пожалуйста, обновите страницу.');
            return;
        }

        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('Все поля должны быть заполнены');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const updatedUser = await updateStudent({
                id: user.id,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            });

            onUpdateUser(updatedUser);
            setSuccess('Данные успешно обновлены!');
        } catch (err) {
            console.error('Ошибка обновления:', err);
            setError(`Ошибка обновления: ${err.message || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            });
        }
        setError('');
        setSuccess('');
    };

    if (!user || !user.id) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <h1>Профиль пользователя</h1>
                    <div className="error-message">
                        Пользователь не загружен. Пожалуйста, войдите снова.
                    </div>
                    <button
                        className="logout-btn"
                        onClick={onLogout}
                        style={{ marginTop: '20px' }}
                    >
                        Выйти и войти снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h1>Профиль пользователя</h1>

                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label>Имя:</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={loading}
                            className="profile-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Фамилия:</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={loading}
                            className="profile-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            className="profile-input"
                            required
                        />
                    </div>

                    <div className="profile-actions">
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={loading}
                        >
                            {loading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="logout-btn"
                            onClick={onLogout}
                        >
                            Выйти
                        </button>
                    </div>
                </form>

                <div className="profile-info">
                    <p><strong>ID:</strong> {user.id}</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;