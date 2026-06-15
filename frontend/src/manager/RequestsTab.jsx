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
    const [loadingRequests, setLoadingRequests] = useState(true);

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, requestId: null });
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [selectedDepartmentsByRequest, setSelectedDepartmentsByRequest] = useState({});

    const getPriorityLabel = (priorityLevel) => {
        const labels = {
            1: '🟢 Низький',
            2: '🟡 Середній',
            3: '🟠 Високий',
            4: '🔴 Критичний'
        };
        return labels[priorityLevel] || '⚪ Не вказано';
    };

    const loadCoreData = () => {
        setLoadingRequests(true);
        fetch('/api/requests')
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(setRequests)
            .catch(err => console.error("Помилка завантаження історії заявок:", err))
            .finally(() => setLoadingRequests(false));
    };

    useEffect(() => {
        fetch('/api/requests/stats')
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => setNewCount(data.newCount))
            .catch(err => console.error("Помилка завантаження лічильника:", err));

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

    const updateRequestStatus = (id, newStatus, currentStatus) => {
        const isFromPending = currentStatus === 'PENDING';
        const isToPending = newStatus === 'PENDING';

        // Defensively pass an empty array to prevent backend NullPointerExceptions
        // when changing to statuses like FULFILLED.
        const payload = {
            status: newStatus,
            departmentIds: []
        };

        if (newStatus === 'APPROVED' && isFromPending) {
            const chosenDepts = selectedDepartmentsByRequest[id] || [];
            if (chosenDepts.length === 0) {
                alert('🚨 Будь ласка, оберіть хоча б один відділ перед затвердженням!');
                return;
            }
            payload.departmentIds = chosenDepts;
        }

        fetch(`/api/requests/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (!res.ok) throw new Error(`Сервер відхилив запит зі статусом: ${res.status}`);
                return res.json();
            })
            .then(() => {
                if (isFromPending && !isToPending) {
                    const targetRequest = pendingRequests.find(req => req.id === id);
                    setPendingRequests(prev => prev.filter(req => req.id !== id));
                    setNewCount(prev => Math.max(0, prev - 1));

                    if (targetRequest) {
                        setRequests(prev => [{ ...targetRequest, status: newStatus }, ...prev]);
                    }
                    setSelectedDepartmentsByRequest(prev => {
                        const updated = { ...prev };
                        delete updated[id];
                        return updated;
                    });
                } else if (!isFromPending && isToPending) {
                    const targetRequest = requests.find(req => req.id === id);
                    setRequests(prev => prev.filter(req => req.id !== id));
                    setNewCount(prev => prev + 1);
                    if (targetRequest) {
                        setPendingRequests(prev => [{ ...targetRequest, status: newStatus }, ...prev]);
                    }
                } else {
                    if (isFromPending) {
                        setPendingRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
                    } else {
                        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
                    }
                }
            })
            .catch(err => {
                console.error("Помилка при оновленні статусу:", err);
                alert("Не вдалося оновити статус заявки. Перевірте консоль сервера (backend).");
            });
    };

    const handleCheckboxChange = (requestId, deptId) => {
        setSelectedDepartmentsByRequest(prev => {
            const currentSelected = prev[requestId] || [];
            return {
                ...prev,
                [requestId]: currentSelected.includes(deptId)
                    ? currentSelected.filter(id => id !== deptId)
                    : [...currentSelected, deptId]
            };
        });
    };

    const executeDeleteFetch = (id) => {
        fetch(`/api/requests/${id}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error("Помилка при видаленні з сервера");
                return res.json();
            })
            .then(() => setRequests(prev => prev.filter(req => req.id !== id)))
            .catch(err => {
                console.error("Помилка при видаленні заявки:", err);
                alert("Не вдалося видалити заявку.");
            });
    };

    const openDeleteModal = (id) => {
        if (sessionStorage.getItem('skipDeleteWarning') === 'true') {
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
        if (!deleteModal.requestId) return;
        if (dontShowAgain) sessionStorage.setItem('skipDeleteWarning', 'true');

        executeDeleteFetch(deleteModal.requestId);
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

    const toggleExpand = (id) => setExpandedRequests(prev => ({ ...prev, [id]: !prev[id] }));

    const getStatusStyles = (status) => {
        switch (status) {
            case 'REJECTED': return { bg: '#fee2e2', color: '#b91c1c' };
            case 'FULFILLED': return { bg: '#d1fae5', color: '#047857' };
            case 'IN_PROGRESS': return { bg: '#fef3c7', color: '#b45309' };
            case 'APPROVED': return { bg: '#e0e7ff', color: '#4338ca' };
            default: return { bg: '#f1f5f9', color: '#475569' };
        }
    };

    return (
        <div className="admin-tab-content fade-in">
            <div className="search-main-row" style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    className="main-search-input"
                    style={{ flexGrow: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    placeholder="Пошук заявок за ключовими словами..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    className="main-search-btn"
                    style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', cursor: 'pointer' }}
                    onClick={handleSearch}
                >
                    Знайти
                </button>
            </div>

            <div className="tab-header-block" style={{ marginTop: '20px' }}>
                <div
                    className={`badge-counter badge-counter-clickable ${showPendingDropdown ? 'active-counter' : ''}`}
                    onClick={() => setShowPendingDropdown(!showPendingDropdown)}
                    style={{ cursor: 'pointer', display: 'inline-block', padding: '10px 15px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontWeight: 'bold', color: '#1e3a8a' }}
                >
                    Нові заявки: <span className="counter-number" style={{ backgroundColor: '#e67e22', color: 'white', padding: '2px 8px', borderRadius: '12px', marginLeft: '5px' }}>{newCount}</span> {showPendingDropdown ? '▼' : '▲'}
                </div>
            </div>

            {showPendingDropdown && (
                <div className="glass-main-request-panel fade-in" style={{ marginTop: '15px', marginBottom: '30px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#1e3a8a' }}>Завантаження з бази даних...</p>
                    ) : pendingRequests.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#64748b' }}>Немає нових заявок для розгляду. 🎉</p>
                    ) : (
                        pendingRequests.map((request) => {
                            const isExpanded = !!expandedRequests[request.id];
                            const chosenForThisRequest = selectedDepartmentsByRequest[request.id] || [];

                            return (
                                <div className="request-full-card" key={request.id} style={{ marginBottom: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', borderLeft: '4px solid #e67e22', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <div className="request-header-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div onClick={() => toggleExpand(request.id)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                                            <h3 style={{ color: '#1e3a8a', margin: '0 0 5px 0' }}>НОВА ЗАЯВКА №{request.id ? String(request.id).slice(0, 8).toUpperCase() : '---'}</h3>
                                            <span style={{ color: '#6b7280', fontSize: '14px' }}>Замовник: {request.customerName || 'Не вказано'}</span>
                                        </div>
                                        <button style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6' }} onClick={() => toggleExpand(request.id)}>
                                            {isExpanded ? 'Згорнути ▲' : 'Розгорнути ▼'}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="request-body-fields" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                                            <p style={{ color: '#374151', margin: '5px 0' }}><strong>Назва:</strong> {request.title}</p>
                                            <p style={{ color: '#374151', margin: '5px 0' }}><strong>Опис:</strong> {request.description || "Опис відсутній"}</p>
                                            <p style={{ color: '#374151', margin: '5px 0' }}><strong>Пріоритет:</strong> {getPriorityLabel(request.priority)}</p>

                                            <div className="department-selection-block" style={{ margin: '15px 0', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ color: '#1e3a8a', margin: '0 0 10px 0', fontSize: '14px' }}>🏢 Оберіть відділ(и) для передачі заявки:</h4>
                                                {departments.length === 0 ? (
                                                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Завантаження...</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                        {departments.map((dept) => {
                                                            const isChecked = chosenForThisRequest.includes(dept.id);
                                                            return (
                                                                <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: isChecked ? '#eff6ff' : '#fff', color: isChecked ? '#1d4ed8' : '#475569', padding: '6px 12px', borderRadius: '6px', border: isChecked ? '1px solid #93c5fd' : '1px solid #cbd5e1', fontSize: '13px', transition: 'all 0.2s' }}>
                                                                    <input type="checkbox" checked={isChecked} onChange={() => handleCheckboxChange(request.id, dept.id)} style={{ margin: 0 }}/>
                                                                    {dept.name}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="request-action-footer" style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                                    onClick={() => updateRequestStatus(request.id, 'REJECTED', 'PENDING')}
                                                >
                                                    ✕ Відхилити
                                                </button>
                                                <button
                                                    style={{ backgroundColor: chosenForThisRequest.length > 0 ? '#1e40af' : '#9ca3af', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'background-color 0.2s' }}
                                                    onClick={() => updateRequestStatus(request.id, 'APPROVED', 'PENDING')}
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

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0' }} />

            <div className="filter-zone" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: '700' }}>Фільтр за статусом:</span>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ backgroundColor: '#fff', color: '#1e3a8a', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                >
                    <option value="ALL">Всі заявки</option>
                    <option value="PENDING">Очікують (PENDING)</option>
                    <option value="APPROVED">Затверджені (APPROVED)</option>
                    <option value="IN_PROGRESS">В роботі (IN_PROGRESS)</option>
                    <option value="FULFILLED">Виконані (FULFILLED)</option>
                    <option value="REJECTED">Відхилені (REJECTED)</option>
                </select>
            </div>

            <div className="glass-main-request-panel">
                {(() => {
                    const filteredRequests = requests.filter(req =>
                        statusFilter === 'ALL' ? true : req.status === statusFilter
                    );

                    if (loadingRequests) {
                        return <p style={{ textAlign: 'center', color: '#1e3a8a', padding: '20px', fontWeight: '600' }}>Завантаження заявок...</p>;
                    }

                    if (filteredRequests.length === 0) {
                        return <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Заявок за цим критерієм не знайдено.</p>;
                    }

                    return filteredRequests.map((request) => {
                        const isExpanded = !!expandedRequests[request.id];
                        const sStyles = getStatusStyles(request.status);

                        return (
                            <div className="request-full-card" key={request.id} style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${sStyles.color}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                <div className="request-header-line" onClick={() => toggleExpand(request.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a8a', margin: '0 0 5px 0' }}>ЗАЯВКА №{request.id ? String(request.id).slice(0, 8).toUpperCase() : '---'}</h3>
                                        <span style={{ color: '#6b7280', fontSize: '14px' }}>Замовник: {request.customerName || 'Не вказано'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        {/* CSS FIX: Explicitly separated background styles to prevent React warnings */}
                                        <select
                                            value={request.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateRequestStatus(request.id, e.target.value, request.status)}
                                            style={{
                                                appearance: 'none',
                                                backgroundColor: sStyles.bg,
                                                color: sStyles.color,
                                                border: '1px solid transparent',
                                                padding: '4px 28px 4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${sStyles.color.replace('#', '')}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right .6rem top 50%',
                                                backgroundSize: '.65rem auto',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="APPROVED">APPROVED</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="FULFILLED">FULFILLED</option>
                                            <option value="REJECTED">REJECTED</option>
                                        </select>
                                        <button style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6' }} onClick={(e) => { e.stopPropagation(); toggleExpand(request.id); }}>
                                            {isExpanded ? 'Згорнути ▲' : 'Розгорнути ▼'}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="request-body-fields" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                                        <p style={{ color: '#374151', margin: '5px 0' }}><strong>Назва:</strong> {request.title}</p>
                                        <p style={{ color: '#374151', margin: '5px 0' }}><strong>Опис:</strong> {request.description || "Опис відсутній"}</p>
                                        <p style={{ color: '#374151', margin: '5px 0' }}><strong>Пріоритет:</strong> {getPriorityLabel(request.priority)}</p>

                                        {request.departments?.length > 0 && (
                                            <p style={{ color: '#374151', margin: '10px 0' }}>
                                                <strong>🏢 Відділи:</strong>
                                                {request.departments.map((dept, idx) => (
                                                    <span key={idx} style={{ display: 'inline-block', marginLeft: '8px', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{dept}</span>
                                                ))}
                                            </p>
                                        )}

                                        <div className="request-action-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}
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
                <div className="delete-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="delete-modal-card" style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '24px', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
                        <h3 style={{ textAlign: 'center', color: '#1e3a8a', marginTop: 0 }}>Остаточне видалення</h3>
                        <p style={{ textAlign: 'center', color: '#475569', fontSize: '14px' }}>Ви впевнені, що хочете видалити цю заявку? Цю дію не можна скасувати.</p>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', margin: '20px 0', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                            <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
                            Більше не попереджати в цій сесії
                        </label>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={closeDeleteModal} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>Скасувати</button>
                            <button onClick={confirmDeleteRequest} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Так, видалити</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}