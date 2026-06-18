import React, { useEffect, useState, useRef } from 'react';
import './Volunteer.css';
import { API_BASE_URL } from '../App';
/**
 * Компонент сповіщення (тосту), яке автоматично зникає через 4 секунди.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} props.message - Текст сповіщення.
 * @param {string} props.type - Тип сповіщення ('info', 'success', 'error', 'warning').
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
 * Головний компонент вкладки "Архів".
 * Відображає список архівних завдань волонтера (виконані, скасовані,
 * або ті, чиї заявки були закриті). Дозволяє переглядати деталі та файли звітів.
 *
 * @component
 * @returns {JSX.Element} Рендер вкладки архіву.
 */
export default function ArchiveTab() {
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taskReports, setTaskReports] = useState({});
    const [toasts, setToasts] = useState([]);

    const userId = localStorage.getItem('userId');

    const hasLoadedRef = useRef(false);
    const toastShownRef = useRef(false);

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

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        if (!userId) {
            setError('Користувач не авторизований.');
            setLoading(false);
            addToast("⚠️ Користувач не авторизований.", "warning");
            return;
        }

        /**
         * Завантажує всі архівні дані волонтера.
         * Об'єднує офіційний архів з бекенду та завдання,
         * чиї заявки були закриті (авто-архівація).
         *
         * @async
         * @returns {Promise<void>}
         */
        const fetchAllArchiveData = async () => {
            setLoading(true);
            try {
                const archiveRes = await fetch(`${API_BASE_URL}/api/archive/volunteer/${userId}`);
                const officialArchive = archiveRes.ok ? await archiveRes.json() : [];

                const activeRes = await fetch(`${API_BASE_URL}/api/tasks/volunteer/${userId}`);
                const activeTasksRaw = activeRes.ok ? await activeRes.json() : [];

                const officialArchiveIds = new Set(officialArchive.map(t => t.id));
                const activeTasks = activeTasksRaw.filter(t => !officialArchiveIds.has(t.id));

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
                            console.error(`Помилка отримання статусу заявки ${reqId}`);
                        }
                    })
                );

                const autoArchivedTasks = activeTasks
                    .filter(t => {
                        const reqStatus = t.request_status || t.requestStatus || requestStatuses[t.request_id];
                        return reqStatus === 'FULFILLED' || reqStatus === 'REJECTED';
                    })
                    .map(t => ({
                        ...t,
                        request_status: t.request_status || t.requestStatus || requestStatuses[t.request_id]
                    }));

                const combinedArchive = [...officialArchive, ...autoArchivedTasks];
                const uniqueArchiveMap = new Map();

                combinedArchive.forEach(task => {
                    uniqueArchiveMap.set(task.id, task);
                });

                const finalArchive = Array.from(uniqueArchiveMap.values());

                setArchivedTasks(finalArchive);
                setLoading(false);

                if (finalArchive.length > 0 && !toastShownRef.current) {
                    toastShownRef.current = true;
                    addToast(`📦 Завантажено ${finalArchive.length} архівних завдань`, "success");
                }
            } catch (err) {
                console.error(err);
                setError('Не вдалося завантажити архів завдань.');
                setLoading(false);
                if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    addToast("🚨 Не вдалося завантажити архів завдань.", "error");
                }
            }
        };

        fetchAllArchiveData();
    }, [userId]);

    /**
     * Завантажує звіти для конкретного завдання.
     *
     * @async
     * @param {string|number} taskId - Ідентифікатор завдання.
     * @returns {Promise<void>}
     */
    const fetchReports = async (taskId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/archive/task/${taskId}/reports`);
            if (!res.ok) throw new Error('Помилка завантаження звітів');
            const data = await res.json();
            setTaskReports(prev => ({ ...prev, [taskId]: data }));
        } catch (err) {
            console.error("Помилка отримання звітів:", err);
        }
    };

    /**
     * Розгортає або згортає деталі завдання.
     * При розгортанні завантажує звіти.
     *
     * @param {string|number} taskId - Ідентифікатор завдання.
     */
    const toggleExpand = (taskId) => {
        if (expandedTaskId !== taskId) {
            fetchReports(taskId);
        }
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    /**
     * Рендерить бейдж статусу архівного завдання.
     *
     * @param {Object} task - Об'єкт завдання.
     * @returns {JSX.Element} Бейдж з відповідним статусом.
     */
    const renderArchiveBadge = (task) => {
        if (task.status === 'CANCELLED') {
            return <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #fca5a5' }}>Скасовано ❌</span>;
        }
        if (task.status === 'COMPLETED') {
            return <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#dcfce7', color: '#22c55e', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #86efac' }}>Виконано ✅</span>;
        }

        const reqStatus = task.request_status || task.requestStatus;
        if (reqStatus === 'REJECTED') {
            return <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>Заявку відхилено 🚫</span>;
        }

        return <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #a5b4fc' }}>Заявку закрито 🔒</span>;
    };

    if (loading) return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '30px',
            width: '100%',
            color: '#1e3a8a',
            fontWeight: 'bold',
            fontSize: '16px'
        }}>
            Завантаження...
        </div>
    );

    if (error) return (
        <div className="volunteer-archive-error">
            {error}
        </div>
    );

    return (
        <div className="volunteer-archive-page">
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

            <div className="tab-header-block">
                <h2 className="tab-title">Архів завдань</h2>
                <div className="badge-counter">
                    Усього: <span className="counter-number">{archivedTasks.length}</span>
                </div>
            </div>

            {archivedTasks.length === 0 ? (
                <div className="volunteer-empty-state">
                    <p>Ви ще не виконали та не скасували жодного завдання. Ваш архів поки що порожній!</p>
                </div>
            ) : (
                <div className="volunteer-list-container">
                    {archivedTasks.map(task => {
                        const reqStatus = task.request_status || task.requestStatus;
                        const isDimmed = task.status === 'CANCELLED' || reqStatus === 'REJECTED';

                        return (
                            <div className="volunteer-archive-card" key={task.id} style={{ opacity: isDimmed ? 0.8 : 1 }}>
                                <div className="volunteer-archive-header">
                                    <div className="volunteer-archive-info">
                                        <div className="volunteer-archive-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {task.title}
                                            {renderArchiveBadge(task)}
                                        </div>

                                        <div className="volunteer-archive-desc">
                                            <strong>Опис:</strong>{' '}
                                            {task.description
                                                ? task.description.substring(0, 60) + '...'
                                                : 'Опис відсутній'}
                                        </div>
                                    </div>

                                    <button
                                        className="volunteer-detail-btn"
                                        onClick={() => toggleExpand(task.id)}
                                    >
                                        {expandedTaskId === task.id ? 'Згорнути ▲' : 'Розгорнути ▾'}
                                    </button>
                                </div>

                                {expandedTaskId === task.id && (
                                    <div className="volunteer-expanded-details">
                                        <p>
                                            <strong>Дата завершення/закриття:</strong>{' '}
                                            {task.completed_at
                                                ? new Date(task.completed_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : <span style={{ color: '#64748b', fontStyle: 'italic' }}>Закрито разом із заявкою</span>}
                                        </p>

                                        <p><strong>Завантажені файли:</strong></p>

                                        {isDimmed ? (
                                            <p className="volunteer-no-files" style={{ color: '#ef4444' }}>Завдання було скасовано або заявку відхилено. Файли відсутні.</p>
                                        ) : taskReports[task.id] && taskReports[task.id].length > 0 ? (
                                            <ul className="volunteer-file-list">
                                                {taskReports[task.id].map(report =>
                                                    report.attached_files_urls.map((url, i) => (
                                                        <li key={i}>
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="volunteer-file-link"
                                                            >
                                                                📄 Файл звіту {i + 1}
                                                            </a>
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="volunteer-no-files">Файлів немає</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}