import React, { useState } from 'react';
import { login, resendConfirmation } from '../../api/auth';
import './Auth.css';

const Login = ({ onToggleForm, onAuth }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        try {
            const data = await login(formData);
            const student = data.student ?? data.Student;
            const token = data.token ?? data.Token;
            onAuth({ student, token });
        } catch (err) {
            setError(err.message || 'Ошибка авторизации');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!formData.email.trim()) {
            setError('Введите email, чтобы отправить письмо повторно');
            return;
        }

        setResending(true);
        setError('');
        setInfo('');

        try {
            const data = await resendConfirmation(formData.email);
            setInfo(data.message || data.Message || 'Письмо отправлено повторно');
        } catch (err) {
            setError(err.message || 'Не удалось отправить письмо повторно');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Вход в систему</h1>
                <form onSubmit={handleSubmit} className="auth-form">
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
                    {error && <p className="error">{error}</p>}
                    {info && <p className="success-message">{info}</p>}
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                    <button type="button" className="auth-secondary-button" disabled={resending} onClick={handleResend}>
                        {resending ? 'Отправляем письмо...' : 'Отправить письмо повторно'}
                    </button>
                </form>
                <p className="auth-toggle">
                    Нет аккаунта? <span onClick={onToggleForm}>Зарегистрируйтесь</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
