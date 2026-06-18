import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { API_BASE_URL } from '..App';

import { supabase } from '../supabaseClient';

/**
 * Компонент сповіщення (тосту), яке автоматично зникає через 4 секунди.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} props.message - Текст сповіщення.
 * @param {string} props.type - Тип сповіщення ('info', 'success', 'error').
 * @param {Function} props.onClose - Функція закриття сповіщення.
 * @returns {JSX.Element} Рендер тосту.
 */
const Toast = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast-item toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close-btn" onClick={onClose}>✕</button>
        </div>
    );
};

/**
 * Компонент модального вікна підтвердження дії.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {boolean} props.isOpen - Чи відкрито модальне вікно.
 * @param {Function} props.onClose - Функція закриття вікна.
 * @param {Function} props.onConfirm - Функція підтвердження дії.
 * @param {string} props.title - Заголовок модального вікна.
 * @param {string} props.message - Текст повідомлення.
 * @param {string} [props.confirmText="Так, виконати"] - Текст кнопки підтвердження.
 * @param {string} [props.cancelText="Скасувати"] - Текст кнопки скасування.
 * @param {boolean} [props.isDanger=false] - Чи є дія небезпечною (червона кнопка).
 * @returns {JSX.Element|null} Рендер модального вікна або null, якщо закрито.
 */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Так, виконати", cancelText = "Скасувати", isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-confirm-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-confirm-icon">
                    {isDanger ? '⚠️' : '✅'}
                </div>
                <h3 className="custom-confirm-title">{title || "Підтвердження"}</h3>
                <p className="custom-confirm-text">
                    {message || "Ви впевнені, що хочете виконати цю дію?"}
                </p>
                <div className="custom-confirm-actions">
                    <button className="btn-confirm-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={`btn-confirm-execute ${isDanger ? 'danger-action' : ''}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Головний компонент вкладки "Мої завдання".
 * Відображає список активних завдань волонтера, дозволяє змінювати статус,
 * завантажувати файли та надсилати звіти про виконання.
 *
 * @component
 * @returns {JSX.Element} Рендер вкладки завдань.
 */
