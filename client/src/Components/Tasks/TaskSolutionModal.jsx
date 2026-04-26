import React, { useEffect, useState } from 'react';
import { getTaskSolution, saveTaskSolution } from '../../api/task';
import './TaskSolutionModal.css';

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

const normalizeSolution = (solution) => {
    if (!solution) return null;
    const item = toCamel(solution);

    return {
        id: item.id,
        taskId: item.taskId,
        explanation: item.explanation || '',
        updatedByName: item.updatedByName || '',
        updatedAt: item.updatedAt,
        attachments: (item.attachments || []).map((attachment) => ({
            id: attachment.id,
            imageDataUrl: attachment.imageDataUrl,
            createdAt: attachment.createdAt
        }))
    };
};

const TaskSolutionModal = ({ task, actorExecutorId, canEdit, onClose, onSaved }) => {
    const taskId = task?.Id || task?.id;
    const taskName = task?.Name || task?.name || '';
    const inlineSolution = normalizeSolution(task?.Solution || task?.solution);
    const [solution, setSolution] = useState(inlineSolution);
    const [explanation, setExplanation] = useState(inlineSolution?.explanation || '');
    const [attachments, setAttachments] = useState(inlineSolution?.attachments || []);
    const [loading, setLoading] = useState(!inlineSolution);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (!taskId || inlineSolution) return;

        setLoading(true);
        setError('');

        getTaskSolution(taskId)
            .then((data) => {
                const normalized = normalizeSolution(data);
                setSolution(normalized);
                setExplanation(normalized?.explanation || '');
                setAttachments(normalized?.attachments || []);
            })
            .catch((err) => {
                if (!String(err.message || '').includes('404')) {
                    setError(err.message || 'Не удалось загрузить решение');
                }
                setSolution(null);
                setExplanation('');
                setAttachments([]);
            })
            .finally(() => setLoading(false));
    }, [taskId]);

    const appendAttachments = async (fileList) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length !== files.length) {
            setError('Можно прикреплять только изображения');
            return;
        }

        if (attachments.length + imageFiles.length > MAX_ATTACHMENTS) {
            setError(`Не больше ${MAX_ATTACHMENTS} изображений в решении`);
            return;
        }

        try {
            const nextFiles = await readFilesAsDataUrls(imageFiles);
            setAttachments([...attachments, ...nextFiles]);
        } catch (err) {
            setError(err.message || 'Не удалось обработать изображения');
        }
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, attachmentIndex) => attachmentIndex !== index));
    };

    const handleSave = async () => {
        if (!canEdit || !actorExecutorId) return;
        if (!explanation.trim() && attachments.length === 0) {
            setError('Добавьте пояснение или хотя бы одно изображение');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const saved = await saveTaskSolution(taskId, {
                ActorExecutorId: actorExecutorId,
                Explanation: explanation.trim(),
                AttachmentDataUrls: attachments.map((attachment) => attachment.imageDataUrl)
            });
            const normalized = normalizeSolution(saved);
            setSolution(normalized);
            setExplanation(normalized?.explanation || '');
            setAttachments(normalized?.attachments || []);
            onSaved?.(normalized);
        } catch (err) {
            setError(err.message || 'Не удалось сохранить решение');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="solution-overlay" onClick={(event) => event.target.classList.contains('solution-overlay') && onClose()}>
                <div className="solution-modal">
                    <button className="solution-close" type="button" onClick={onClose} aria-label="Закрыть">×</button>

                    <div className="solution-header">
                        <span className="solution-eyebrow">Решение задачи</span>
                        <h3>{taskName || 'Задача'}</h3>
                        {solution?.updatedAt && (
                            <p>
                                Обновлено {formatDateTime(solution.updatedAt)}
                                {solution.updatedByName ? `, ${solution.updatedByName}` : ''}
                            </p>
                        )}
                    </div>

                    {error && <div className="solution-error">{error}</div>}
                    {loading && <div className="solution-empty">Загружаем решение...</div>}

                    {!loading && !solution && !canEdit && (
                        <div className="solution-empty">Решение пока не прикреплено.</div>
                    )}

                    {!loading && canEdit ? (
                        <div className="solution-editor">
                            <textarea
                                value={explanation}
                                onChange={(event) => setExplanation(event.target.value)}
                                placeholder="Опишите, что сделано, где смотреть результат и что важно проверить."
                                rows="7"
                            />

                            <div className="solution-toolbar">
                                <label className="solution-upload">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(event) => {
                                            appendAttachments(event.target.files);
                                            event.target.value = '';
                                        }}
                                    />
                                    <span>Прикрепить изображение</span>
                                </label>
                                <span className="solution-hint">До {MAX_ATTACHMENTS} изображений.</span>
                            </div>

                            {attachments.length > 0 && (
                                <div className="solution-gallery">
                                    {attachments.map((attachment, index) => (
                                        <div key={attachment.id || `${attachment.imageDataUrl.slice(0, 24)}-${index}`} className="solution-gallery-item">
                                            <button type="button" onClick={() => setSelectedImage(attachment.imageDataUrl)}>
                                                <img src={attachment.imageDataUrl} alt="" />
                                            </button>
                                            <button type="button" className="solution-remove" onClick={() => removeAttachment(index)}>
                                                Убрать
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="solution-actions">
                                <button type="button" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Сохраняем...' : 'Сохранить решение'}
                                </button>
                            </div>
                        </div>
                    ) : !loading && solution ? (
                        <div className="solution-view">
                            {solution.explanation && <p>{solution.explanation}</p>}
                            {solution.attachments.length > 0 && (
                                <div className="solution-gallery">
                                    {solution.attachments.map((attachment) => (
                                        <button key={attachment.id} type="button" onClick={() => setSelectedImage(attachment.imageDataUrl)}>
                                            <img src={attachment.imageDataUrl} alt="Вложение решения" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            {selectedImage && (
                <div className="solution-lightbox" onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Просмотр решения" />
                </div>
            )}
        </>
    );
};

export default TaskSolutionModal;
