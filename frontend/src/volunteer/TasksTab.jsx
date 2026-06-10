import React, { useState } from 'react';

export default function TasksTab() {
    const [taskStatus, setTaskStatus] = useState('В процесі');
    const [reportFile, setReportFile] = useState(null);

    const mockTask = {
        id: 10,
        requestId: 123,
        description: "Доставка медикаментів для дитячої лікарні №5. Потрібно забрати коробки зі складу та передати координатору.",
        deadline: "12.06.2026",
        materials: "Бинти, антисептики, дитячі ліки (3 коробки)"
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {mockTask && (
                <div className="volunteer-task-card">
                    <div className="volunteer-task-header">
                        <h3>ЗАВДАННЯ №{mockTask.id}</h3>
                        <span className="volunteer-task-link">Прив'язано до ЗАЯВКИ №{mockTask.requestId}</span>
                    </div>

                    <div className="volunteer-task-body">
                        <p><strong>Опис:</strong> {mockTask.description}</p>
                        <p><strong>Дедлайн:</strong> <span style={{ color: '#e11d48', fontWeight: '700' }}>{mockTask.deadline}</span></p>
                        <p><strong>Матеріали:</strong> {mockTask.materials}</p>

                        <div className="volunteer-status-row">
                            <strong>Статус:</strong>
                            <select
                                className="volunteer-select"
                                value={taskStatus}
                                onChange={(e) => setTaskStatus(e.target.value)}
                            >
                                <option value="В процесі">В процесі ⏳</option>
                                <option value="Виконано">Виконано (Очікує підтвердження)</option>
                            </select>
                        </div>

                        <div className="volunteer-upload-row">
                            <strong>Звітувати про виконання:</strong>
                            <label className="volunteer-upload-btn">
                                Завантажити 📎
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(e) => setReportFile(e.target.files[0])}
                                />
                            </label>
                            {reportFile && <span className="volunteer-file-badge">{reportFile.name}</span>}
                        </div>
                    </div>

                    <button
                        className="volunteer-circle-approve-btn"
                        onClick={() => alert('Звіт успішно надіслано координатору!')}
                        title="Надіслати звіт"
                    >
                        ✓
                    </button>
                </div>
            )}

            <div className="volunteer-empty-tasks">
                <p>У вас більше немає завдань</p>
                <span>❤️</span>
            </div>
        </div>
    );
}