export default function TasksTab() {
    const [tasks, setTasks] = useState([]);
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        task: null,
        action: null
    });
    const userId = localStorage.getItem('userId');

    /**
     * Додає нове сповіщення до списку.
     *
     * @param {string} message - Текст сповіщення.
     * @param {string} [type='info'] - Тип сповіщення.
     */
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    /**
     * Видаляє сповіщення зі списку за ідентифікатором.
     *
     * @param {number} id - Ідентифікатор сповіщення.
     */
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    /**
     * Закриває модальне вікно підтвердження.
     */
    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, task: null, action: null });
    };

    useEffect(() => {
        if (userId) fetchTasks();
    }, [userId]);

    /**
     * Завантажує список активних завдань волонтера з бекенду.
     * Фільтрує завдання, чиї заявки вже закриті (FULFILLED або REJECTED).
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/tasks/volunteer/${userId}`);
            const data = await res.json();

            const activeTasks = data.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS');

            const uniqueRequestIds = [...new Set(activeTasks.map(t => t.request_id))];

            const requestStatuses = {};
            await Promise.all(
                uniqueRequestIds.map(async (reqId) => {
                    if (!reqId) return;
                    try {
                        const reqRes = await fetch(`${API_BASE_URL}/api/requests/${reqId}`);
                        if (reqRes.ok) {
                            const reqData = await reqRes.json();
                            requestStatuses[reqId] = reqData.status;
                        }
                    } catch (e) {
                        console.error(`Не вдалося перевірити статус заявки ${reqId}`);
                    }
                })
            );

            const finalFilteredTasks = activeTasks.filter(t => {
                const reqStatus = t.request_status || t.requestStatus || requestStatuses[t.request_id];
                const isRequestClosed = reqStatus === 'FULFILLED' || reqStatus === 'REJECTED';
                return !isRequestClosed;
            });

            setTasks(finalFilteredTasks);
            setLoading(false);
        } catch (err) {
            console.error("Помилка завантаження:", err);
            addToast("🚨 Помилка завантаження завдань", "error");
            setLoading(false);
        }
    };

    /**
     * Обробляє вибір файлу для завдання.
     *
     * @param {string|number} taskId - Ідентифікатор завдання.
     * @param {File} file - Вибраний файл.
     */
    const handleFileChange = (taskId, file) => {
        setFiles(prev => ({ ...prev, [taskId]: file }));
        addToast(`📎 Файл "${file.name}" додано до завдання`, "info");
    };

    /**
     * Завантажує файл до Supabase Storage.
     *
     * @async
     * @param {File} file - Файл для завантаження.
     * @param {string|number} taskId - Ідентифікатор завдання.
     * @returns {Promise<string>} Публічне URL-посилання на завантажений файл.
     * @throws {Error} Помилка при завантаженні.
     */
    const uploadToSupabase = async (file, taskId) => {
        const fileExt = file.name.split('.').pop();
        const safeFileName = `report_${Date.now()}.${fileExt}`;
        const filePath = `${taskId}/${safeFileName}`;

        const { data, error } = await supabase.storage
            .from('task-reports')
            .upload(filePath, file, {
                upsert: true
            });

        if (error) {
            console.error("Помилка Supabase:", error);
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('task-reports')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    /**
     * Надсилає звіт про виконання завдання.
     * Завантажує прикріплений файл (якщо є) та відправляє дані на бекенд.
     *
     * @async
     * @param {Object} task - Об'єкт завдання.
     * @returns {Promise<void>}
     */
    const handleTaskCompletion = async (task) => {
        const file = files[task.id];
        let fileUrls = [];

        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: true } : t));

        try {
            if (file) {
                const url = await uploadToSupabase(file, task.id);
                fileUrls.push(url);
            }

            const response = await fetch(`${API_BASE_URL}/api/tasks/submit-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: task.id,
                    author_id: userId,
                    content: "Звіт про виконання",
                    attached_files_urls: fileUrls
                })
            });

            if (response.ok) {
                addToast("✅ Звіт про виконання успішно відправлено!", "success");
                setTasks(prev => prev.filter(t => t.id !== task.id));
                setFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles[task.id];
                    return newFiles;
                });
            } else {
                addToast("🚨 Помилка при відправленні звіту", "error");
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
            }
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Помилка при відправленні звіту", "error");
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
        }
    };

    /**
     * Відкриває модальне вікно для підтвердження зміни статусу завдання.
     *
     * @param {Object} task - Об'єкт завдання.
     * @param {string} newStatus - Новий статус ('IN_PROGRESS', 'CANCELLED').
     */
    const openUpdateStatusModal = (task, newStatus) => {
        let title = "";
        let message = "";
        let confirmText = "";

        if (newStatus === 'IN_PROGRESS') {
            title = "Початок виконання";
            message = "Ви впевнені, що хочете розпочати виконання цього завдання?";
            confirmText = "Так, почати";
        } else if (newStatus === 'CANCELLED') {
            title = "Скасування завдання";
            message = "Ви впевнені, що хочете скасувати це завдання? Його буде переміщено до архіву.";
            confirmText = "Так, скасувати";
        } else {
            title = "Зміна статусу";
            message = `Ви впевнені, що хочете змінити статус завдання на "${newStatus}"?`;
            confirmText = "Так, змінити";
        }

        setConfirmModal({
            isOpen: true,
            task: task,
            action: newStatus,
            title: title,
            message: message,
            confirmText: confirmText,
            isDanger: newStatus === 'CANCELLED'
        });
    };

    /**
     * Виконує зміну статусу завдання після підтвердження.
     *
     * @async
     * @returns {Promise<void>}
     */
    const executeUpdateStatus = async () => {
        const { task, action } = confirmModal;

        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: action, updating: true } : t));

        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/update-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, status: action })
            });

            if (response.ok) {
                if (action === 'COMPLETED' || action === 'CANCELLED') {
                    addToast(action === 'CANCELLED' ? "📦 Завдання переміщено до архіву" : "✅ Завдання виконано!", "success");
                    setTasks(prev => prev.filter(t => t.id !== task.id));
                } else if (action === 'IN_PROGRESS') {
                    addToast("⚙️ Статус змінено на 'В процесі'", "success");
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
                } else {
                    addToast(`✅ Статус змінено на "${action}"`, "success");
                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updating: false } : t));
                }
            } else {
                addToast("🚨 Помилка при оновленні статусу", "error");
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, updating: false } : t));
            }
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Помилка мережі при оновленні статусу", "error");
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, updating: false } : t));
        } finally {
            closeConfirmModal();
        }
    };

    /**
     * Обробляє зміну статусу завдання.
     *
     * @param {Object} task - Об'єкт завдання.
     * @param {string} newStatus - Новий статус.
     */
    const handleStatusChange = (task, newStatus) => {
        openUpdateStatusModal(task, newStatus);
    };

    if (loading) return <div className="volunteer-loader">Завантаження...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div className="toast-notifications-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={executeUpdateStatus}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText="Скасувати"
                isDanger={confirmModal.isDanger}
            />

            {tasks.length > 0 ? (
                tasks.map(task => (
                    <div className={`volunteer-task-card ${task.updating ? 'loading-opacity' : ''}`} key={task.id}>
                        {task.updating && <div className="loading-overlay">Оновлення...</div>}

                        <div className="volunteer-task-header">
                            <h3>ЗАВДАННЯ №{task.id.toString().slice(-4)}</h3>
                            <span className="volunteer-task-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ЗАЯВКА: {task.requestTitle || `№${task.request_id?.toString().slice(-4)}`}
                                <span style={{ padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>Активна</span>
                            </span>
                        </div>

                        <div className="volunteer-task-body">
                            <p><strong>Опис:</strong> {task.description}</p>

                            <div className="volunteer-status-row">
                                <strong>Статус:</strong>
                                <select
                                    className="volunteer-select"
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task, e.target.value)}
                                >
                                    <option value="ASSIGNED">Призначено ⏳</option>
                                    <option value="IN_PROGRESS">В процесі ⚙️</option>
                                    <option value="CANCELLED">Скасувати завдання ❌</option>
                                </select>
                            </div>

                            <div className="volunteer-upload-row">
                                <strong>Звітувати про виконання:</strong>
                                <label className="volunteer-upload-btn">
                                    {files[task.id] ? 'Файл обрано' : 'Завантажити 📎'}
                                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileChange(task.id, e.target.files[0])} />
                                </label>
                                {files[task.id] && <span className="volunteer-file-badge">{files[task.id].name}</span>}
                            </div>
                        </div>

                        <button className="volunteer-circle-approve-btn" onClick={() => handleTaskCompletion(task)} title="Позначити як виконане">
                            ✓
                        </button>
                    </div>
                ))
            ) : (
                <div className="volunteer-empty-tasks">
                    <p>Наразі нових завдань немає</p>
                    <span>❤️</span>
                </div>
            )}
        </div>
    );
}