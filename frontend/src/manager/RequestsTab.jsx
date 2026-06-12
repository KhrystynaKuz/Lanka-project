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

    // Стейт для кастомного модального вікна видалення
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, requestId: null });
    // Стейт для збереження стану чекбокса "Більше не показувати"
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // --- СТЕЙТИ ДЛЯ ВІДДІЛІВ ---
    const [departments, setDepartments] = useState([]); // Список усіх відділів із БД
    const [selectedDepartmentsByRequest, setSelectedDepartmentsByRequest] = useState({}); // Обрані відділи для кожної заявки

    const loadCoreData = () => {
        fetch('/api/requests')
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(setRequests)
            .catch(err => console.error("Помилка завантаження історії заявок:", err));
    };

    useEffect(() => {
        fetch('/api/requests/stats')
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => setNewCount(data.newCount))
            .catch(err => console.error("Помилка завантаження лічильника:", err));

        // Отримання списку відділів із БД
        fetch('http://localhost:8080/api/departments')
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => setDepartments(data))
            .catch(err => console.error("Помилка завантаження відділів із БД:", err));

        loadCoreData();
    }, []);

    useEffect(() => {
        if (showPendingDropdown && pendingRequests.length === 0) {
            setLoading(true);
            fetch('/api/requests/pending')
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(data => {
                    setPendingRequests(data);
                    setNewCount(data.length);
                })
                .catch(err => console.error("Помилка завантаження нових заявок:", err))
                .finally(() => setLoading(false));
        }
    }, [showPendingDropdown, pendingRequests.length]);

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === 'APPROVED') {
            const chosenDepts = selectedDepartmentsByRequest[id] || [];
            if (chosenDepts.length === 0) {
                alert('🚨 Нам треба спершу обрати відділ, а потім лише натиснути кнопку «затвердити і передати»!');
                return;
            }
            console.log(`Передаємо заявку ${id} у відділи з ID:`, chosenDepts);
        }

        fetch(`/api/requests/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: newStatus,
                departmentIds: newStatus === 'APPROVED' ? (selectedDepartmentsByRequest[id] || []) : []
            })
        })
            .then(res => {
                if (!res.ok) throw new Error("Сервер відхилив запит");
                return res.json();
            })
            .then(() => {
                const targetRequest = pendingRequests.find(req => req.id === id);
                if (!targetRequest) return;

                const updatedRequest = { ...targetRequest, status: newStatus };

                setPendingRequests(prev => prev.filter(req => req.id !== id));
                setNewCount(prev => Math.max(0, prev - 1));
                setRequests(prev => {
                    const filtered = prev.filter(req => req.id !== id);
                    return [updatedRequest, ...filtered];
                });

                setSelectedDepartmentsByRequest(prev => {
                    const updated = { ...prev };
                    delete updated[id];
                    return updated;
                });
            })
            .catch(err => {
                console.error("Помилка при оновленні статусу:", err);
                alert("Помилка оновлення статусу заявки.");
            });
    };

    const handleCheckboxChange = (requestId, deptId) => {
        setSelectedDepartmentsByRequest(prev => {
            const currentSelected = prev[requestId] || [];
            let updatedSelected;

            if (currentSelected.includes(deptId)) {
                updatedSelected = currentSelected.filter(id => id !== deptId);
            } else {
                updatedSelected = [...currentSelected, deptId];
            }

            return {
                ...prev,
                [requestId]: updatedSelected
            };
        });
    };

    const executeDeleteFetch = (id) => {
        fetch(`/api/requests/${id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (!res.ok) throw new Error("Помилка при видаленні з сервера");
                return res.json();
            })
            .then(() => {
                setRequests(prev => prev.filter(req => req.id !== id));
            })
            .catch(err => {
                console.error("Помилка при видаленні заявки:", err);
                alert("Не вдалося видалити заявку.");
            });
    };

    const openDeleteModal = (id) => {
        const skipWarning = sessionStorage.getItem('skipDeleteWarning') === 'true';
        if (skipWarning) {
            executeDeleteFetch(id);
        } else {
            setDeleteModal({ isOpen: true, requestId: id });
        }
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, requestId: null });
        setDontShowAgain(false);
    };

    const confirmDeleteRequest = () => {
        const id = deleteModal.requestId;
        if (!id) return;

        if (dontShowAgain) {
            sessionStorage.setItem('skipDeleteWarning', 'true');
        }

        executeDeleteFetch(id);
        closeDeleteModal();
    };

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
            <div className="search-main-row">
                <input
                    type="text"
                    className="main-search-input"
                    placeholder="Пошук заявок за ключовими словами..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="main-search-btn" onClick={handleSearch}>Знайти</button>
            </div>

            <div className="tab-header-block" style={{ marginTop: '20px' }}>
                <div
                    className={`badge-counter badge-counter-clickable ${showPendingDropdown ? 'active-counter' : ''}`}
                    onClick={() => setShowPendingDropdown(!showPendingDropdown)}
                >
                    Нові заявки: <span className="counter-number counter-number-styled">{newCount}</span> {showPendingDropdown ? '▼' : '▲'}
                </div>
            </div>

            {showPendingDropdown && (
                <div className="glass-main-request-panel fade-in" style={{ marginTop: '15px', marginBottom: '30px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#1e3a8a', padding: '20px' }}>Завантаження з бази даних...</p>
                    ) : pendingRequests.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#1e3a8a', padding: '20px' }}>Немає нових заявок для розгляду.</p>
                    ) : (
                        pendingRequests.map((request) => {
                            const isExpanded = !!expandedRequests[request.id];
                            const chosenForThisRequest = selectedDepartmentsByRequest[request.id] || [];

                            return (
                                <div className="request-full-card" key={request.id} style={{ marginBottom: '15px', borderLeft: '4px solid #e67e22' }}>
                                    <div className="request-header-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div onClick={() => toggleExpand(request.id)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                                            <h3 style={{ color: '#1e3a8a' }}>НОВА ЗАЯВКА №{request.id ? String(request.id).slice(0, 8).toUpperCase() : '---'}</h3>
                                            <span className="applicant-pib" style={{ color: '#6b7280' }}>ID Замовника: {request.customer_id || 'Не вказано'}</span>
                                        </div>
                                        <button className="main-search-btn" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => toggleExpand(request.id)}>
                                            {isExpanded ? 'Згорнути ▲' : 'Розгорнути ▼'}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="request-body-fields" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(30, 58, 138, 0.1)' }}>
                                            <p style={{ color: '#374151' }}><strong>Назва:</strong> {request.title}</p>
                                            <p style={{ color: '#374151' }}><strong>Опис:</strong> {request.description || "Опис відсутній"}</p>
                                            <p style={{ color: '#374151' }}><strong>Статус:</strong> <span className="status-badge pending request-pending-badge">{request.status}</span></p>
                                            {request.priority && <p style={{ color: '#374151' }}><strong>Пріоритет:</strong> {request.priority}</p>}

                                            {/* --- ОНОВЛЕНИЙ БЛОК: ТЕПЕР ВІН ВИЩЕ ТА КОМПАКТНІШИЙ --- */}
                                            <div className="department-selection-block" style={{
                                                margin: '10px 0 15px 0',
                                                padding: '10px 16px',
                                                background: 'rgba(30, 58, 138, 0.05)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(30, 58, 138, 0.12)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}>
                                                <h4 style={{
                                                    color: '#1e3a8a',
                                                    margin: '0',
                                                    fontSize: '14px',
                                                    fontWeight: '700'
                                                }}>
                                                    🏢 Оберіть відділ(и) для передачі заявки:
                                                </h4>
                                                {departments.length === 0 ? (
                                                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Завантаження...</p>
                                                ) : (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: '10px'
                                                    }}>
                                                        {departments.map((dept) => {
                                                            const isChecked = chosenForThisRequest.includes(dept.id);
                                                            return (
                                                                <label
                                                                    key={dept.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        cursor: 'pointer',
                                                                        color: isChecked ? '#1e40af' : '#4b5563',
                                                                        background: isChecked ? 'rgba(30, 58, 138, 0.08)' : '#ffffff',
                                                                        padding: '6px 14px',
                                                                        borderRadius: '8px',
                                                                        border: isChecked ? '1px solid #1e40af' : '1px solid rgba(0, 0, 0, 0.08)',
                                                                        userSelect: 'none',
                                                                        fontWeight: isChecked ? '600' : '500',
                                                                        fontSize: '13px',
                                                                        margin: '0',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        style={{
                                                                            transform: 'scale(1.1)',
                                                                            cursor: 'pointer',
                                                                            accentColor: '#1e40af',
                                                                            margin: '0'
                                                                        }}
                                                                        checked={isChecked}
                                                                        onChange={() => handleCheckboxChange(request.id, dept.id)}
                                                                    />
                                                                    <span>{dept.name}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="request-action-footer" style={{ marginTop: '10px', display: 'flex', gap: '15px' }}>
                                                <button
                                                    className="btn-reject-request"
                                                    style={{ background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(request.id, 'REJECTED'); }}
                                                >
                                                    ✕ Відхилити
                                                </button>
                                                <button
                                                    className="btn-approve-request"
                                                    style={{
                                                        background: chosenForThisRequest.length > 0 ? '#1e40af' : '#9ca3af',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(request.id, 'APPROVED'); }}
                                                >
                                                    ✓ Затвердити і передати
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

            <hr style={{ border: 'none', borderTop: '1px solid rgba(30, 58, 138, 0.1)', margin: '30px 0' }} />

            <div className="filter-zone" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: '700' }}>Фільтр за статусом:</span>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        color: '#1e3a8a',
                        border: '1px solid rgba(30, 58, 138, 0.2)',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}
                >
                    <option value="ALL" style={{ background: '#ffffff', color: '#1e3a8a' }}>Усі оброблені</option>
                    <option value="APPROVED" style={{ background: '#ffffff', color: '#1e3a8a' }}>APPROVED (Затверджені)</option>
                    <option value="REJECTED" style={{ background: '#ffffff', color: '#1e3a8a' }}>REJECTED (Відхилені)</option>
                </select>
            </div>

            <div className="glass-main-request-panel">
                {(() => {
                    const filteredRequests = requests.filter(req => {
                        if (req.status === 'PENDING') return false;
                        if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
                        return true;
                    });

                    if (filteredRequests.length === 0) {
                        return <p style={{ textAlign: 'center', color: '#1e3a8a', padding: '20px' }}>Оброблених заявок не знайдено.</p>;
                    }

                    return filteredRequests.map((request) => {
                        const isExpanded = !!expandedRequests[request.id];
                        return (
                            <div className="request-full-card" key={request.id} style={{ marginBottom: '15px' }}>
                                <div className="request-header-line" onClick={() => toggleExpand(request.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a' }}>ЗАЯВКА №{request.id ? String(request.id).slice(0, 8).toUpperCase() : '---'}</h3>
                                        <span className="applicant-pib" style={{ color: '#6b7280' }}>ID Замовника: {request.customer_id || 'Не вказано'}</span>
                                    </div>
                                    <button className="main-search-btn" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); toggleExpand(request.id); }}>
                                        {isExpanded ? 'Згорнути ▲' : 'Розгорнути ▼'}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="request-body-fields" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(30, 58, 138, 0.1)' }}>
                                        <p style={{ color: '#374151' }}><strong>Назва:</strong> {request.title}</p>
                                        <p style={{ color: '#374151' }}><strong>Опис:</strong> {request.description || "Опис відсутній"}</p>
                                        <p style={{ color: '#374151' }}><strong>Статус:</strong> <span className={`status-badge ${request.status ? request.status.toLowerCase() : ''}`} style={{ fontWeight: '600' }}>{request.status}</span></p>
                                        {request.priority && <p style={{ color: '#374151' }}><strong>Пріоритет:</strong> {request.priority}</p>}

                                        <div className="request-action-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-delete-from-history"
                                                onClick={(e) => { e.stopPropagation(); openDeleteModal(request.id); }}
                                            >
                                                🗑 Видалити з історії
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>

            {deleteModal.isOpen && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal-card">
                        <div className="delete-modal-icon">⚠️</div>
                        <h3 className="delete-modal-title">Остаточне видалення</h3>
                        <p className="delete-modal-text">
                            Ви впевнені, що хочете видалити цю заявку? Цю дію не можна скасувати.
                        </p>

                        <label className="modal-checkbox-container">
                            <input
                                type="checkbox"
                                className="modal-checkbox-input"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                            />
                            <span className="modal-checkbox-label">Більше не попереджати в цій сесії</span>
                        </label>

                        <div className="delete-modal-actions">
                            <button className="btn-modal-cancel" onClick={closeDeleteModal}>
                                Скасувати
                            </button>
                            <button className="btn-modal-confirm" onClick={confirmDeleteRequest}>
                                Так, видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}