import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
    const mockProjects = [
        {
            id: 1,
            progress: 80,
            title: "Адаптивный редизайн мобильной версии",
            description: "Переработка всех экранов под мобильные устройства",
            daysLeft: 2
        },
        {
            id: 2,
            progress: 45,
            title: "Создание базы данных",
            description: "Проектирование и реализация структуры таблиц",
            daysLeft: 5
        },
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Добро пожаловать в систему управления задачами!</h1>
                <p className="dashboard-subtitle">
                    Здесь вы можете создавать проекты, управлять командами и следить за своими задачами
                </p>
            </div>

            {/* <div className="dashboard-content">
                <div className="projects-section">
                    <h2>Статистика проектов</h2>
                    <div className="project-list">
                        {mockProjects.map((p) => (
                            <div key={p.id} className="project-card">
                                <div className="progress-circle">{p.progress}%</div>
                                <div className="project-info">
                                    <h3>{p.title}</h3>
                                    <p>{p.description}</p>
                                    <span className="days-left">Осталось: {p.daysLeft} дня</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="calendar-section">
                    <h2>Календарь</h2>
                    <div className="calendar-placeholder">
                        Здесь будет календарь
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default Dashboard;