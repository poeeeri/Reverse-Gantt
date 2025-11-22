import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./Dashboard.css";
import CreateTeamModal from "../CreateTeam/CreateTeam";
import { apiFetch } from "../../api/http";

const Dashboard = () => {
    const { user } = useOutletContext();
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teams, setTeams] = useState([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [teamsError, setTeamsError] = useState("");

    useEffect(() => {
        if (!user?.Id) {
            setTeams([]);
            setTeamsLoading(false);
            return;
        }

        let cancelled = false;

        const loadTeams = async () => {
            setTeamsLoading(true);
            try {
                const data = await apiFetch("/teams");
                const filtered = (data || []).filter((team) =>
                    (team.Executors || []).some((e) => e.StudentId === user.Id)
                );
                if (!cancelled) {
                    setTeams(filtered);
                    setTeamsError("");
                }
            } catch (err) {
                if (!cancelled) {
                    setTeams([]);
                    setTeamsError(err.message || "Не удалось загрузить команды");
                }
            } finally {
                if (!cancelled) setTeamsLoading(false);
            }
        };

        loadTeams();
        return () => {
            cancelled = true;
        };
    }, [user?.Id]);

    const handleTeamCreated = (team) => {
        if ((team.Executors || []).some((e) => e.StudentId === user?.Id)) {
            setTeams((prev) => [team, ...prev]);
        }
    };

    const mockProjects = [
        {
            id: 1,
            progress: 80,
            title: "Система управления задачами",
            description: "Дизайн и реализация API и UI для командной доски задач.",
            daysLeft: 2,
        },
        {
            id: 2,
            progress: 45,
            title: "Внутренний портал команды",
            description: "Профили участников, лента объявлений и расписание встреч.",
            daysLeft: 5,
        },
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Управляйте проектами и командами в одном месте</h1>
                <p className="dashboard-subtitle">
                    Создавайте команды, распределяйте задачи и следите за прогрессом по проектам.
                </p>

                <div className="dashboard-buttons">
                    <button className="dash-btn" onClick={() => setShowTeamModal(true)}>
                        Создать команду
                    </button>
                    <button className="dash-btn">Создать проект</button>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="projects-section">
                    <h2>Мои команды</h2>
                    <div className="team-list">
                        {teamsLoading && <div className="muted-text">Загружаем команды...</div>}
                        {!teamsLoading && teamsError && <div className="error-text">{teamsError}</div>}
                        {!teamsLoading && !teamsError && teams.length === 0 && (
                            <div className="muted-text">Пока нет команд. Создайте первую, чтобы начать работу.</div>
                        )}
                        {!teamsLoading &&
                            !teamsError &&
                            teams.length > 0 &&
                            teams.map((team) => (
                                <div key={team.Id} className="team-card">
                                    <div className="team-card-header">
                                        <h3>{team.Name}</h3>
                                        <span className="pill">{(team.Executors?.length ?? 0)} участников</span>
                                    </div>
                                    <p className="team-desc">{team.Description || "Описание отсутствует"}</p>
                                    <div className="team-meta">
                                        <span>{(team.Projects?.length ?? 0)} проектов</span>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <h2>Последние проекты</h2>
                    <div className="project-list">
                        {mockProjects.map((p) => (
                            <div key={p.id} className="project-card">
                                <div className="progress-circle">{p.progress}%</div>
                                <div className="project-info">
                                    <h3>{p.title}</h3>
                                    <p>{p.description}</p>
                                    <span className="days-left">Дней осталось: {p.daysLeft}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="calendar-section">
                    <h2>Календарь задач</h2>
                    <div className="calendar-placeholder">Здесь появится календарь спринтов</div>
                </div>
            </div>

            {showTeamModal && (
                <CreateTeamModal
                    isOpen={showTeamModal}
                    onClose={() => setShowTeamModal(false)}
                    onTeamCreated={handleTeamCreated}
                />
            )}
        </div>
    );
};

export default Dashboard;
