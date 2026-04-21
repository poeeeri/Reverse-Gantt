import React, { useEffect, useState } from 'react';
import { getTaskComments, addTaskComment, updateTaskComment, deleteTaskComment } from '../../api/comment';
import './TaskComments.css';

const MAX_ATTACHMENTS = 6;

const toCamel = (value) => {
    if (Array.isArray(value)) return value.map(toCamel);
    if (!value || typeof value !== 'object') return value;

    return Object.keys(value).reduce((acc, key) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        acc[camelKey] = toCamel(value[key]);
        return acc;
    }, {});
};

const formatDateTime = (value) => {
    if (!value) return '';

    try {
        return new Date(value).toLocaleString('ru-RU', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
};

const readFilesAsDataUrls = async (files) => {
    return Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, imageDataUrl: reader.result });
        reader.onerror = () => reject(new Error(`Не удалось прочитать файл ${file.name}`));
        reader.readAsDataURL(file);
    })));
};

const normalizeComment = (comment) => {
    const item = toCamel(comment);
    return {
        id: item.id,
        taskId: item.taskId,
        studentId: item.studentId,
        authorName: item.authorName || 'Участник команды',
        content: item.content || '',
        createdAt: item.createdAt,
        isRead: Boolean(item.isRead),
        attachments: (item.attachments || []).map((attachment) => ({
            id: attachment.id,
            imageDataUrl: attachment.imageDataUrl,
            createdAt: attachment.createdAt
        }))
    };
};

