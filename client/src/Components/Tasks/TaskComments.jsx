import React, { useEffect, useState } from 'react';
import { getTaskComments, addTaskComment, updateTaskComment, deleteTaskComment } from '../../api/comment';
import './TaskComments.css';

const TaskComments = ({ taskId, currentUser, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingContent, setEditingContent] = useState('');

    const fetchComments = async () => {
        try {
            const data = await getTaskComments(taskId);
            console.log('Комментарии с бэка:', data);
            setComments(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const handleAdd = async () => {
        if (!newContent.trim()) return;
        await addTaskComment(taskId, newContent, currentUser.id);
        setNewContent('');
        fetchComments();
    };

    const handleEdit = (comment) => {
        setEditingId(comment.Id);
        setEditingContent(comment.Content);
    };

    const handleUpdate = async (id) => {
        if (!editingContent.trim()) return;
        await updateTaskComment(taskId, id, editingContent);
        setEditingId(null);
        setEditingContent('');
        fetchComments();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить комментарий?')) return;
        await deleteTaskComment(taskId, id);
        fetchComments();
    };

    const handleOverlayClick = (e) => {
        if (e.target.className === 'comments-overlay') onClose();
    };

    return (
        <div className="comments-overlay" onClick={handleOverlayClick}>
            <div className="comments-modal">
                <button className="close-btn" onClick={onClose}>×</button>
                <h3>Комментарии</h3>

                <div className="comments-list">
                    {comments.map(comment => (
                        <div key={comment.Id} className="comment-item">
                            <div className="comment-author">{comment.AuthorName}</div>
                            {editingId === comment.Id ? (
                                <div className="comment-edit">
                                    <textarea
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                    />
                                    <button onClick={() => handleUpdate(comment.Id)}>Сохранить</button>
                                    <button onClick={() => setEditingId(null)}>Отмена</button>
                                </div>
                            ) : (
                                <div className="comment-content">{comment.Content}</div>
                            )}
                            {comment.StudentId === currentUser.id && editingId !== comment.Id && (
                                <div className="comment-actions">
                                    <button onClick={() => handleEdit(comment)}>✏️</button>
                                    <button onClick={() => handleDelete(comment.Id)}>🗑️</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="comment-add">
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Написать комментарий..."
                    />
                    <button onClick={handleAdd}>Отправить</button>
                </div>
            </div>
        </div>
    );
};

export default TaskComments;
