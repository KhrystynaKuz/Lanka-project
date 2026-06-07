import React, { useState, useEffect } from 'react';

export default function RequestsTab() {
    const [requests, setRequests] = useState([]);
    const [newCount, setNewCount] = useState(0);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showPendingDropdown, setShowPendingDropdown] = useState(false);
    const [expandedRequests, setExpandedRequests] = useState({});
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Оновлення лічильника та історії (оброблених заявок)
    const loadCoreData = () => {
        fetch('/api/requests/stats')
            .then(res => res.json())
            .then(data => setNewCount(data.newCount))
            .catch(err => console.error("Помилка лічильника:", err));

        fetch('/api/requests')
            .then(res => res.json())
            .then(setRequests)
            .catch(err => console.error("Помилка історії заявок:", err));
    };

    // Завантажуємо при першому рендері вкладки
    useEffect(() => {
        loadCoreData();
    }, []);

    // Підвантажуємо PENDING заявки тільки тоді, коли відкриваємо дропдаун
    useEffect(() => {
        if (showPendingDropdown) {
            setLoading(true);
            fetch('/api/requests/pending')
                .then(res => res.json())
                .then(data => {
                    setPendingRequests(data);
                    setNewCount(data.length);
                })
                .catch(err => console.error("Помилка завантаження нових заявок:", err))
                .finally(() => setLoading(false));
        }
    }, [showPendingDropdown]);

    // Швидка зміна статусу з локальним Rollback у разі помилки сервера (CORS/Security)
    const handleStatusChange = (id, newStatus) => {
        const backupPending = [...pendingRequests];
        const backupCount = newCount;

        // Оптимістично оновлюємо інтерфейс відразу (миттєвий відгук)
        setPendingRequests(prev => prev.filter(req => req.id !== id));
        setNewCount(prev => Math.max(0, prev - 1));

        fetch(`/api/requests/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })
            .then(res => {
                if (!res.ok) throw new Error("Помилка мережі або статус заблоковано");
                // Оновлюємо історію знизу
                fetch('/api/requests').then(res => res.json()).then(setRequests);
            })
            .catch(err => {
                console.error("Помилка PATCH запиту:", err);
                alert("Не вдалося змінити статус заявки.");
                setPendingRequests(backupPending);
                setNewCount(backupCount);
            });
    };

    // Працюючий пошук
    const handleSearch = () => {
        setLoading(true);
        const url = searchQuery.trim()
            ? `/api/requests/search?title=${encodeURIComponent(searchQuery.trim())}`
            : '/api/requests';

        fetch(url)
            .then(res => res.json())
            .then(setRequests)
            .catch(err => console.error("Помилка пошуку:", err))
            .finally(() => setLoading(false));
    };

    const toggleExpand = (id) => {
        setExpandedRequests(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="admin-tab-content fade-in">
            {/* Рядок пошуку */}
            <div className="search-main-row">
                <input
                    type="text"
                    className="main-search-input"
                    placeholder="Пошук заявок за ключовими словами або номерами..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="main-search-btn" onClick={handleSearch}>Знайти</button>
            </div>

            {/* Блок Нових Заявок (Dropdown) */}
            <div className="tab-header-block" style={{ marginTop: '20px' }}>
                <div
                    className={`badge-counter ${showPendingDropdown ? 'active-counter' : ''}`}
                    onClick={() => setShowPendingDropdown(!showPendingDropdown)}
                    style={{ cursor: 'pointer', display: 'inline-block', userSelect: 'none' }}
                >
                    Нові заявки: <span className="counter-number">{newCount}</span> {showPendingDropdown ? '▼' : '▲'}
                </div>
            </div>

            {showPendingDropdown && (
                <div className="glass-main-request-panel fade-in" style={{ marginTop: '15px', marginBottom: '30px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '20px' }}>Завантаження з бази даних...</p>
                    ) : pendingRequests.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '20px' }}>Немає нових заявок для розгляду.</p>
                    ) : (
                        pendingRequests.map((request) => {
                            const isExpanded = !!expandedRequests[request.id];
                            return (
                                <div className="request-full-card" key={request.id} style={{ marginBottom: '15px', borderLeft: '4px solid #e67e22' }}>
                                    <div className="request-header-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div onClick={() => toggleExpand(request.id)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                                            <h3>НОВА ЗАЯВКА №{request.id ? String(request.id).slice(0, 8).toUpperCase() : '---'}</h3>
                                            <span className="applicant-pib">ID Замовника: {request.customer_id || 'Не вказано'}</span>
                                        </div>
                                        <button className="main-search-btn" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => toggleExpand(request.id)}>
                                            {isExpanded ? 'Згорнути ▲' : 'Розгорнути ▼'}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="request-body-fields" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <p><strong>Назва:</strong> {request.title}</p>
                                            <p><strong>Опис:</strong> {request.description || "Опис відсутній"}</p>
                                            <p><strong>Статус:</strong> <span className="status-badge pending" style={{ background: 'rgba(230, 126, 34, 0.2)', color: '#e67e22', padding: '2px 8px', borderRadius: '4px' }}>{request.status}</span></p>
                                            {request.priority && <p><strong>Пріоритет:</strong> {request.priority}</p>}

                                            <div className="request-action-footer" style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                                                <button
                                                    className="btn-reject-request"
                                                    style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(request.id, 'REJECTED'); }}
                                                >
                                                    ✕ Відхилити заявку
                                                </button>
                                                <button
                                                    className="btn-approve-request"
                                                    style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(request.id, 'APPROVED'); }}
                                                >
                                                    ✓ Затвердити заявку
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '30px 0' }} />

            {/* Фільтрація Історії */}
            <div className="filter-zone" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Фільтр за статусом:</span>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                >
                    <option value="ALL" style={{ background: '#2c3e50' }}>Усі оброблені</option>
                    <option value="APPROVED" style={{ background: '#2c3e50' }}>APPROVED (Затверджені)</option>
                    <option value="REJECTED" style={{ background: '#2c3e50' }}>REJECTED (Відхилені)</option>
                </select>
            </div>

            {/* Список оброблених заявок */}
            <div className="glass-main-request-panel">
                {(() => {
                    const filteredRequests = requests.filter(req => {
                        if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
                        return true;
                    });

                    if (filteredRequests.length === 0) {
                        return <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }}>Заявок із таким статусом не знайдено.</p>;
                    }

                    return filteredRequests.map((request) => {
                        const isExpanded = !!expandedRequests[request.id];
                        return (
                            <div className="request-full-card" key={request.id} style={{ marginBottom: '15px' }}>
                                <div className="request-header-line" onClick={() => toggleExpand(request.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3>ЗАЯВКА №{request.id ? String(request.id).slice(0, 8).toUpperCase() : '---'}</h3>
                                        <span className="applicant-pib">ID Замовника: {request.customer_id || 'Не вказано'}</span>
                                    </div>
                                    <button className="main-search-btn" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); toggleExpand(request.id); }}>
                                        {isExpanded ? 'Згорнути ▲' : 'Розгорнути ▼'}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="request-body-fields" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p><strong>Назва:</strong> {request.title}</p>
                                        <p><strong>Опис:</strong> {request.description || "Опис відсутній"}</p>
                                        <p><strong>Статус:</strong> <span className={`status-badge ${request.status ? request.status.toLowerCase() : ''}`}>{request.status}</span></p>
                                        {request.priority && <p><strong>Пріоритет:</strong> {request.priority}</p>}

                                        <div className="department-assignment-zone" style={{ marginTop: '20px' }}>
                                            <h4>Призначені відділи:</h4>
                                            <div className="checkbox-grid">
                                                <label><input type="checkbox" defaultChecked disabled/> Медичний (Дмитро Л. координатор)</label>
                                                <label><input type="checkbox" disabled/> Гуманітарний</label>
                                                <label><input type="checkbox" disabled/> Авто-відділ</label>
                                                <label><input type="checkbox" disabled/> Склад логістики</label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}