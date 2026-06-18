import React, { useState, useEffect } from 'react';
import './Coordinator.css';
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
 * Компонент модального вікна підтвердження дії.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {boolean} props.isOpen - Чи відкрито модальне вікно.
 * @param {Function} props.onClose - Функція закриття вікна.
 * @param {Function} props.onConfirm - Функція підтвердження дії.
 * @param {string} props.title - Заголовок модального вікна.
 * @param {string} props.message - Текст повідомлення.
 * @param {string} [props.confirmText="Так, зберегти"] - Текст кнопки підтвердження.
 * @param {string} [props.cancelText="Скасувати"] - Текст кнопки скасування.
 * @param {boolean} [props.isDanger=false] - Чи є дія небезпечною.
 * @returns {JSX.Element|null} Рендер модального вікна або null, якщо закрито.
 */
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

/**
 * Головний компонент вкладки "Завдання відділу" для координатора.
 * Відображає заявки, призначені на відділ координатора, дозволяє
 * створювати, редагувати, видаляти підзавдання, призначати волонтерів,
 * змінювати статус заявки та зберігати зміни.
 *
 * @component
 * @returns {JSX.Element} Рендер вкладки завдань відділу.
 */
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
        if (!userId) return;

        /**
         * Завантажує дані координатора: список волонтерів відділу та заявки.
         *
         * @async
         * @returns {Promise<void>}
         */
        const loadCoordinatorData = async () => {
            setLoading(true);
            try {
                const volsRes = await fetch(`${API_BASE_URL}/api/departments/coordinator/${userId}/volunteers`);
                if (volsRes.ok) {
                    setDepartmentVolunteers(await volsRes.json());
                } else {
                    console.error("Помилка 500: бекенд не зміг обробити запит на отримання волонтерів");
                    addToast("🚨 Помилка отримання списку волонтерів", "error");
                }

                const reqsRes = await fetch(`${API_BASE_URL}/api/departments/coordinator/${userId}/requests`);
                if (reqsRes.ok) {
                    const reqsData = await reqsRes.json();
                    setRequests(reqsData);

                    const tasksMap = {};
                    for (const req of reqsData) {
                        const tasksRes = await fetch(`${API_BASE_URL}/api/tasks/request/${req.id}`);
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

    /**
     * Розгортає або згортає деталі заявки.
     *
     * @param {string|number} id - Ідентифікатор заявки.
     */
    const toggleExpand = (id) => {
        setExpandedRequests(prev => ({ ...prev, [id]: !prev[id] }));
    };

    /**
     * Додає нове порожнє підзавдання до заявки.
     *
     * @param {string|number} reqId - Ідентифікатор заявки.
     */
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

    /**
     * Оновлює поле підзавдання.
     *
     * @param {string|number} reqId - Ідентифікатор заявки.
     * @param {string|number} taskId - Ідентифікатор підзавдання.
     * @param {string} field - Назва поля для оновлення.
     * @param {*} value - Нове значення поля.
     */
    const handleUpdateSubTask = (reqId, taskId, field, value) => {
        setTasksByRequest(prev => ({
            ...prev,
            [reqId]: prev[reqId].map(t => t.id === taskId ? { ...t, [field]: value } : t)
        }));
    };

    /**
     * Видаляє підзавдання. Якщо це останнє завдання, створює нове порожнє.
     *
     * @async
     * @param {string|number} reqId - Ідентифікатор заявки.
     * @param {string|number} taskId - Ідентифікатор підзавдання.
     * @param {boolean} isNew - Чи є завдання новим (ще не збереженим у БД).
     * @returns {Promise<void>}
     */
    const handleDeleteSubTask = async (reqId, taskId, isNew) => {
        const reqTasks = tasksByRequest[reqId] || [];

        if (!isNew) {
            try {
                const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
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

    /**
     * Відкриває модальне вікно підтвердження збереження завдань.
     *
     * @param {string|number} reqId - Ідентифікатор заявки.
     */
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

    /**
     * Підтверджує та виконує збереження завдань на бекенді.
     *
     * @async
     * @returns {Promise<void>}
     */
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
            const res = await fetch(`${API_BASE_URL}/api/tasks/request/${pendingSaveReqId}/batch`, {
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

    /**
     * Змінює статус материнської заявки координатором.
     *
     * @async
     * @param {string|number} reqId - Ідентифікатор заявки.
     * @param {string} newStatus - Новий статус заявки.
     * @returns {Promise<void>}
     */
    const handleRequestStatusChange = async (reqId, newStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/requests/${reqId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, departmentIds: [] })
            });

            if (res.ok) {
                setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
                addToast(`✅ Статус заявки успішно змінено на ${newStatus}`, "success");
            } else {
                throw new Error(`Сервер повернув помилку: ${res.status}`);
            }
        } catch (err) {
            console.error("Помилка зміни статусу заявки:", err);
            addToast("🚨 Не вдалося змінити статус заявки", "error");
        }
    };

    /**
     * Рендерить бейдж статусу підзавдання.
     *
     * @param {string} status - Статус підзавдання.
     * @returns {JSX.Element} Бейдж з відповідним статусом.
     */
    const renderTaskStatusBadge = (status) => {
        switch (status) {
            case 'ASSIGNED': return <span style={{ fontSize: '0.75rem', padding: '5px 12px', backgroundColor: 'rgba(254, 240, 138, 0.25)', color: '#854d0e', borderRadius: '8px', fontWeight: 'bold', border: '1px solid rgba(133, 77, 14, 0.2)' }}>Призначено</span>;
            case 'IN_PROGRESS': return <span style={{ fontSize: '0.75rem', padding: '5px 12px', backgroundColor: 'rgba(191, 219, 254, 0.25)', color: '#1e3a8a', borderRadius: '8px', fontWeight: 'bold', border: '1px solid rgba(30, 58, 138, 0.2)' }}>В процесі</span>;
            case 'COMPLETED': return <span style={{ fontSize: '0.75rem', padding: '5px 12px', backgroundColor: 'rgba(220, 252, 231, 0.25)', color: '#166534', borderRadius: '8px', fontWeight: 'bold', border: '1px solid rgba(22, 101, 52, 0.2)' }}>Виконано</span>;
            case 'CANCELLED': return <span style={{ fontSize: '0.75rem', padding: '5px 12px', backgroundColor: 'rgba(254, 226, 226, 0.25)', color: '#991b1b', borderRadius: '8px', fontWeight: 'bold', border: '1px solid rgba(153, 27, 27, 0.2)' }}>Скасовано</span>;
            default: return null;
        }
    };

    /**
     * Повертає конфігурацію для відображення статусу заявки.
     *
     * @param {string} status - Статус заявки.
     * @returns {Object} Об'єкт з кольорами, іконкою та текстом.
     */
    const getRequestStatusConfig = (status) => {
        switch (status) {
            case 'IN_PROGRESS': return { bg: 'rgba(254, 243, 199, 0.9)', color: '#b45309', icon: '⚙️', text: 'В ПРОЦЕСІ' };
            case 'APPROVED': return { bg: 'rgba(224, 231, 255, 0.9)', color: '#4338ca', icon: '👍', text: 'ЗАТВЕРДЖЕНО' };
            case 'REJECTED': return { bg: 'rgba(254, 226, 226, 0.9)', color: '#b91c1c', icon: '❌', text: 'ВІДХИЛЕНО' };
            case 'FULFILLED': return { bg: 'rgba(209, 250, 229, 0.9)', color: '#047857', icon: '✅', text: 'ВИКОНАНО' };
            case 'PENDING': return { bg: 'rgba(241, 245, 249, 0.9)', color: '#475569', icon: '⏳', text: 'ОЧІКУЄ' };
            default: return { bg: 'rgba(241, 245, 249, 0.9)', color: '#475569', icon: '📝', text: status };
        }
    };

    if (loading) return <div className="coord-tasks-section" style={{ padding: '40px', textAlign: 'center', color: '#1e3a8a', fontWeight: '600' }}><p>Завантаження даних координатора...</p></div>;

    const allowedRequestStatuses = ['APPROVED', 'IN_PROGRESS', 'FULFILLED'];

    return (
        <div className="coord-tasks-section" style={{ padding: '5px 0' }}>
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

            <div className="filter-zone" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: '700' }}>Фільтр за статусом:</span>
                <select
                    className="coord-minimal-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        color: '#1e3a8a',
                        border: '1px solid rgba(30, 58, 138, 0.2)',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <option value="all">Усі заявки</option>
                    <option value="IN_PROGRESS">В процесі (IN_PROGRESS)</option>
                    <option value="APPROVED">Затверджено (APPROVED)</option>
                    <option value="REJECTED">Відхилено (REJECTED)</option>
                    <option value="FULFILLED">Виконані (FULFILLED)</option>
                </select>
            </div>

            {requests.filter(req => filterStatus === 'all' || req.status === filterStatus).length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '50px 20px',
                    color: '#1e3a8a',
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(30, 58, 138, 0.1)',
                    marginTop: '20px'
                }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: '700' }}>📭 Заявок не знайдено</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Для вашого відділу наразі немає призначених заявок або вони не відповідають критеріям фільтру.</p>
                </div>
            ) : (
                requests
                    .filter(req => filterStatus === 'all' || req.status === filterStatus)
                    .map((request) => {
                        const isExpanded = expandedRequests[request.id];
                        const reqTasks = tasksByRequest[request.id] || [];
                        const isRequestLocked = request.status === 'FULFILLED' || request.status === 'REJECTED';

                        const reqStatusConfig = getRequestStatusConfig(request.status);

                        const statusOptions = [...new Set([request.status, ...allowedRequestStatuses])];

                        return (
                            <div className="glass-main-request-panel fade-in" key={request.id} style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'rgba(255, 255, 255, 0.55)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.06)',
                                marginBottom: '25px',
                                borderLeft: `5px solid ${request.status === 'REJECTED' ? '#ef4444' : request.status === 'FULFILLED' ? '#10b981' : '#1e40af'}`,
                                boxSizing: 'border-box'
                            }}>
                                <div className="coord-req-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                        <h3 style={{ color: '#1e3a8a', margin: 0, fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>
                                            ЗАЯВКА №{request.id.toString().slice(0, 8).toUpperCase()}
                                        </h3>

                                        <select
                                            value={request.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleRequestStatusChange(request.id, e.target.value)}
                                            style={{
                                                appearance: 'none',
                                                backgroundColor: reqStatusConfig.bg,
                                                color: reqStatusConfig.color,
                                                border: `1px solid ${reqStatusConfig.color}40`,
                                                padding: '6px 28px 6px 14px',
                                                borderRadius: '10px',
                                                fontSize: '0.85rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                backdropFilter: 'blur(4px)',
                                                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${reqStatusConfig.color.replace('#', '')}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right .6rem top 50%',
                                                backgroundSize: '.65rem auto',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {statusOptions.map(st => {
                                                const stConfig = getRequestStatusConfig(st);
                                                return (
                                                    <option
                                                        key={st}
                                                        value={st}
                                                        disabled={!allowedRequestStatuses.includes(st)}
                                                    >
                                                        {stConfig.icon} {stConfig.text} {(!allowedRequestStatuses.includes(st) ? '(Тільки Голова)' : '')}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <button
                                        className="main-search-btn"
                                        style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '10px' }}
                                        onClick={() => toggleExpand(request.id)}
                                    >
                                        {isExpanded ? 'Згорнути ▲' : 'Управління завданнями ▼'}
                                    </button>
                                </div>

                                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div className="coord-req-field" style={{ color: '#374151', fontSize: '14px' }}>
                                        <strong>Назва:</strong> {request.title}
                                    </div>
                                    <div className="coord-req-field" style={{ color: '#374151', fontSize: '14px' }}>
                                        <strong>Опис:</strong> {request.description || "Опис відсутній"}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="fade-in" style={{ marginTop: '20px', paddingTop: '10px' }}>
                                        <div className="coord-subtasks-divider" style={{
                                            margin: '15px 0',
                                            padding: '8px 0',
                                            borderBottom: '2px dashed rgba(30, 58, 138, 0.15)',
                                            display: 'flex',
                                            justifyContent: 'flex-start'
                                        }}>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                                                📋 РОЗПОДІЛ НА ЗАВДАННЯ ({reqTasks.length})
                                            </span>
                                        </div>

                                        {isRequestLocked && (
                                            <div style={{
                                                padding: '12px 16px',
                                                backgroundColor: 'rgba(241, 245, 249, 0.7)',
                                                color: '#475569',
                                                borderRadius: '12px',
                                                textAlign: 'center',
                                                margin: '15px 0 20px 0',
                                                border: '1px dashed rgba(71, 85, 105, 0.3)',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                backdropFilter: 'blur(2px)'
                                            }}>
                                                🔒 Заявка перейшла у фінальний статус ({request.status}). Додавання та редагування завдань повністю заблоковано.
                                            </div>
                                        )}

                                        <div className="coord-subtasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {reqTasks.map((task, index) => {
                                                const isEditable = !isRequestLocked && (task.status === 'ASSIGNED' || task.isNew);

                                                return (
                                                    <div className="request-full-card" key={task.id} style={{
                                                        opacity: isEditable ? 1 : 0.9,
                                                        backgroundColor: isEditable ? 'rgba(255, 255, 255, 0.6)' : 'rgba(241, 245, 249, 0.5)',
                                                        border: isEditable ? '1px solid rgba(30, 58, 138, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
                                                        padding: '16px 20px',
                                                        borderRadius: '12px',
                                                        boxShadow: 'none',
                                                        margin: 0,
                                                        boxSizing: 'border-box',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <span className="counter-number counter-number-styled" style={{ fontSize: '12px', padding: '3px 8px' }}>
                                                                    {index + 1}
                                                                </span>
                                                                {renderTaskStatusBadge(task.status)}
                                                            </div>
                                                            {!isEditable && (
                                                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    🔒 Заблоковано для змін
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="coord-subtask-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a8a' }}>Назва завдання:</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Введіть назву підзавдання..."
                                                                    className="main-search-input"
                                                                    value={task.title}
                                                                    onChange={(e) => handleUpdateSubTask(request.id, task.id, 'title', e.target.value)}
                                                                    disabled={!isEditable}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px 12px',
                                                                        fontSize: '13px',
                                                                        cursor: isEditable ? 'text' : 'not-allowed',
                                                                        backgroundColor: isEditable ? '#fff' : 'rgba(226, 232, 240, 0.5)',
                                                                        color: isEditable ? '#0f172a' : '#475569',
                                                                        border: '1px solid rgba(30, 58, 138, 0.15)',
                                                                        boxSizing: 'border-box'
                                                                    }}
                                                                />
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a8a' }}>Відповідальний волонтер:</span>
                                                                <select
                                                                    value={task.assigned_volunteer_id || ''}
                                                                    onChange={(e) => handleUpdateSubTask(request.id, task.id, 'assigned_volunteer_id', e.target.value)}
                                                                    disabled={!isEditable}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px 12px',
                                                                        borderRadius: '10px',
                                                                        border: '1px solid rgba(30, 58, 138, 0.15)',
                                                                        fontSize: '13px',
                                                                        outline: 'none',
                                                                        cursor: isEditable ? 'pointer' : 'not-allowed',
                                                                        backgroundColor: isEditable ? '#fff' : 'rgba(226, 232, 240, 0.5)',
                                                                        color: isEditable ? '#0f172a' : '#475569',
                                                                        fontWeight: '500',
                                                                        boxSizing: 'border-box'
                                                                    }}
                                                                >
                                                                    <option value="" disabled>Оберіть відповідального...</option>
                                                                    {departmentVolunteers.map(vol => (
                                                                        <option key={vol.id} value={vol.id}>
                                                                            👤 {vol.first_name} {vol.last_name} {vol.id === userId ? '(Я)' : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a8a' }}>Опис завдання:</span>
                                                                <textarea
                                                                    placeholder="Детальний опис підзавдання..."
                                                                    className="main-search-input"
                                                                    value={task.description || ''}
                                                                    onChange={(e) => handleUpdateSubTask(request.id, task.id, 'description', e.target.value)}
                                                                    disabled={!isEditable}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px 12px',
                                                                        fontSize: '13px',
                                                                        minHeight: '65px',
                                                                        borderRadius: '10px',
                                                                        resize: 'vertical',
                                                                        cursor: isEditable ? 'text' : 'not-allowed',
                                                                        backgroundColor: isEditable ? '#fff' : 'rgba(226, 232, 240, 0.5)',
                                                                        color: isEditable ? '#0f172a' : '#475569',
                                                                        border: '1px solid rgba(30, 58, 138, 0.15)',
                                                                        boxSizing: 'border-box'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {isEditable && (
                                                            <div className="coord-subtask-actions" style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    className="btn-reject-request"
                                                                    style={{
                                                                        background: 'rgba(231, 76, 60, 0.12)',
                                                                        color: '#e74c3c',
                                                                        border: '1px solid rgba(231, 76, 60, 0.25)',
                                                                        padding: '5px 12px',
                                                                        borderRadius: '8px',
                                                                        fontSize: '12px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '600'
                                                                    }}
                                                                    onClick={() => handleDeleteSubTask(request.id, task.id, task.isNew)}
                                                                    title="Видалити завдання"
                                                                >
                                                                    ✕ Видалити завдання
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {!isRequestLocked && (
                                            <>
                                                <div className="coord-add-subtask-center" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                                                    <button
                                                        className="coord-circle-add-btn"
                                                        onClick={() => handleAddSubTask(request.id)}
                                                        title="Додати нове завдання"
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: '#1e40af',
                                                            color: '#fff',
                                                            border: 'none',
                                                            fontSize: '20px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="coord-action-right" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn-approve-request"
                                                        style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '14px' }}
                                                        onClick={() => handleSaveTasksTrigger(request.id)}
                                                    >
                                                        💾 ЗБЕРЕГТИ ЗМІНИ
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
            )}
        </div>
    );
}