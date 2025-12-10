import React, { useState } from 'react';
import { apiFetch } from '../../api/http';
import './CreateTeam.css';

const CreateTeamModal = ({ isOpen, onClose, onTeamCreated }) => {
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const allStudents = await apiFetch('/students');
            
            const filteredResults = allStudents.filter(
                (student) => 
                    (student.FirstName?.toLowerCase().includes(query.toLowerCase()) ||
                    student.LastName?.toLowerCase().includes(query.toLowerCase()) ||
                    student.Email?.toLowerCase().includes(query.toLowerCase())) &&
                    !members.find((m) => m.Id === student.Id)
            );
            
            setSearchResults(filteredResults);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        }
    };

    const addMember = (student) => {
        setMembers([...members, { 
            ...student, 
            role: 'Member'
        }]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const removeMember = (id) => {
        setMembers(members.filter(m => m.Id !== id));
    };

    const changeRole = (id, role) => {
        setMembers(members.map(m => 
            m.Id === id ? { ...m, role } : m
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) {
            setError('Введите название команды');
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
                },
            });

            if (members.length > 0) {
                const roleToNumber = {
                    'Member': 0,
                    'Leader': 1
                };
                
                for (let member of members) {
                    const requestBody = { 
                        studentId: member.Id, 
                        role: roleToNumber[member.role] 
                    };

                    await apiFetch(`/teams/${createdTeam.Id}/executors`, {
                        method: 'POST',
                        body: requestBody,
                    });
                }
            }

            alert('Команда успешно создана!');
            
            setTeamName('');
            setDescription('');
            setMembers([]);
            setSearchQuery('');
            setSearchResults([]);
            
            if (onTeamCreated) {
                onTeamCreated(createdTeam);
            }
            
            onClose();
        } catch (err) {
            setError(err.message || 'Ошибка создания команды');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="modal-window" onClick={e => e.stopPropagation()}>
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
                        onChange={e => setTeamName(e.target.value)}
                        required
                        disabled={loading}
                    />
                    
                    <input
                        type="text"
                        placeholder="Описание команды"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
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
                            {searchResults.map(student => (
                                <li key={student.Id}>
                                    <span>{student.FirstName} {student.LastName} ({student.Email})</span>
                                    <button 
                                        type="button" 
                                        onClick={() => addMember(student)}
                                        disabled={loading}
                                    >
                                        Добавить
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {members.length > 0 && (
                        <ul className="members">
                            {members.map((m) => (
                                <li key={m.Id} className="member-item">
                                    <span className="member-name">{m.FirstName} {m.LastName} ({m.Email})</span>
                                    <select 
                                        value={m.role} 
                                        onChange={(e) => changeRole(m.Id, e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="Member">Участник</option>
                                        <option value="Leader">Лидер</option>
                                    </select>
                                    <button 
                                        className="remove" 
                                        onClick={() => removeMember(m.Id)}
                                        disabled={loading}
                                    >
                                        Удалить
                                    </button>
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
