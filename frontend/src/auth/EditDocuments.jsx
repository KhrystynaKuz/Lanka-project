import React, { useState, useEffect } from 'react';
import './EditDocuments.css';
import { API_BASE_URL } from '.App';


/**
 * Компонент сторінки редагування документів після відхилення.
 * Дозволяє користувачеві завантажити нові документи для повторної перевірки
 * після отримання причини відхилення від менеджера.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {string|number} props.userId - Ідентифікатор поточного користувача.
 * @param {Function} props.onBackToDashboard - Функція повернення на головну сторінку.
 * @param {string} props.token - Токен доступу для авторизації запитів.
 * @returns {JSX.Element} Рендер сторінки редагування документів.
 */
const EditDocuments = ({ userId, onBackToDashboard, token }) => {
    const [rejectionData, setRejectionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) return;

        /**
         * Завантажує інформацію про відхилення документів для користувача.
         *
         * @async
         * @returns {Promise<void>}
         */
        fetch(`${API_BASE_URL}/api/documents/rejection-info/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error('Сервер повернув помилку: ' + res.status);
                return res.json();
            })
            .then(data => {
                setRejectionData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Помилка при завантаженні даних:", err);
                setError('Не вдалося завантажити інформацію про відхилення.');
                setLoading(false);
            });
    }, [userId]);

    /**
     * Обробляє вибір файлів для завантаження.
     * Перевіряє розмір кожного файлу та сумарний об'єм.
     *
     * @param {Event} e - Подія вибору файлу.
     */
    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const MAX_FILE = 10 * 1024 * 1024;
            const MAX_TOTAL = 20 * 1024 * 1024;

            const validFiles = newFiles.filter(f => f.size <= MAX_FILE);

            if (validFiles.length !== newFiles.length) {
                setError("Один або кілька файлів перевищують ліміт 10 МБ.");
                return;
            }

            const currentTotalSize = documents.reduce((acc, f) => acc + f.size, 0);
            const newFilesSize = validFiles.reduce((acc, f) => acc + f.size, 0);

            if (currentTotalSize + newFilesSize > MAX_TOTAL) {
                setError("Сумарний розмір файлів перевищує ліміт (20 МБ)");
                return;
            }

            setError('');
            setDocuments(prev => [...prev, ...validFiles]);
        }
    };

    /**
     * Видаляє файл зі списку за індексом.
     *
     * @param {number} index - Індекс файлу в списку.
     */
    const removeFile = (index) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    /**
     * Завантажує окремий документ на бекенд.
     *
     * @async
     * @param {File} file - Файл для завантаження.
     * @returns {Promise<Object>} Результат завантаження.
     * @throws {Error} Помилка при завантаженні.
     */
    const uploadDocument = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('title', `Повторне завантаження - ${file.name}`);

        const response = await fetch(`${API_BASE_URL}/api/profile/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Помилка завантаження файлу ${file.name}: ${errorText}`);
        }
        return await response.json();
    };

    /**
     * Обробляє відправку форми з новими документами.
     * Завантажує всі файли та оновлює статус заявки.
     *
     * @async
     * @param {Event} e - Подія відправки форми.
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (documents.length === 0) {
            setError("Будь ласка, завантажте хоча б один новий документ.");
            return;
        }

        setError('');
        setSubmitLoading(true);

        try {
            for (const file of documents) {
                await uploadDocument(file);
            }

            const response = await fetch(`${API_BASE_URL}/api/documents/upload-retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                setSubmitLoading(false);
                onBackToDashboard();
            } else {
                throw new Error('Не вдалося змінити статус заявки після завантаження.');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Сталася помилка при повторній відправці документів.');
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="login-container">
                <div className="loading-spinner-box">
                    <div className="spinner"></div>
                    <p>Завантаження даних...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card register-card edit-docs-card">
                <div className="login-header register-header-compact">
                    <h1 className="login-title">ЛАНКА</h1>
                    <p className="login-subtitle">Оновлення документів акаунту</p>
                </div>

                <div className="rejection-alert-box">
                    <div className="rejection-alert-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rejection-icon-attention">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h2>Ваші документи відхилено</h2>
                    </div>
                    <div className="rejection-alert-body">
                        <p><strong>Причина відхилення, вказана менеджером:</strong></p>
                        <div className="rejection-reason-text">
                            {rejectionData?.rejection_reason || "Причину не вказано адміністратором."}
                        </div>
                    </div>
                </div>

                {error && <div className="login-error-message edit-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form register-form-compact">
                    <div className="form-grid-row single-input-row">
                        <div className="input-group edit-docs-fullwidth-group">
                            <label className="form-label-styled">
                                Виберіть нові копії файлів <span className="required-star">*</span>
                            </label>

                            <div className="file-upload-interactive-zone-full">
                                <input
                                    type="file"
                                    id="edit-docs-upload"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={handleFileChange}
                                    disabled={submitLoading}
                                    className="file-hidden-input-field"
                                />
                                <label htmlFor="edit-docs-upload" className="file-dropzone-view-card-full">
                                    <div className="dropzone-animated-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <span className="dropzone-title-text">
                                        {documents.length > 0 ? `Обрано документів: ${documents.length}` : 'Перетягніть файли сюди або натисніть'}
                                    </span>
                                    <span className="dropzone-description-text">Дозволені формати файлів: JPG, PNG, PDF (макс. 10МБ кожен)</span>
                                </label>
                            </div>

                            {documents.length > 0 && (
                                <div className="selected-files-container-list">
                                    {documents.map((file, index) => (
                                        <div key={index} className="selected-file-row-item">
                                            <div className="file-row-details">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mini-file-icon">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                                <span className="file-row-name-label">{file.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="delete-file-row-btn"
                                                disabled={submitLoading}
                                                title="Видалити файл"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="edit-buttons-actions">
                        <button
                            type="submit"
                            className="login-btn register-submit-btn action-submit"
                            disabled={submitLoading || documents.length === 0}
                        >
                            {submitLoading ? 'Надсилання...' : 'Надіслати на повторну перевірку'}
                        </button>

                        <button
                            type="button"
                            className="login-btn action-cancel"
                            onClick={onBackToDashboard}
                            disabled={submitLoading}
                        >
                            Повернутися на головну
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDocuments;