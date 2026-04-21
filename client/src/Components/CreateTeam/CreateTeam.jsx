import React, { useMemo, useState } from 'react';
import { apiFetch } from '../../api/http';
import './CreateTeam.css';

const CreateTeamModal = ({ isOpen, onClose, onTeamCreated, user }) => {
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const creatorMember = useMemo(() => {
        if (!user?.id) return null;

        return {
            Id: user.id,
            FirstName: user.firstName,
            LastName: user.lastName,
            Email: user.email,
            role: 'Leader',
            isCreator: true
        };
    }, [user]);

    if (!isOpen) return null;

    const handleSearch = async (event) => {
        const query = event.target.value;
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const allStudents = await apiFetch('/students');

            const filteredResults = allStudents.filter((student) =>
                (
                    student.FirstName?.toLowerCase().includes(query.toLowerCase()) ||
                    student.LastName?.toLowerCase().includes(query.toLowerCase()) ||
                    student.Email?.toLowerCase().includes(query.toLowerCase())
                ) &&
                student.Id !== creatorMember?.Id &&
                !members.find((member) => member.Id === student.Id)
            );

            setSearchResults(filteredResults);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        }
    };

    const addMember = (student) => {
        setMembers([
            ...members,
            {
                ...student,
                role: 'Member'
            }
        ]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const removeMember = (id) => {
        setMembers(members.filter((member) => member.Id !== id));
    };

    const changeRole = (id, role) => {
        setMembers(members.map((member) => (
            member.Id === id ? { ...member, role } : member
        )));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!teamName.trim()) {
            setError('Введите название команды');
            return;
        }

        if (!creatorMember) {
            setError('Не удалось определить создателя команды');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const createdTeam = await apiFetch('/teams', {
                method: 'POST',
                body: {
                    name: teamName,
                    description: description || ''
                }
            });

            const finalMembers = [creatorMember, ...members.filter((member) => member.Id !== creatorMember.Id)];
            const roleToNumber = {
                Member: 0,
                Leader: 1
            };

            for (const member of finalMembers) {
                await apiFetch(`/teams/${createdTeam.Id}/executors`, {
                    method: 'POST',
                    body: {
                        studentId: member.Id,
                        role: roleToNumber[member.role]
                    }
                });
            }

            setTeamName('');
            setDescription('');
            setMembers([]);
            setSearchQuery('');
            setSearchResults([]);

            onTeamCreated?.(createdTeam);
            onClose();
        } catch (err) {
            setError(err.message || 'Ошибка создания команды');
        } finally {
            setLoading(false);
        }
    };

    const displayMembers = creatorMember
        ? [creatorMember, ...members.filter((member) => member.Id !== creatorMember.Id)]
        : members;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="modal-window" onClick={(event) => event.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h2>Создание команды</h2>

                <form className="form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Название команды *"
                        value={teamName}
                        onChange={(event) => setTeamName(event.target.value)}
                        required
                        disabled={loading}
                    />

                    <input
                        type="text"
                        placeholder="Описание команды"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        disabled={loading}
                    />

                    <input
                        type="text"
                        placeholder="Добавить участников по имени или email"
                        value={searchQuery}
                        onChange={handleSearch}
                        disabled={loading}
                    />

                    {searchResults.length > 0 && (
                        <ul className="search-list">
                            {searchResults.map((student) => (
                                <li key={student.Id}>
                                    <span>{student.FirstName} {student.LastName} ({student.Email})</span>
                                    <button type="button" onClick={() => addMember(student)} disabled={loading}>
                                        Добавить
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {displayMembers.length > 0 && (
                        <ul className="members">
                            {displayMembers.map((member) => (
                                <li key={member.Id} className="member-item">
                                    <span className="member-name">{member.FirstName} {member.LastName} ({member.Email})</span>
                                    {member.isCreator ? (
                                        <>
                                            <select value="Leader" disabled>
                                                <option value="Leader">Лидер</option>
                                            </select>
                                            <button type="button" className="remove" disabled>
                                                Создатель
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={(event) => changeRole(member.Id, event.target.value)}
                                                disabled={loading}
                                            >
                                                <option value="Member">Участник</option>
                                                <option value="Leader">Лидер</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="remove"
                                                onClick={() => removeMember(member.Id)}
                                                disabled={loading}
                                            >
                                                Удалить
                                            </button>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Создание...' : 'Создать команду'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;
