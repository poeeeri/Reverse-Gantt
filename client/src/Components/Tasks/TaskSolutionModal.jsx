import React, { useEffect, useMemo, useState } from 'react';
import { getTaskSolution, saveTaskSolution } from '../../api/task';
import './TaskSolutionModal.css';

const MAX_ATTACHMENTS = 6;

const solutionTemplates = [
    {
        label: 'Что сделано',
        text: '## Что сделано\n- '
    },
    {
        label: 'Как проверить',
        text: '## Как проверить\n1. \n2. '
    },
    {
        label: 'Ссылки',
        text: '## Ссылки\n- [Название](https://)'
    },
    {
        label: 'Известные ограничения',
        text: '## Известные ограничения\n- '
    }
];

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

const renderInlineMarkdown = (text) => {
    const parts = [];
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\)|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];
        const key = `${match.index}-${token}`;

        if (token.startsWith('**')) {
            parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('`')) {
            parts.push(<code key={key}>{token.slice(1, -1)}</code>);
        } else if (token.startsWith('[')) {
            const labelEnd = token.indexOf(']');
            const label = token.slice(1, labelEnd);
            const href = token.slice(labelEnd + 2, -1);
            parts.push(
                <a key={key} href={href} target="_blank" rel="noreferrer">
                    {label}
                </a>
            );
        } else if (token.startsWith('*')) {
            parts.push(<em key={key}>{token.slice(1, -1)}</em>);
        }

        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
};

const renderMarkdown = (value) => {
    const lines = String(value || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let index = 0;

    const readList = (ordered) => {
        const items = [];
        const matcher = ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;

        while (index < lines.length) {
            const match = lines[index].match(matcher);
            if (!match) break;
            items.push(match[1]);
            index += 1;
        }

        const Tag = ordered ? 'ol' : 'ul';
        return (
            <Tag key={`list-${index}-${items.length}`}>
                {items.map((item, itemIndex) => (
                    <li key={`${itemIndex}-${item}`}>{renderInlineMarkdown(item)}</li>
                ))}
            </Tag>
        );
    };

    while (index < lines.length) {
        const line = lines[index];

        if (!line.trim()) {
            index += 1;
            continue;
        }

        if (line.startsWith('```')) {
            const code = [];
            index += 1;

            while (index < lines.length && !lines[index].startsWith('```')) {
                code.push(lines[index]);
                index += 1;
            }

            if (index < lines.length) index += 1;
            blocks.push(<pre key={`code-${index}`}><code>{code.join('\n')}</code></pre>);
            continue;
        }

        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
            const level = heading[1].length;
            const Tag = `h${level + 3}`;
            blocks.push(<Tag key={`heading-${index}`}>{renderInlineMarkdown(heading[2])}</Tag>);
            index += 1;
            continue;
        }

        if (/^[-*]\s+/.test(line)) {
            blocks.push(readList(false));
            continue;
        }

        if (/^\d+\.\s+/.test(line)) {
            blocks.push(readList(true));
            continue;
        }

        if (line.startsWith('> ')) {
            const quote = [];

            while (index < lines.length && lines[index].startsWith('> ')) {
                quote.push(lines[index].slice(2));
                index += 1;
            }

            blocks.push(
                <blockquote key={`quote-${index}`}>
                    {quote.map((item, itemIndex) => (
                        <p key={`${itemIndex}-${item}`}>{renderInlineMarkdown(item)}</p>
                    ))}
                </blockquote>
            );
            continue;
        }

        const paragraph = [line];
        index += 1;

        while (
            index < lines.length &&
            lines[index].trim() &&
            !lines[index].startsWith('```') &&
            !/^(#{1,3})\s+/.test(lines[index]) &&
            !/^[-*]\s+/.test(lines[index]) &&
            !/^\d+\.\s+/.test(lines[index]) &&
            !lines[index].startsWith('> ')
        ) {
            paragraph.push(lines[index]);
            index += 1;
        }

        blocks.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(paragraph.join(' '))}</p>);
    }

    return blocks;
};

