import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

import MainLayout from './Components/Layout/MainLayout';
import ProtectedRoute from './Components/Layout/ProtectedRoute';

import Login from './Components/Auth/Login';
import Register from './Components/Auth/Register';
import Dashboard from './Components/Dashboard/Dashboard';
import Profile from './Components/Profile/Profile';

import { getMe } from './api/auth';
import { clearToken, getToken } from './api/http';

function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}

function AuthWrapper({ onAuth }) {
    const [isLogin, setIsLogin] = useState(true);
    const toggleForm = () => setIsLogin(prev => !prev);

    return isLogin
        ? <Login onAuth={onAuth} onToggleForm={toggleForm} />
        : <Register onAuth={onAuth} onToggleForm={toggleForm} />;
}

function App() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [authError, setAuthError] = useState('');
    const navigate = useNavigate();

    const pascalToCamel = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        const newObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                newObj[camelKey] = obj[key];
            }
        }
        return newObj;
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setChecking(false);
            return;
        }

        getMe()
            .then(userData => {
                const student = pascalToCamel(userData);
                setUser(student);
            })
            .catch(err => {
                setAuthError('Сессия истекла, войдите снова');
                clearToken();
                setUser(null);
            })
            .finally(() => setChecking(false));
    }, []);

    const handleAuthSuccess = (data) => {
        let student;
        if (data.student) {
            student = pascalToCamel(data.student);
        } else if (data.Student) {
            student = pascalToCamel(data.Student);
        } else {
            student = pascalToCamel(data);
        }

        setUser(student);
        setAuthError('');
        navigate('/');
    };

    const handleLogout = () => {
        clearToken();
        setUser(null);
        setAuthError('');
        navigate('/login');
    };

    const handleUpdateUser = (updatedUser) => {
        const student = pascalToCamel(updatedUser);
        setUser(student);
    };

    if (checking) {
        return <div className="App">Загрузка...</div>;
    }

    return (
        <Routes>
            {!user && (
                <>
                    <Route path="/login" element={
                        <AuthWrapper
                            onAuth={handleAuthSuccess}
                        />
                    } />
                    <Route path="/register" element={
                        <AuthWrapper
                            onAuth={handleAuthSuccess}
                        />
                    } />
                </>
            )}

            {user && (
                <Route element={
                    <ProtectedRoute user={user}>
                        <MainLayout onLogout={handleLogout} />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="/projects" element={<div>Проекты</div>} />
                    <Route path="/tasks" element={<div>Мои задачи</div>} />
                    <Route path="/profile" element={
                        <Profile
                            user={user}
                            onUpdateUser={handleUpdateUser}
                            onLogout={handleLogout}
                        />
                    } />
                </Route>
            )}

            {!user && <Route path="*" element={<Navigate to="/login" replace />} />}
            {user && <Route path="/login" element={<Navigate to="/" replace />} />}
            {user && <Route path="/register" element={<Navigate to="/" replace />} />}

            {authError && (
                <Route path="*" element={
                    <div className="error-container">
                        <p className="error">{authError}</p>
                    </div>
                } />
            )}
        </Routes>
    );
}

export default AppWrapper;