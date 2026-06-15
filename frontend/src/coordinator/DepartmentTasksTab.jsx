import React, { useState, useEffect } from 'react';
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
    const [requests, setRequests] = useState([]);
    const [departmentVolunteers, setDepartmentVolunteers] = useState([]);
    const [tasksByRequest, setTasksByRequest] = useState({});
    const [expandedRequests, setExpandedRequests] = useState({});

    const [filterStatus, setFilterStatus] = useState('all');
    const [toasts, setToasts] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingSaveReqId, setPendingSaveReqId] = useState(null);
    const [loading, setLoading] = useState(true);

    const userId = localStorage.getItem('userId');

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    useEffect(() => {
        if (!userId) return;

        const loadCoordinatorData = async () => {
            setLoading(true);
            try {
                const volsRes = await fetch(`http://localhost:8080/api/departments/coordinator/${userId}/volunteers`);
                if (volsRes.ok) {
                    setDepartmentVolunteers(await volsRes.json());
                } else {
                    console.error("Помилка 500: бекенд не зміг обробити запит на отримання волонтерів");
                    addToast("🚨 Помилка отримання списку волонтерів", "error");
                }

                const reqsRes = await fetch(`http://localhost:8080/api/departments/coordinator/${userId}/requests`);
                if (reqsRes.ok) {
                    const reqsData = await reqsRes.json();
                    setRequests(reqsData);

                    const tasksMap = {};
                    for (const req of reqsData) {
                        const tasksRes = await fetch(`http://localhost:8080/api/tasks/request/${req.id}`);
                        if (tasksRes.ok) {
                            tasksMap[req.id] = await tasksRes.json();
                        } else {
                            tasksMap[req.id] = [];
                        }
                    }
                    setTasksByRequest(tasksMap);
                }
            } catch (err) {
                console.error("Помилка завантаження даних:", err);
                addToast("🚨 Помилка зв'язку з базою даних", "error");
            } finally {
                setLoading(false);
            }
        };

        loadCoordinatorData();
    }, [userId]);

    const toggleExpand = (id) => {
        setExpandedRequests(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddSubTask = (reqId) => {
        const newTask = {
            id: `temp-${Date.now()}`,
            request_id: reqId,
            coordinator_id: userId,
            title: '',
            description: '',
            assigned_volunteer_id: '',
            status: 'ASSIGNED',
            isNew: true
        };

        setTasksByRequest(prev => ({
            ...prev,
            [reqId]: [...(prev[reqId] || []), newTask]
        }));
        addToast("📎 Додано нове підзавдання", "info");
    };

    const handleUpdateSubTask = (reqId, taskId, field, value) => {
        setTasksByRequest(prev => ({
            ...prev,
            [reqId]: prev[reqId].map(t => t.id === taskId ? { ...t, [field]: value } : t)
        }));
    };

    const handleDeleteSubTask = async (reqId, taskId, isNew) => {
        const reqTasks = tasksByRequest[reqId] || [];

        if (!isNew) {
            try {
                const res = await fetch(`http://localhost:8080/api/tasks/${taskId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("Помилка видалення");
            } catch (err) {
                addToast("🚨 Не вдалося видалити завдання з БД", "error");
                return;
            }
        }

        if (reqTasks.length === 1) {
            const blankTask = {
                id: `temp-${Date.now()}`,
                request_id: reqId,
                coordinator_id: userId,
                title: '',
                description: '',
                assigned_volunteer_id: '',
                status: 'ASSIGNED',
                isNew: true
            };

            setTasksByRequest(prev => ({
                ...prev,
                [reqId]: [blankTask]
            }));
            addToast("🗑️ Останнє підзавдання видалено. Створено нове порожнє завдання.", "info");
        } else {
            setTasksByRequest(prev => ({
                ...prev,
                [reqId]: prev[reqId].filter(t => t.id !== taskId)
            }));
            addToast("🗑️ Підзавдання видалено", "success");
        }
    };

    const handleSaveTasksTrigger = (reqId) => {
        const tasks = tasksByRequest[reqId] || [];
        const emptyTasks = tasks.filter(t => !t.title.trim());

        if (emptyTasks.length > 0) {
            addToast("⚠️ Будь ласка, заповніть назви всіх підзавдань", "warning");
            return;
        }

        setPendingSaveReqId(reqId);
        setShowConfirm(true);
    };

    const confirmSave = async () => {
        if (!pendingSaveReqId) return;
        const rawTasks = tasksByRequest[pendingSaveReqId] || [];

        const tasksToSave = rawTasks.map(task => {
            const cleanedTask = { ...task };
            if (cleanedTask.isNew) cleanedTask.id = null;
            if (cleanedTask.assigned_volunteer_id === '') cleanedTask.assigned_volunteer_id = null;
            return cleanedTask;
        });

        try {
            const res = await fetch(`http://localhost:8080/api/tasks/request/${pendingSaveReqId}/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tasksToSave)
            });

            if (res.ok) {
                const updatedTasks = await res.json();
                setTasksByRequest(prev => ({
                    ...prev,
                    [pendingSaveReqId]: updatedTasks
                }));
                addToast("💾 Розподіл завдань успішно збережено!", "success");
            } else {
                throw new Error("Помилка сервера");
            }
        } catch (err) {
            console.error(err);
            addToast("🚨 Помилка при збереженні завдань", "error");
        } finally {
            setShowConfirm(false);
            setPendingSaveReqId(null);
        }
    };

    // Візуальний мапінг статусів завдань
    const renderTaskStatusBadge = (status) => {
        switch (status) {
            case 'ASSIGNED': return <span style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '12px', fontWeight: 'bold' }}>⏳ Призначено</span>;
            case 'IN_PROGRESS': return <span style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#bfdbfe', color: '#1e3a8a', borderRadius: '12px', fontWeight: 'bold' }}>⚙️ В процесі</span>;
            case 'COMPLETED': return <span style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '12px', fontWeight: 'bold' }}>✅ Виконано</span>;
            case 'CANCELLED': return <span style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '12px', fontWeight: 'bold' }}>❌ Скасовано</span>;
            default: return null;
        }
    };

    // Оновлений, виразний мапінг статусів самої заявки
    const renderRequestStatusBadge = (status) => {
        let config = { bg: '#f1f5f9', color: '#475569', icon: '📝', text: status };
        switch (status) {
            case 'IN_PROGRESS': config = { bg: '#fef3c7', color: '#b45309', icon: '⚙️', text: 'В ПРОЦЕСІ' }; break;
            case 'APPROVED': config = { bg: '#e0e7ff', color: '#4338ca', icon: '👍', text: 'ЗАТВЕРДЖЕНО' }; break;
            case 'REJECTED': config = { bg: '#fee2e2', color: '#b91c1c', icon: '❌', text: 'ВІДХИЛЕНО' }; break;
            case 'FULFILLED': config = { bg: '#d1fae5', color: '#047857', icon: '✅', text: 'ВИКОНАНО' }; break;
            default: break;
        }
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '99px',
                backgroundColor: config.bg, color: config.color,
                fontWeight: 'bold', fontSize: '0.85rem', border: `1px solid ${config.color}40`
            }}>
                {config.icon} {config.text}
            </span>
        );
    };

    if (loading) return <div className="coord-tasks-section"><p>Завантаження даних координатора...</p></div>;

    return (
        <div className="coord-tasks-section">
            <div className="toast-notifications-container">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
                ))}
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmSave}
                title="Збереження розподілу"
                message="Ви впевнені, що хочете зберегти оновлені завдання для цієї заявки?"
                confirmText="Так, зберегти"
            />

            <div className="filter-zone" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: '700' }}>Фільтр за статусом:</span>
                <select
                    className="coord-minimal-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                    <option value="all">Усі заявки</option>
                    {/* Видалено фільтр PENDING */}
                    <option value="IN_PROGRESS">В процесі (IN_PROGRESS)</option>
                    <option value="APPROVED">Затверджено (APPROVED)</option>
                    <option value="REJECTED">Відхилено (REJECTED)</option>
                    <option value="FULFILLED">Виконані (FULFILLED)</option>
                </select>
            </div>

            {requests.filter(req => filterStatus === 'all' || req.status === filterStatus).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📭 Заявок не знайдено</h3>
                    <p>Для вашого відділу наразі немає призначених заявок, або вони не відповідають обраному фільтру.</p>
                </div>
            ) : (
                requests
                    .filter(req => filterStatus === 'all' || req.status === filterStatus)
                    .map((request) => {
                        const isExpanded = expandedRequests[request.id];
                        const reqTasks = tasksByRequest[request.id] || [];

                        // Перевіряємо, чи заблокована вся заявка
                        const isRequestLocked = request.status === 'FULFILLED' || request.status === 'REJECTED';

                        return (
                            <div className="coord-main-request-card fade-in" key={request.id} style={{
                                marginBottom: '20px',
                                borderLeft: `4px solid ${request.status === 'REJECTED' ? '#ef4444' : request.status === 'FULFILLED' ? '#10b981' : '#3b82f6'}`
                            }}>
                                <div className="coord-req-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                                            ЗАЯВКА №{request.id.toString().slice(0, 8).toUpperCase()}
                                        </span>
                                        {renderRequestStatusBadge(request.status)}
                                    </div>
                                    <button className="coord-btn-details-outline" onClick={() => toggleExpand(request.id)}>
                                        {isExpanded ? 'Згорнути ▲' : 'Управління завданнями ▼'}
                                    </button>
                                </div>

                                <div className="coord-req-field" style={{ marginTop: '10px' }}><strong>Назва:</strong> {request.title}</div>
                                <div className="coord-req-field"><strong>Опис:</strong> {request.description}</div>

                                {isExpanded && (
                                    <>
                                        <div className="coord-subtasks-divider">
                                            <span>РОЗПОДІЛ НА ЗАВДАННЯ ({reqTasks.length})</span>
                                        </div>

                                        {isRequestLocked && (
                                            <div style={{ padding: '12px', backgroundColor: '#f8fafc', color: '#64748b', borderRadius: '8px', textAlign: 'center', margin: '15px 0', border: '1px dashed #cbd5e1', fontWeight: '500' }}>
                                                🔒 Заявка перейшла у фінальний статус ({request.status}). Додавання та редагування завдань повністю заблоковано.
                                            </div>
                                        )}

                                        <div className="coord-subtasks-list">
                                            {reqTasks.map((task, index) => {
                                                // Завдання можна редагувати, якщо ЗАЯВКА не заблокована І (завдання нове або має статус ASSIGNED)
                                                const isEditable = !isRequestLocked && (task.status === 'ASSIGNED' || task.isNew);

                                                return (
                                                    <div className="coord-subtask-row" key={task.id} style={{
                                                        opacity: isEditable ? 1 : 0.85,
                                                        backgroundColor: isEditable ? 'transparent' : '#f8fafc',
                                                        border: isEditable ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        marginBottom: '10px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span className="coord-subtask-number" style={{ margin: 0 }}>{index + 1}</span>
                                                                {renderTaskStatusBadge(task.status)}
                                                            </div>
                                                            {!isEditable && <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 Заблоковано для змін</span>}
                                                        </div>

                                                        <div className="coord-subtask-inputs">
                                                            <input
                                                                type="text"
                                                                placeholder="Назва завдання..."
                                                                value={task.title}
                                                                onChange={(e) => handleUpdateSubTask(request.id, task.id, 'title', e.target.value)}
                                                                disabled={!isEditable}
                                                                style={{
                                                                    cursor: isEditable ? 'text' : 'not-allowed',
                                                                    backgroundColor: isEditable ? '#fff' : '#e2e8f0',
                                                                    color: isEditable ? '#0f172a' : '#475569'
                                                                }}
                                                            />

                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <select
                                                                    value={task.assigned_volunteer_id || ''}
                                                                    onChange={(e) => handleUpdateSubTask(request.id, task.id, 'assigned_volunteer_id', e.target.value)}
                                                                    disabled={!isEditable}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '8px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid #ccc',
                                                                        cursor: isEditable ? 'pointer' : 'not-allowed',
                                                                        backgroundColor: isEditable ? '#fff' : '#e2e8f0',
                                                                        color: isEditable ? '#0f172a' : '#475569'
                                                                    }}
                                                                >
                                                                    <option value="" disabled>Оберіть відповідального...</option>
                                                                    {departmentVolunteers.map(vol => (
                                                                        <option key={vol.id} value={vol.id}>
                                                                            {vol.first_name} {vol.last_name} {vol.id === userId ? '(Я)' : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <textarea
                                                                placeholder="Опис підзавдання..."
                                                                value={task.description || ''}
                                                                onChange={(e) => handleUpdateSubTask(request.id, task.id, 'description', e.target.value)}
                                                                disabled={!isEditable}
                                                                style={{
                                                                    cursor: isEditable ? 'text' : 'not-allowed',
                                                                    backgroundColor: isEditable ? '#fff' : '#e2e8f0',
                                                                    color: isEditable ? '#0f172a' : '#475569'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="coord-subtask-actions" style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                                                            {isEditable && (
                                                                <button className="coord-btn-delete-inline" onClick={() => handleDeleteSubTask(request.id, task.id, task.isNew)} title="Видалити завдання">✕ Видалити</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Приховуємо кнопки додавання та збереження, якщо заявка заблокована */}
                                        {!isRequestLocked && (
                                            <>
                                                <div className="coord-add-subtask-center" style={{ marginTop: '15px' }}>
                                                    <button className="coord-circle-add-btn" onClick={() => handleAddSubTask(request.id)} title="Додати нове завдання">+</button>
                                                </div>

                                                <div className="coord-action-right" style={{ marginTop: '20px' }}>
                                                    <button className="coord-btn-save" onClick={() => handleSaveTasksTrigger(request.id)}>
                                                        ЗБЕРЕГТИ ЗМІНИ
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })
            )}
        </div>
    );
}