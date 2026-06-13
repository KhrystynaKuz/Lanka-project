import React, { useEffect, useState } from 'react';
import './Volunteer.css'; // Імпортуємо винесені стилі

export default function ArchiveTab() {
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taskReports, setTaskReports] = useState({});

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!userId) {
            setError('Користувач не авторизований.');
            setLoading(false);
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
            })
            .catch(err => {
                console.error(err);
                setError('Не вдалося завантажити архів завдань.');
                setLoading(false);
            });
    }, [userId]);

    const fetchReports = async (taskId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/archive/task/${taskId}/reports`);
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
            <div className="tab-header-block">
                <h2 className="tab-title">Виконані завдання</h2>
                <div className="badge-counter">
                    Усього: <span className="counter-number">{archivedTasks.length}</span>
                </div>
            </div>

            {archivedTasks.length === 0 ? (
                <div className="volunteer-empty-state">
                    <p>Ви ще не виконали жодного завдання. Ваші успіхи з'являться тут пізніше!</p>
                </div>
            ) : (
                <div className="volunteer-list-container">
                    {archivedTasks.map(task => (
                        <div className="volunteer-archive-card" key={task.id}>

                            <div className="volunteer-archive-header">

                                <div className="volunteer-archive-info">
                                    <div className="volunteer-archive-title">
                                        {task.title}
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
                                            ? new Date(task.completed_at).toLocaleDateString()
                                            : '—'}
                                    </p>

                                    <p><strong>Завантажені файли:</strong></p>

                                    {taskReports[task.id] && taskReports[task.id].length > 0 ? (
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
                                                            📄 Файл {i + 1}
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