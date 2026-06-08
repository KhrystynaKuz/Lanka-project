import React, { useState } from 'react';
import './Coordinator.css';

export default function DepartmentTasksTab() {
    const [isNewRequestsOpen, setIsNewRequestsOpen] = useState(true);
    const [subTasks, setSubTasks] = useState([
        { id: 1, title: '', desc: '', assignee: '', deadline: '' }
    ]);

    const handleAddSubTask = () => {
        const newId = subTasks.length > 0 ? Math.max(...subTasks.map(t => t.id)) + 1 : 1;
        setSubTasks([...subTasks, { id: newId, title: '', desc: '', assignee: '', deadline: '' }]);
    };

    const handleUpdateSubTask = (id, field, value) => {
        setSubTasks(subTasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleDeleteSubTask = (id) => {
        setSubTasks(subTasks.filter(t => t.id !== id));
    };

    return (
        <div className="coord-tasks-section">
            <div className="coord-toggle-header" onClick={() => setIsNewRequestsOpen(!isNewRequestsOpen)}>
                <span className="coord-toggle-title">Нові заявки <span className="coord-badge-count">1</span></span>
                <span className="coord-toggle-icon">{isNewRequestsOpen ? '▲' : '▼'}</span>
            </div>

            {isNewRequestsOpen && (
                <div className="coord-main-request-card fade-in">
                    <div className="coord-req-header">ЗАЯВКА №123</div>
                    <div className="coord-req-field"><strong>Назва:</strong> Медикаменти для дитячої лікарні №5</div>
                    <div className="coord-req-field"><strong>Опис:</strong> Термінова потреба в перев'язувальних матеріалах та інсуліні.</div>
                    <div className="coord-req-field"><strong>Складські ресурси:</strong> Бинти, антисептики, інсулін</div>

                    <div className="coord-subtasks-divider">
                        <span>РОЗПОДІЛ НА ЗАВДАННЯ</span>
                    </div>

                    <div className="coord-subtasks-list">
                        {subTasks.map((task, index) => (
                            <div className="coord-subtask-row" key={task.id}>
                                <div className="coord-subtask-number">{index + 1}</div>
                                <div className="coord-subtask-inputs">
                                    <input
                                        type="text"
                                        placeholder="Назва завдання..."
                                        value={task.title}
                                        onChange={(e) => handleUpdateSubTask(task.id, 'title', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Відповідальні (волонтер)..."
                                        value={task.assignee}
                                        onChange={(e) => handleUpdateSubTask(task.id, 'assignee', e.target.value)}
                                    />
                                    <textarea
                                        placeholder="Опис підзавдання..."
                                        value={task.desc}
                                        onChange={(e) => handleUpdateSubTask(task.id, 'desc', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Дедлайн (напр. 12.06)..."
                                        value={task.deadline}
                                        onChange={(e) => handleUpdateSubTask(task.id, 'deadline', e.target.value)}
                                    />
                                </div>
                                <div className="coord-subtask-actions">
                                    <button className="coord-btn-edit-inline" title="Редагувати">✏️</button>
                                    <button className="coord-btn-delete-inline" onClick={() => handleDeleteSubTask(task.id)} title="Видалити">✕</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="coord-add-subtask-center">
                        <button className="coord-circle-add-btn" onClick={handleAddSubTask}>+</button>
                    </div>

                    <div className="coord-action-right">
                        <button className="coord-btn-save" onClick={() => alert('Розподіл завдань успішно збережено!')}>ЗБЕРЕГТИ</button>
                    </div>
                </div>
            )}

            <div className="coord-filter-row">
                <select className="coord-minimal-select">
                    <option value="all">усі ▾</option>
                    <option value="process">в процесі</option>
                    <option value="done">виконані</option>
                </select>
            </div>

            <div className="coord-main-request-card archive-request">
                <div className="coord-req-header">ЗАЯВКА №44</div>
                <div className="coord-req-field"><strong>Назва:</strong> Transporting warm clothes for IDPs</div>
                <div className="coord-archive-actions">
                    <button className="coord-btn-details-outline" onClick={() => alert('Відкриття деталей заявки...')}>ДЕТАЛЬНІШЕ</button>
                    <div className="coord-conditional-edit">
                        <small>тільки, якщо <u>не</u> виконана</small>
                        <button className="coord-btn-edit-action" onClick={() => alert('Форма редагування архівованої заявки')}>РЕДАГУВАТИ</button>
                    </div>
                </div>
            </div>
        </div>
    );
}