const TaskSolutionModal = ({ task, actorExecutorId, canEdit, onClose, onSaved }) => {
    const taskId = task?.Id || task?.id;
    const taskName = task?.Name || task?.name || '';
    const inlineSolution = useMemo(() => normalizeSolution(task?.Solution || task?.solution), [task]);
    const [solution, setSolution] = useState(inlineSolution);
    const [explanation, setExplanation] = useState(inlineSolution?.explanation || '');
    const [attachments, setAttachments] = useState(inlineSolution?.attachments || []);
    const [loading, setLoading] = useState(!inlineSolution);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [mode, setMode] = useState(inlineSolution ? 'preview' : 'edit');
    const draftKey = taskId ? `task-solution-draft:${taskId}` : '';

    useEffect(() => {
        if (!taskId || inlineSolution) return;

        setLoading(true);
        setError('');

        getTaskSolution(taskId)
            .then((data) => {
                const normalized = normalizeSolution(data);
                const savedDraft = draftKey ? window.localStorage.getItem(draftKey) : '';
                setSolution(normalized);
                setExplanation(savedDraft || normalized?.explanation || '');
                setAttachments(normalized?.attachments || []);
                setMode(normalized ? 'preview' : 'edit');
            })
            .catch((err) => {
                if (!String(err.message || '').includes('404')) {
                    setError(err.message || 'Не удалось загрузить решение');
                }
                setSolution(null);
                setExplanation('');
                setAttachments([]);
                setMode('edit');
            })
            .finally(() => setLoading(false));
    }, [taskId, inlineSolution, draftKey]);

    useEffect(() => {
        if (!inlineSolution || !draftKey || !canEdit) return;
        const savedDraft = window.localStorage.getItem(draftKey);
        if (savedDraft) {
            setExplanation(savedDraft);
        }
    }, [canEdit, draftKey, inlineSolution]);

    useEffect(() => {
        if (!draftKey || !canEdit) return;

        const baseExplanation = solution?.explanation || '';
        if (explanation.trim() && explanation !== baseExplanation) {
            window.localStorage.setItem(draftKey, explanation);
        } else {
            window.localStorage.removeItem(draftKey);
        }
    }, [canEdit, draftKey, explanation, solution]);

    const hasUnsavedDraft = canEdit && explanation !== (solution?.explanation || '');

    const requestClose = () => {
        if (hasUnsavedDraft && !window.confirm('Есть несохранённый черновик решения. Закрыть окно?')) {
            return;
        }

        onClose();
    };

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
            if (draftKey) {
                window.localStorage.removeItem(draftKey);
            }
            setMode('preview');
            onSaved?.(normalized);
        } catch (err) {
            setError(err.message || 'Не удалось сохранить решение');
        } finally {
            setSaving(false);
        }
    };

    const hasDraft = explanation.trim() || attachments.length > 0;
    const canPreviewDraft = canEdit && hasDraft;
    const previewExplanation = canPreviewDraft ? explanation : solution?.explanation || '';
    const previewAttachments = canPreviewDraft ? attachments : solution?.attachments || [];
    const showPreview = mode === 'preview' && (solution || canPreviewDraft);
    const showEditor = canEdit && mode === 'edit';

    return (
        <>
            <div className="solution-overlay" onClick={(event) => event.target.classList.contains('solution-overlay') && requestClose()}>
                <div className="solution-modal">
                    <button className="solution-close" type="button" onClick={requestClose} aria-label="Закрыть">×</button>

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

                    {canEdit && (
                        <div className="solution-tabs" role="tablist" aria-label="Режим решения">
                            <button
                                type="button"
                                className={mode === 'preview' ? 'active' : ''}
                                onClick={() => setMode('preview')}
                                disabled={!solution && !hasDraft}
                            >
                                Просмотр
                            </button>
                            <button
                                type="button"
                                className={mode === 'edit' ? 'active' : ''}
                                onClick={() => setMode('edit')}
                            >
                                Редактирование
                            </button>
                        </div>
                    )}

                    {error && <div className="solution-error">{error}</div>}
                    {loading && <div className="solution-empty">Загружаем решение...</div>}

                    {!loading && !solution && !canEdit && (
                        <div className="solution-empty">Решение пока не прикреплено.</div>
                    )}

                    {!loading && showPreview && (
                        <div className="solution-view">
                            <div className="solution-preview-card">
                                {previewExplanation ? (
                                    <div className="solution-markdown">
                                        {renderMarkdown(previewExplanation)}
                                    </div>
                                ) : (
                                    <div className="solution-empty compact">Пояснение не добавлено.</div>
                                )}
                            </div>

                            {previewAttachments.length > 0 && (
                                <div className="solution-gallery">
                                    {previewAttachments.map((attachment, index) => (
                                        <button
                                            key={attachment.id || `${attachment.imageDataUrl.slice(0, 24)}-${index}`}
                                            type="button"
                                            onClick={() => setSelectedImage(attachment.imageDataUrl)}
                                        >
                                            <img src={attachment.imageDataUrl} alt="Вложение решения" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && showEditor && (
                        <div className="solution-editor">
                            <div className="solution-templates">
                                {solutionTemplates.map((template) => (
                                    <button
                                        key={template.label}
                                        type="button"
                                        onClick={() => setExplanation((current) => (
                                            current.trim()
                                                ? `${current.trim()}\n\n${template.text}`
                                                : template.text
                                        ))}
                                    >
                                        {template.label}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={explanation}
                                onChange={(event) => setExplanation(event.target.value)}
                                placeholder="Опишите, что сделано, где смотреть результат и что важно проверить. Можно использовать Markdown: # заголовки, списки, **жирный текст**, `код`, ссылки."
                                rows="9"
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
                                <div className="solution-gallery editable">
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
                                {hasDraft && (
                                    <button type="button" className="solution-secondary" onClick={() => setMode('preview')}>
                                        Предпросмотр
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && canEdit && !showPreview && !showEditor && (
                        <div className="solution-empty">Добавьте решение во вкладке редактирования.</div>
                    )}
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
