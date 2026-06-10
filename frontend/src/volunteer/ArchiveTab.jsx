import React from 'react';

export default function ArchiveTab() {
    const archivedTasks = [{ id: 8, title: "Завдання №8", desc: "Роздача гуманітарної допомоги" }, { id: 5, title: "Завдання №5", desc: "Транспортування речей" }];
    return (
        <div>
            <div className="volunteer-tab-header">
                <h2 className="volunteer-tab-title">Виконані завдання</h2>
                <div className="volunteer-badge-counter">Всього виконано: {archivedTasks.length}</div>
            </div>
            <div className="volunteer-list-container">
                {archivedTasks.map(task => (
                    <div className="volunteer-archive-card" key={task.id}>
                        <div className="volunteer-archive-info">
                            <div className="volunteer-archive-title">{task.title}</div>
                            <div className="volunteer-archive-desc">{task.desc}</div>
                        </div>
                        <button className="volunteer-detail-btn" onClick={() => alert('Деталі')}>Детальніше ▾</button>
                    </div>
                ))}
            </div>
        </div>
    );
}