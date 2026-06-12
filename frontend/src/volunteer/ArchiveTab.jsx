import React, { useEffect, useState } from 'react';

export default function ArchiveTab() {
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const toggleExpand = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    if (loading) return <div className="volunteer-loader">Завантаження завдань...</div>;
    if (error) return <div className="volunteer-error">{error}</div>;

    return (
        <div>
            <div className="volunteer-tab-header">
                <h2 className="volunteer-tab-title">Виконані завдання</h2>
                <div className="volunteer-badge-counter">Всього: {archivedTasks.length}</div>
            </div>

            {archivedTasks.length === 0 ? (
                <div className="volunteer-empty-state">
                    <p>Ви ще не виконали жодного завдання. Ваші успіхи з'являться тут пізніше! 🌟</p>
                </div>
            ) : (
                <div className="volunteer-list-container">
                    {archivedTasks.map(task => (
                        <div className={`volunteer-archive-card ${expandedTaskId === task.id ? 'expanded' : ''}`} key={task.id}>
                            <div className="volunteer-archive-info">
                                <div className="volunteer-archive-title">{task.title}</div>
                                <div className="volunteer-archive-desc">
                                    {task.description ? task.description.substring(0, 60) + '...' : 'Опис відсутній'}
                                </div>
                            </div>

                            <button className="volunteer-detail-btn" onClick={() => toggleExpand(task.id)}>
                                {expandedTaskId === task.id ? 'Згорнути ▲' : 'Детальніше ▾'}
                            </button>

                            {expandedTaskId === task.id && (
                                <div className="volunteer-expanded-details fade-in">
                                    <hr style={{ opacity: 0.2, margin: '15px 0' }} />
                                    <p><strong>Повний опис:</strong> {task.description}</p>
                                    <p><strong>Дата завершення:</strong> {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : '—'}</p>
                                    <p><strong>ID Заявки:</strong> {task.request_id}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}