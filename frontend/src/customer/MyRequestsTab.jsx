import React, { useState, useEffect } from 'react';

export default function MyRequestsTab({ userId, onGoToChat }) {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`http://localhost:8080/api/requests/customer/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            } else {
                console.error("Не вдалося завантажити заявки");
            }
        } catch (error) {
            console.error("Помилка мережі при отриманні заявок:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [userId]);

    const handleDelete = async (requestId, currentStatus) => {
        if (currentStatus?.toUpperCase() !== 'PENDING') {
            alert("Можна скасовувати тільки заявки зі статусом 'PENDING'.");
            return;
        }

        if (!window.confirm("Ви впевнені, що хочете скасувати цю заявку?")) return;

        try {
            const response = await fetch(`http://localhost:8080/api/requests/delete/${requestId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert("Заявку успішно скасовано.");
                setRequests(requests.filter(req => req.id !== requestId));
            } else {
                const errorText = await response.text();
                alert(`Помилка видалення: ${errorText}`);
            }
        } catch (error) {
            console.error("Помилка при видаленні заявки:", error);
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
                                    <button className="btn-detail-view" onClick={onGoToChat}>
                                        Чат по заявці
                                    </button>

                                    <button
                                        className="btn-action-circle reject"
                                        title={isPending ? "Скасувати заявку" : "Цю заявку вже не можна скасувати"}
                                        onClick={() => handleDelete(req.id, req.status)}
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