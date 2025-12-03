import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = () => {
    const navigate = useNavigate();

    const handleAvatarClick = () => {
        navigate('/profile');
    };

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h1>Reverse Gantt</h1>
                </div>
                <nav className="sidebar-menu">
                    <NavLink to="/" className={({ isActive }) => (isActive ? "menu-btn active" : "menu-btn")}>Главная страница</NavLink>
                    <NavLink to="/projects" className={({ isActive }) => (isActive ? "menu-btn active" : "menu-btn")}>Проекты</NavLink>
                    <NavLink to="/teams" className={({ isActive }) => (isActive ? "menu-btn active" : "menu-btn")}>Команды</NavLink>
                    <NavLink to="/tasks" className={({ isActive }) => (isActive ? "menu-btn active" : "menu-btn")}>Мои задачи</NavLink>
                </nav>
            </aside>

            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-right">
                        <button className="notification-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </button>
                        <img
                            src="https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcToBrCBTklb0pPxeKN_aqC7F2xLSi1Vrq6c49ucxc3YXWwx7b7d"
                            alt="avatar"
                            className="user-avatar"
                            onClick={handleAvatarClick}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default MainLayout;