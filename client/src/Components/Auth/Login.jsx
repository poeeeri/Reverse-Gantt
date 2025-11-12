import React, { useState } from 'react';
import './Auth.css';

const Login = ({ onToggleForm }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login data:', formData);
        // логика авторизации
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
                    <button type="submit" className="auth-button">Войти</button>
                </form>
                <p className="auth-toggle">
                    Нет аккаунта? <span onClick={onToggleForm}>Зарегистрироваться</span>
                </p>
            </div>
        </div>
    );
};

export default Login;