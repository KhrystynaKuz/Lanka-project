import React, { useState } from 'react';
import './Coordinator.css';

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

// Компонент модального вікна підтвердження
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Так, зберегти", cancelText = "Скасувати", isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-confirm-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-confirm-icon">
                    {isDanger ? '⚠️' : '💾'}
                </div>
                <h3 className="custom-confirm-title">{title || "Підтвердження"}</h3>
                <p className="custom-confirm-text">
                    {message || "Ви впевнені, що хочете зберегти розподіл завдань?"}
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

export default function DepartmentTasksTab() {
    const [isNewRequestsOpen, setIsNewRequestsOpen] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [toasts, setToasts] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [subTasks, setSubTasks] = useState([
        { id: 1, title: '', desc: '', assignee: '', deadline: '' }
    ]);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const handleAddSubTask = () => {
        const newId = subTasks.length > 0 ? Math.max(...subTasks.map(t => t.id)) + 1 : 1;
        setSubTasks([...subTasks, { id: newId, title: '', desc: '', assignee: '', deadline: '' }]);
        addToast("📎 Додано нове підзавдання", "info");
    };

    const handleUpdateSubTask = (id, field, value) => {
        setSubTasks(subTasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleDeleteSubTask = (id) => {
        setSubTasks(subTasks.filter(t => t.id !== id));
        addToast("🗑️ Підзавдання видалено", "success");
    };

    const handleSaveTasks = () => {
        const emptyTasks = subTasks.filter(t => !t.title.trim());
        if (emptyTasks.length > 0) {
            addToast("⚠️ Будь ласка, заповніть назви всіх підзавдань", "warning");
            return;
        }
        setShowConfirm(true);
    };

    const confirmSave = () => {
        addToast("💾 Розподіл завдань успішно збережено!", "success");
        setShowConfirm(false);
    };

    const handleArchiveDetails = () => {
        addToast("📋 Відкриття деталей архівної заявки", "info");
    };

    const handleArchiveEdit = () => {
        addToast("✏️ Редагування архівної заявки", "info");
    };

    const handleEditSubTask = (id) => {
        addToast(`✏️ Редагування підзавдання #${id}`, "info");
    };

    return (
        <div className="coord-tasks-section">
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

            {/* Модальне вікно підтвердження */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmSave}
                title="Збереження розподілу"
                message="Ви впевнені, що хочете зберегти розподіл завдань для цієї заявки?"
                confirmText="Так, зберегти"
                cancelText="Скасувати"
                isDanger={false}
            />

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
                                    <button className="coord-btn-edit-inline" onClick={() => handleEditSubTask(task.id)} title="Редагувати">✏️</button>
                                    <button className="coord-btn-delete-inline" onClick={() => handleDeleteSubTask(task.id)} title="Видалити">✕</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="coord-add-subtask-center">
                        <button className="coord-circle-add-btn" onClick={handleAddSubTask}>+</button>
                    </div>

                    <div className="coord-action-right">
                        <button className="coord-btn-save" onClick={handleSaveTasks}>ЗБЕРЕГТИ</button>
                    </div>
                </div>
            )}

            {/* Рівний фільтр зліва */}
            <div style={{
                marginTop: '24px',
                marginBottom: '16px'
            }}>
                <select
                    className="coord-minimal-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '14px',
                        color: '#374151',
                        cursor: 'pointer',
                        outline: 'none',
                        width: '130px'
                    }}
                >
                    <option value="all">Усі</option>
                    <option value="process">В процесі</option>
                    <option value="done">Виконані</option>
                </select>
            </div>

            <div className="coord-main-request-card archive-request">
                <div className="coord-req-header">ЗАЯВКА №44</div>
                <div className="coord-req-field"><strong>Назва:</strong> Transporting warm clothes for IDPs</div>
                <div className="coord-archive-actions">
                    <button className="coord-btn-details-outline" onClick={handleArchiveDetails}>ДЕТАЛЬНІШЕ</button>
                    <div className="coord-conditional-edit">
                        <small>тільки, якщо <u>не</u> виконана</small>
                        <button className="coord-btn-edit-action" onClick={handleArchiveEdit}>РЕДАГУВАТИ</button>
                    </div>
                </div>
            </div>
        </div>
    );
}