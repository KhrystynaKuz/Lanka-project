import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Так, скасувати", cancelText = "Скасувати", isDanger = true }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-confirm-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-confirm-icon">
                    {isDanger ? '🗑️' : '⚠️'}
                </div>
                <h3 className="custom-confirm-title">{title || "Підтвердження"}</h3>
                <p className="custom-confirm-text">
                    {message || "Ви впевнені, що хочете виконати цю дію?"}
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

export default function MyRequestsTab({ userId, onGoToChat }) {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        requestId: null,
        requestStatus: null
    });

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const closeConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            requestId: null,
            requestStatus: null
        });
    };

    const fetchRequests = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`http://localhost:8080/api/requests/customer/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            } else {
                console.error("Не вдалося завантажити заявки");
                addToast("🚨 Не вдалося завантажити заявки", "error");
            }
        } catch (error) {
            console.error("Помилка мережі при отриманні заявок:", error);
            addToast("🚨 Помилка мережі при завантаженні заявок", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [userId]);

    const handleDeleteClick = (requestId, currentStatus) => {
        if (currentStatus?.toUpperCase() !== 'PENDING') {
            addToast("⚠️ Можна скасовувати тільки заявки зі статусом 'PENDING'.", "warning");
            return;
        }

        setConfirmModal({
            isOpen: true,
            requestId: requestId,
            requestStatus: currentStatus
        });
    };

    const executeDelete = async () => {
        const { requestId } = confirmModal;

        try {
            const response = await fetch(`http://localhost:8080/api/requests/delete/${requestId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                addToast("✅ Заявку успішно скасовано.", "success");
                setRequests(requests.filter(req => req.id !== requestId));
            } else {
                const errorText = await response.text();
                addToast(`🚨 Помилка видалення: ${errorText}`, "error");
            }
        } catch (error) {
            console.error("Помилка при видаленні заявки:", error);
            addToast("🚨 Не вдалося з'єднатися з сервером.", "error");
        } finally {
            closeConfirmModal();
        }
    };

    const handleChatNavigation = async (managerId) => {
        if (!managerId) {
            alert("До цієї заявки ще не призначено менеджера.");
            return;
        }

        try {
            // Call the Supabase function directly
            const { data: newChatId, error } = await supabase.rpc('get_or_create_direct_chat', {
                user1_id: userId,
                user2_id: managerId
            });

            if (error) {
                console.error("Supabase Error:", error);
                alert("Помилка при створенні чату.");
                return;
            }

            // Pass the new chat ID up to Customer.jsx
            if (newChatId) {
                onGoToChat(newChatId);
            }

        } catch (error) {
            console.error("Network Error:", error);
            alert("Не вдалося з'єднатися з сервером.");
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return '#eab308';
            case 'APPROVED': return '#16a34a';
            case 'REJECTED': return '#dc2626';
            default: return '#2563eb';
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 1: return ' Низький';
            case 2: return ' Середній';
            case 3: return ' Високий';
            case 4: return ' Критичний';
            default: return 'Звичайний';
        }
    };

    return (
        <div className="fade-in" style={{ marginTop: '15px' }}>
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
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={executeDelete}
                title="Скасування заявки"
                message="Ви впевнені, що хочете скасувати цю заявку? Цю дію не можна скасувати."
                confirmText="Так, скасувати"
                cancelText="Скасувати"
                isDanger={true}
            />

            {/* Header logic remains exactly the same */}
            <div className="tab-header-block">
                <h2 className="tab-title">Історія моїх заявок</h2>
                <div className="badge-counter">
                    Усього: <span className="counter-number">{requests.length}</span>
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#fff' }}>Завантаження заявок...</div>
            ) : requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '35px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#ccc' }}>
                    Ви ще не створили жодної заявки.
                </div>
            ) : (
                <div className="glass-verification-list">
                    {requests.map((req) => {
                        const isPending = req.status?.toUpperCase() === 'PENDING';

                        return (
                            <div className="verification-card" key={req.id}>
                                <div className="user-info-side">
                                    <div className="user-name">{req.title}</div>

                                    <div className="user-role-badge">
                                        Пріоритет: <strong>{getPriorityBadge(req.priority)}</strong>
                                        <span style={{ margin: '0 8px' }}>•</span>
                                        Статус: <span style={{ color: getStatusColor(req.status), fontWeight: 700 }}>{req.status}</span>
                                    </div>

                                    <div className="user-role-badge" style={{ marginTop: '5px', opacity: 0.9, lineHeight: '1.4' }}>
                                        {req.description}
                                    </div>
                                </div>

                                <div className="action-buttons-side">
                                    {/* --- UPDATED BUTTON --- */}
                                    <button
                                        className="btn-detail-view"
                                        onClick={() => handleChatNavigation(req.manager_id)}
                                        style={!req.manager_id ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                                    >
                                        {req.manager_id ? "Чат з менеджером" : "Очікує менеджера"}
                                    </button>

                                    <button
                                        className="btn-action-circle reject"
                                        title={isPending ? "Скасувати заявку" : "Цю заявку вже не можна скасувати"}
                                        onClick={() => handleDeleteClick(req.id, req.status)}
                                        disabled={!isPending}
                                        style={!isPending ? {
                                            backgroundColor: 'rgba(128, 128, 128, 0.2)',
                                            color: '#888888',
                                            borderColor: '#555555',
                                            opacity: 0.6,
                                            cursor: 'not-allowed'
                                        } : {}}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}