import React, { useEffect, useState, useRef } from 'react';
import './Volunteer.css';

// Компонент тосту
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

export default function ArchiveTab() {
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taskReports, setTaskReports] = useState({});
    const [toasts, setToasts] = useState([]);

    const userId = localStorage.getItem('userId');

    // Додаємо ref для запобігання дублюванню тостів
    const hasLoadedRef = useRef(false);
    const toastShownRef = useRef(false);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    useEffect(() => {
        // Запобігаємо подвійному виконанню в StrictMode
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        if (!userId) {
            setError('Користувач не авторизований.');
            setLoading(false);
            addToast("⚠️ Користувач не авторизований.", "warning");
            return;
        }

        setLoading(true);

        fetch(`http://localhost:8080/api/archive/volunteer/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error('Помилка сервера');
                return res.json();
            })
            .then(data => {
                setArchivedTasks(data);
                setLoading(false);
                // Показуємо тост тільки один раз
                if (data.length > 0 && !toastShownRef.current) {
                    toastShownRef.current = true;
                    addToast(`📦 Завантажено ${data.length} архівних завдань`, "success");
                }
            })
            .catch(err => {
                console.error(err);
                setError('Не вдалося завантажити архів завдань.');
                setLoading(false);
                if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    addToast("🚨 Не вдалося завантажити архів завдань.", "error");
                }
            });
    }, [userId]);

    const fetchReports = async (taskId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/archive/task/${taskId}/reports`);
            if (!res.ok) throw new Error('Помилка завантаження звітів');
            const data = await res.json();
            setTaskReports(prev => ({ ...prev, [taskId]: data }));
        } catch (err) {
            console.error("Помилка отримання звітів:", err);
        }
    };

    const toggleExpand = (taskId) => {
        if (expandedTaskId !== taskId) {
            fetchReports(taskId);
        }
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    if (loading) return (
        <div className="volunteer-archive-loading">
            Завантаження завдань...
        </div>
    );

    if (error) return (
        <div className="volunteer-archive-error">
            {error}
        </div>
    );

    return (
        <div className="volunteer-archive-page">
            {/* Контейнер для тостів */}
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
                    {archivedTasks.map(task => (
                        <div className="volunteer-archive-card" key={task.id} style={{ opacity: task.status === 'CANCELLED' ? 0.8 : 1 }}>

                            <div className="volunteer-archive-header">

                                <div className="volunteer-archive-info">
                                    <div className="volunteer-archive-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {task.title}
                                        {task.status === 'CANCELLED' ? (
                                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #fca5a5' }}>
                                                Скасовано ❌
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#dcfce7', color: '#22c55e', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #86efac' }}>
                                                Виконано ✅
                                            </span>
                                        )}
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
                                        <strong>Дата завершення:</strong>{' '}
                                        {task.completed_at
                                            ? new Date(task.completed_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : '—'}
                                    </p>

                                    <p><strong>Завантажені файли:</strong></p>

                                    {task.status === 'CANCELLED' ? (
                                        <p className="volunteer-no-files" style={{ color: '#ef4444' }}>Завдання було скасовано. Файли відсутні.</p>
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
                    ))}
                </div>
            )}
        </div>
    );
}