import React, { useState } from 'react';
import { apiFetch } from '../../api/http';
import './AddMemberModal.css';

const AddMemberModal = ({ team, isOpen, onClose, onMemberAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const allStudents = await apiFetch('/students');

            const filteredResults = allStudents.filter(
                (student) => {
                    const isAlreadyInTeam = team.executors?.some(executor =>
                        executor.StudentId === student.Id
                    );

                    const isAlreadySelected = selectedStudents.some(s => s.Id === student.Id);

                    return (student.FirstName?.toLowerCase().includes(query.toLowerCase()) ||
                        student.LastName?.toLowerCase().includes(query.toLowerCase()) ||
                        student.Email?.toLowerCase().includes(query.toLowerCase())) &&
                        !isAlreadyInTeam && !isAlreadySelected;
                }
            );

            setSearchResults(filteredResults);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        }
    };

    const addStudent = (student) => {
        setSelectedStudents([...selectedStudents, {
            ...student,
            role: '0'
        }]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const removeStudent = (id) => {
        setSelectedStudents(selectedStudents.filter(s => s.Id !== id));
    };

    const changeRole = (id, role) => {
        setSelectedStudents(selectedStudents.map(s =>
            s.Id === id ? { ...s, role } : s
        ));
    };

    const handleAddMembers = async () => {
        if (selectedStudents.length === 0) {
            setError('Выберите хотя бы одного участника');
            return;
        }

        setError('');
        setLoading(true);

        try {
            for (let student of selectedStudents) {
                const requestBody = {
                    studentId: student.Id,
                    role: parseInt(student.role)
                };

                await apiFetch(`/teams/${team.id}/executors`, {
                    method: 'POST',
                    body: requestBody,
                });
            }

            alert('Участники успешно добавлены!');

            setSelectedStudents([]);
            setSearchQuery('');
            setSearchResults([]);

            if (onMemberAdded) {
                onMemberAdded();
            }

            onClose();
        } catch (err) {
            setError(err.message || 'Ошибка добавления участников');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="add-member-modal-overlay" onClick={onClose}>
            <div className="add-member-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2>Добавить участников в команду "{team.name}"</h2>

                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Поиск по имени или email..."
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        disabled={loading}
                        className="search-input"
                    />

                    {searchResults.length > 0 && (
                        <ul className="search-results">
                            {searchResults.map(student => (
                                <li
                                    key={student.Id}
                                    className="search-result-item"
                                    onClick={() => addStudent(student)}
                                >
                                    <div className="student-avatar">
                                        {student.FirstName?.[0]}{student.LastName?.[0]}
                                    </div>
                                    <div className="student-info">
                                        <span className="student-name">
                                            {student.FirstName} {student.LastName}
                                        </span>
                                        <span className="student-email">{student.Email}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="add-student-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addStudent(student);
                                        }}
                                        disabled={loading}
                                    >
                                        Добавить
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {selectedStudents.length > 0 && (
                    <div className="selected-students">
                        <h4>Выбранные участники:</h4>
                        <ul className="selected-list">
                            {selectedStudents.map(student => (
                                <li key={student.Id} className="selected-item">
                                    <div className="selected-student-info">
                                        <div className="student-avatar-small">
                                            {student.FirstName?.[0]}{student.LastName?.[0]}
                                        </div>
                                        <span className="student-name">
                                            {student.FirstName} {student.LastName}
                                        </span>
                                    </div>
                                    <div className="student-controls">
                                        <select
                                            value={student.role}
                                            onChange={(e) => changeRole(student.Id, e.target.value)}
                                            disabled={loading}
                                            className="role-select"
                                        >
                                            <option value="0">Участник</option>
                                            <option value="1">Лидер</option>
                                        </select>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeStudent(student.Id)}
                                            disabled={loading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {error && <p className="error-message">{error}</p>}

                <div className="modal-actions">
                    <button
                        className="cancel-btn"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Отмена
                    </button>
                    <button
                        className="add-btn"
                        onClick={handleAddMembers}
                        disabled={loading || selectedStudents.length === 0}
                    >
                        {loading ? 'Добавление...' : `Добавить участников (${selectedStudents.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;