const TaskComments = ({ taskId, currentUser, onClose, taskName = '', onCommentsRead = null }) => {
    const [comments, setComments] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [newAttachments, setNewAttachments] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [editingAttachments, setEditingAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    const fetchComments = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await getTaskComments(taskId, currentUser?.id);
            const normalized = (data || []).map(normalizeComment);
            setComments(normalized);
            onCommentsRead?.(taskId, normalized);
        } catch (err) {
            setError(err.message || 'Не удалось загрузить комментарии');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [taskId, currentUser?.id]);

    const appendAttachments = async (fileList, setter, existing) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length !== files.length) {
            setError('Можно прикреплять только изображения');
            return;
        }

        if (existing.length + imageFiles.length > MAX_ATTACHMENTS) {
            setError(`Не больше ${MAX_ATTACHMENTS} изображений в одном комментарии`);
            return;
        }

        try {
            const nextFiles = await readFilesAsDataUrls(imageFiles);
            setter([...existing, ...nextFiles]);
        } catch (err) {
            setError(err.message || 'Не удалось обработать изображения');
        }
    };

    const handleAdd = async () => {
        if (!newContent.trim()) {
            setError('Введите текст комментария');
            return;
        }

        setSaving(true);
        setError('');

        try {
            await addTaskComment(
                taskId,
                newContent.trim(),
                currentUser.id,
                newAttachments.map((attachment) => attachment.imageDataUrl)
            );
            setNewContent('');
            setNewAttachments([]);
            await fetchComments();
        } catch (err) {
            setError(err.message || 'Не удалось отправить комментарий');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (comment) => {
        setEditingId(comment.id);
        setEditingContent(comment.content);
        setEditingAttachments(comment.attachments.map((attachment) => ({
            id: attachment.id,
            imageDataUrl: attachment.imageDataUrl
        })));
        setError('');
    };

    const handleUpdate = async (id) => {
        if (!editingContent.trim()) {
            setError('Текст комментария не может быть пустым');
            return;
        }

        setSaving(true);
        setError('');

        try {
            await updateTaskComment(
                taskId,
                id,
                editingContent.trim(),
                editingAttachments.map((attachment) => attachment.imageDataUrl)
            );
            setEditingId(null);
            setEditingContent('');
            setEditingAttachments([]);
            await fetchComments();
        } catch (err) {
            setError(err.message || 'Не удалось обновить комментарий');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить комментарий?')) return;

        try {
            await deleteTaskComment(taskId, id);
            await fetchComments();
        } catch (err) {
            setError(err.message || 'Не удалось удалить комментарий');
        }
    };

    const handleOverlayClick = (event) => {
        if (event.target.classList.contains('comments-overlay')) onClose();
    };

    const removeAttachment = (index, attachments, setter) => {
        setter(attachments.filter((_, attachmentIndex) => attachmentIndex !== index));
    };

    return (
        <>
            <div className="comments-overlay" onClick={handleOverlayClick}>
                <div className="comments-modal">
                    <button className="close-btn" onClick={onClose} aria-label="Закрыть">×</button>

                    <div className="comments-modal__hero">
                        <div>
                            <span className="comments-modal__eyebrow">Командное обсуждение</span>
                            <h3>{taskName ? `Обсуждение задачи «${taskName}»` : 'Комментарии к задаче'}</h3>
                            <p>Здесь можно оставить контекст, приложить скриншоты и быстро договориться по следующему шагу.</p>
                        </div>
                        <div className="comments-modal__stats">
                            <span className="comments-stat__value">{comments.length}</span>
                            <span className="comments-stat__label">сообщений</span>
                        </div>
                    </div>

                    {error && <div className="comments-banner comments-banner--error">{error}</div>}

                    <div className="comments-list">
                        {loading && <div className="comments-empty">Загружаем обсуждение...</div>}

                        {!loading && comments.length === 0 && (
                            <div className="comments-empty">
                                Пока пусто. Добавьте первый комментарий, чтобы зафиксировать решение или приложить скриншот.
                            </div>
                        )}

                        {!loading && comments.map((comment) => {
                            const isAuthor = comment.studentId === currentUser.id;
                            const isEditing = editingId === comment.id;

                            return (
                                <article key={comment.id} className={`comment-item ${isAuthor ? 'is-own' : ''}`}>
                                    <div className="comment-item__top">
                                        <div>
                                            <div className="comment-author-line">
                                                <div className="comment-author">{comment.authorName}</div>
                                                {!comment.isRead && !isAuthor && <span className="comment-unread-pill">Новое</span>}
                                            </div>
                                            <div className="comment-time">{formatDateTime(comment.createdAt)}</div>
                                        </div>

                                        {isAuthor && !isEditing && (
                                            <div className="comment-actions">
                                                <button type="button" onClick={() => handleEdit(comment)}>Редактировать</button>
                                                <button type="button" className="danger" onClick={() => handleDelete(comment.id)}>Удалить</button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="comment-edit">
                                            <textarea
                                                value={editingContent}
                                                onChange={(event) => setEditingContent(event.target.value)}
                                                rows="4"
                                            />

                                            <div className="comment-attachments-editor">
                                                <label className="comment-upload">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(event) => {
                                                            appendAttachments(event.target.files, setEditingAttachments, editingAttachments);
                                                            event.target.value = '';
                                                        }}
                                                    />
                                                    <span>Добавить фото</span>
                                                </label>
                                                <span className="comment-upload__hint">
                                                    До {MAX_ATTACHMENTS} изображений. Можно заменить вложения перед сохранением.
                                                </span>
                                            </div>

                                            {editingAttachments.length > 0 && (
                                                <div className="comment-gallery">
                                                    {editingAttachments.map((attachment, index) => (
                                                        <div key={attachment.id || `${attachment.imageDataUrl.slice(0, 24)}-${index}`} className="comment-gallery__item">
                                                            <button
                                                                type="button"
                                                                className="comment-gallery__preview"
                                                                onClick={() => setSelectedImage(attachment.imageDataUrl)}
                                                            >
                                                                <img src={attachment.imageDataUrl} alt="" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="comment-gallery__remove"
                                                                onClick={() => removeAttachment(index, editingAttachments, setEditingAttachments)}
                                                            >
                                                                Убрать
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="comment-edit__actions">
                                                <button type="button" onClick={() => handleUpdate(comment.id)} disabled={saving}>Сохранить</button>
                                                <button
                                                    type="button"
                                                    className="ghost"
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditingContent('');
                                                        setEditingAttachments([]);
                                                    }}
                                                    disabled={saving}
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="comment-content">{comment.content}</div>

                                            {comment.attachments.length > 0 && (
                                                <div className="comment-gallery">
                                                    {comment.attachments.map((attachment) => (
                                                        <button
                                                            key={attachment.id}
                                                            type="button"
                                                            className="comment-gallery__preview"
                                                            onClick={() => setSelectedImage(attachment.imageDataUrl)}
                                                        >
                                                            <img src={attachment.imageDataUrl} alt="Вложение к комментарию" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    <div className="comment-add">
                        <div className="comment-add__header">
                            <div>
                                <strong>Новый комментарий</strong>
                                <span>Добавьте описание, фото результата, макета или проблемы.</span>
                            </div>

                            <label className="comment-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) => {
                                        appendAttachments(event.target.files, setNewAttachments, newAttachments);
                                        event.target.value = '';
                                    }}
                                />
                                <span>Прикрепить фото</span>
                            </label>
                        </div>

                        <textarea
                            value={newContent}
                            onChange={(event) => setNewContent(event.target.value)}
                            placeholder="Например: загрузил первый вариант макета, посмотрите второй скриншот на мобильном."
                            rows="4"
                        />

                        {newAttachments.length > 0 && (
                            <div className="comment-gallery">
                                {newAttachments.map((attachment, index) => (
                                    <div key={`${attachment.name}-${index}`} className="comment-gallery__item">
                                        <button
                                            type="button"
                                            className="comment-gallery__preview"
                                            onClick={() => setSelectedImage(attachment.imageDataUrl)}
                                        >
                                            <img src={attachment.imageDataUrl} alt={attachment.name} />
                                        </button>
                                        <button
                                            type="button"
                                            className="comment-gallery__remove"
                                            onClick={() => removeAttachment(index, newAttachments, setNewAttachments)}
                                        >
                                            Убрать
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="comment-add__footer">
                            <span className="comment-upload__hint">
                                Поддерживаются изображения. Лимит: {MAX_ATTACHMENTS} файлов на комментарий.
                            </span>
                            <button onClick={handleAdd} disabled={saving}>
                                {saving ? 'Отправляем...' : 'Отправить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedImage && (
                <div className="comment-lightbox" onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Просмотр вложения" />
                </div>
            )}
        </>
    );
};

export default TaskComments;
