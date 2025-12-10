import React, { useState } from 'react';
import { apiFetch } from '../../api/http';
import './TeamMemberModal.css';

const TeamMemberModal = ({ team, member, isOpen, onClose, onMemberUpdated, isLeader, currentExecutorId }) => {
    const [newRole, setNewRole] = useState(member?.Role || 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChangeRole = async () => {
        try {
            setLoading(true);
            setError('');

            // API для изменения роли??
            await apiFetch(`/teams/${team.Id}/executors/${member.Id}/role`, {
                method: 'PATCH',
                body: { role: parseInt(newRole) }
            });

            onMemberUpdated();
            onClose();
            alert('Роль успешно изменена!');
        } catch (err) {
            setError('Ошибка при изменении роли');
            console.error('Error changing role:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!confirm(`Вы уверены, что хотите удалить ${member.StudentName} из команды?`)) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const teamId = team?.Id || team?.id;
            if (!teamId || !currentExecutorId) throw new Error('Нет прав для удаления');

            await apiFetch(`/teams/${teamId}/executors/${member.Id}?actorExecutorId=${currentExecutorId}`, {
                method: 'DELETE'
            });

            onMemberUpdated();
            onClose();
            alert('Участник успешно удален!');
        } catch (err) {
            setError('Ошибка при удалении участника');
            console.error('Error removing member:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="team-member-modal-overlay" onClick={onClose}>
            <div className="team-member-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2>Управление участником</h2>
                <div className="member-info">
                    <div className="member-avatar-large">
                        {member.StudentName ?
                            member.StudentName.split(' ').map(n => n[0]).join('') :
                            '??'
                        }
                    </div>
                    <h3>{member.StudentName}</h3>
                    <p>Email: {member.StudentEmail || 'Не указан'}</p>
                </div>

                {isLeader && (
                    <div className="management-section">
                        <h4>Изменить роль</h4>
                        <select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                            disabled={loading}
                        >
                            <option value="0">Участник</option>
                            <option value="1">Лидер</option>
                        </select>

                        <button
                            className="change-role-btn"
                            onClick={handleChangeRole}
                            disabled={loading || member.Role === parseInt(newRole)}
                        >
                            {loading ? 'Сохранение...' : 'Изменить роль'}
                        </button>

                        <h4 style={{ marginTop: '20px' }}>Удалить из команды</h4>
                        <button
                            className="remove-member-btn"
                            onClick={handleRemoveMember}
                            disabled={loading}
                        >
                            {loading ? 'Удаление...' : 'Удалить участника'}
                        </button>
                    </div>
                )}

                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default TeamMemberModal;