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