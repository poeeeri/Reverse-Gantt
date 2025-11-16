import React, { useEffect, useState } from 'react';
import Login from './Components/Auth/Login';
import Register from './Components/Auth/Register';
import { getMe } from './api/auth';
import { clearToken, getToken } from './api/http';
import './App.css';

function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setChecking(false);
            return;
        }

        getMe()
            .then(setUser)
            .catch(err => {
                setAuthError(err.message || 'Сессия истекла, войдите снова');
                clearToken();
            })
            .finally(() => setChecking(false));
    }, []);

    const toggleForm = () => {
        setAuthError('');
        setIsLogin(!isLogin);
    };

    const handleAuthSuccess = ({ student }) => {
        setUser(student);
        setAuthError('');
    };

    const handleLogout = () => {
        clearToken();
        setUser(null);
    };

    if (checking) {
        return <div className="App">Загрузка...</div>;
    }

    if (user) {
        return (
            <div className="App auth-container">
                <div className="auth-card">
                    <h1>Вы авторизованы!</h1>
                    <p>Email: {user.email ?? user.Email}</p>
                    <p>Имя: {user.firstName ?? user.FirstName} {user.lastName ?? user.LastName}</p>
                    <button className="auth-button" onClick={handleLogout}>Выйти</button>
                    {authError && <p className="error">{authError}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            {isLogin ? (
                <Login onToggleForm={toggleForm} onAuth={handleAuthSuccess} />
            ) : (
                <Register onToggleForm={toggleForm} onAuth={handleAuthSuccess} />
            )}
            {authError && <p className="error">{authError}</p>}
        </div>
    );
}

export default App;
