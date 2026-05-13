import React, { useState } from 'react';
import { register } from '../../api/auth';
import './Auth.css';

const Register = ({ onToggleForm }) => {
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);
        try {
            const data = await register(formData);
            setSuccess(
                data.message ||
                data.Message ||
                'Заявка создана. Дождитесь подтверждения администратора.'
            );
        } catch (err) {
            if (err.errors && Array.isArray(err.errors)) {
                setError(err.errors.join(', '));
            } else {
                setError(err.message || 'Ошибка регистрации');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Регистрация</h1>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <input
                            type="text"
                            name="name"
                            placeholder="Имя"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Фамилия"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Пароль"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Подтвердите пароль"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="auth-input"
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Создаём заявку...' : 'Отправить заявку'}
                    </button>
                </form>
                <p className="auth-toggle">
                    Уже есть аккаунт? <span onClick={onToggleForm}>Войти</span>
                </p>
            </div>
        </div>
    );
};

export default Register;
