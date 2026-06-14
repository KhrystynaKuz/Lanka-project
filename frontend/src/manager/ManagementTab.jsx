import React, { useState, useEffect } from 'react';
import './Manager.css';

export default function ManagementTab({ showNotification }) {

    const [customerSearch, setCustomerSearch] = useState('');
    const [expandedUser, setExpandedUser] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddDeptModal, setShowAddDeptModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptDescription, setNewDeptDescription] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deptSearch, setDeptSearch] = useState('');

    const [selectedDept, setSelectedDept] = useState(null);

    const [volunteers, setVolunteers] = useState([]);
    const [showAddVolModal, setShowAddVolModal] = useState(false);
    const [allAvailableVolunteers, setAllAvailableVolunteers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [viewingVol, setViewingVol] = useState(null);
    const [volunteersLoading, setVolunteersLoading] = useState(false);
    const [volSearchTerm, setVolSearchTerm] = useState("");

    const [customers, setCustomers] = useState([]);
    const [viewingCustomer, setViewingCustomer] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        text: '',
        icon: '⚠️',
        onConfirm: null
    });

    const closeConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            title: '',
            text: '',
            icon: '⚠️',
            onConfirm: null
        });
    };

    const fetchCustomers = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/management/customers');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Помилка завантаження замовників');
            }

            const data = await response.json();
            setCustomers(data);
        } catch (err) {
            console.error("Помилка завантаження замовників:", err.message);
            if (showNotification) showNotification(`🚨 ${err.message}`, "error");
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:8080/api/management/departments');
                if (!response.ok) throw new Error('Помилка сервера');
                const data = await response.json();
                setDepartments(data);
            } catch (error) {
                console.error("Помилка:", error);
                if (showNotification) showNotification("🚨 Помилка завантаження відділів", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    useEffect(() => {
        const fetchVolunteers = async () => {
            setVolunteersLoading(true);
            let url = 'http://localhost:8080/api/management/volunteers';

            if (selectedDept) {
                url = `http://localhost:8080/api/management/departments/${selectedDept.id}/volunteers`;
            }

            try {
                const response = await fetch(url);
                const data = await response.json();
                setVolunteers(data);
            } catch (error) {
                console.error("Помилка завантаження волонтерів:", error);
                if (showNotification) showNotification("🚨 Помилка завантаження волонтерів", "error");
            } finally {
                setVolunteersLoading(false);
            }
        };

        fetchVolunteers();
    }, [selectedDept]);

    const verificationList = [
        { id: 'USR-7721', name: 'Олександр Ковальчук', info: 'Заявка на волонтерство (водій)', docs: ['Паспорт.jpg', 'Посвідчення.pdf'] },
        { id: 'ORG-0042', name: 'БФ "Світло Надії"', info: 'Організація (Замовник)', docs: ['Витяг_ЄДР.pdf', 'Статут.pdf'] }
    ];

    const toggleDocs = (id) => {
        setExpandedUser(expandedUser === id ? null : id);
    };

    const handleReject = () => {
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleSendRejectReason = () => {
        if (!rejectReason.trim()) return;
        setShowRejectModal(false);
        if (showNotification) showNotification("🛑 Відмову надіслано успішно", "info");
    };

    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) return;

        const newDeptData = {
            name: newDeptName,
            description: newDeptDescription
        };

        try {
            const response = await fetch('http://localhost:8080/api/management/departments/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDeptData)
            });

            if (response.ok) {
                const createdDept = await response.json();
                setDepartments(prev => [...prev, createdDept]);

                setNewDeptName('');
                setNewDeptDescription('');
                setShowAddDeptModal(false);
                if (showNotification) showNotification("✅ Відділ успішно створено!", "success");
            } else {
                const errorText = await response.text();
                console.error("Помилка сервера:", errorText);
                if (showNotification) showNotification(`🚨 Не вдалося створити відділ: ${errorText}`, "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
            if (showNotification) showNotification("🚨 Помилка мережі. Перевірте з'єднання.", "error");
        }
    };

    const handleDeleteDepartmentClick = () => {
        if (!editingDept || !editingDept.id) return;

        setConfirmModal({
            isOpen: true,
            title: 'Видалення відділу',
            text: 'Ви впевнені, що хочете видалити цей відділ? Цю дію не можна скасувати.',
            icon: '🗑️',
            onConfirm: () => executeDeleteDepartment()
        });
    };

    const executeDeleteDepartment = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${editingDept.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setDepartments(departments.filter(d => d.id !== editingDept.id));
                setIsEditModalOpen(false);
                setEditingDept(null);
                if (showNotification) showNotification("🗑️ Відділ успішно видалено", "success");
            } else {
                if (showNotification) showNotification("🚨 Помилка при видаленні відділу", "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        } finally {
            closeConfirmModal();
        }
    };

    const handleSaveDepartment = async () => {
        if (!editingDept) return;

        try {
            const response = await fetch('http://localhost:8080/api/management/departments/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingDept)
            });

            if (response.ok) {
                setDepartments(departments.map(d => d.id === editingDept.id ? editingDept : d));
                setIsEditModalOpen(false);
                if (showNotification) showNotification("💾 Зміни відділу збережено", "success");
            }
        } catch (error) {
            console.error("Помилка при збереженні:", error);
        }
    };

    const handleSetCoordinatorClick = (deptId, userId) => {
        if (!userId) return;

        setConfirmModal({
            isOpen: true,
            title: 'Призначення координатора',
            text: 'Ви впевнені, що хочете призначити нового координатора для цього відділу?',
            icon: '👤',
            onConfirm: () => executeSetCoordinator(deptId, userId)
        });
    };

    const executeSetCoordinator = async (deptId, userId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${deptId}/set-coordinator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userId)
            });

            if (response.ok) {
                const data = await response.json();
                if (showNotification) showNotification(`✅ ${data.message}`, "success");

                setEditingDept(prev => ({
                    ...prev,
                    coordinatorId: userId
                }));

                const volunteersResponse = await fetch('http://localhost:8080/api/management/volunteers');
                if (volunteersResponse.ok) {
                    const updatedVolunteers = await volunteersResponse.json();
                    setVolunteers(updatedVolunteers);
                }
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        } finally {
            closeConfirmModal();
        }
    };

    const handleOpenAddVolModal = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/management/volunteers');
            const data = await response.json();

            const alreadyInDeptIds = volunteers.map(v => v.id);
            const availableToAdd = data.filter(v => !alreadyInDeptIds.includes(v.id));

            setAllAvailableVolunteers(availableToAdd);
            setSelectedUserId('');
            setShowAddVolModal(true);
        } catch (error) {
            console.error("Помилка при завантаженні списку волонтерів:", error);
            if (showNotification) showNotification("🚨 Помилка завантаження списку волонтерів", "error");
        }
    };

    const handleAddVolunteerToDept = async () => {
        if (!selectedUserId || !selectedDept) return;

        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${selectedDept.id}/add-volunteer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedUserId)
            });

            if (response.ok) {
                const addedVol = allAvailableVolunteers.find(v => v.id === selectedUserId);
                if (addedVol) {
                    setVolunteers(prev => [...prev, addedVol]);
                }
                setShowAddVolModal(false);
                if (showNotification) showNotification("👤 Волонтера успішно додано до відділу!", "success");
            } else {
                if (showNotification) showNotification("🚨 Не вдалося додати волонтера", "error");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        }
    };

    const handleOpenVolInfo = async (vol) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/volunteers/${vol.id}/details`);
            const data = await response.json();
            setViewingVol(data);
        } catch (error) {
            console.error("Помилка завантаження деталей:", error);
            if (showNotification) showNotification("🚨 Помилка завантаження деталей волонтера", "error");
        }
    };

    const handleOpenCustomerInfo = async (customer) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/customers/${customer.id}/details`);
            if (!response.ok) throw new Error('Не вдалося завантажити деталі');
            const data = await response.json();

            setViewingCustomer(data);
        } catch (error) {
            console.error("Помилка завантаження деталей замовника:", error);
            if (showNotification) showNotification("🚨 Помилка завантаження деталей", "error");
        }
    };

    const handleDeptClick = async (dept) => {
        setSelectedDept(dept);

        setShowAddVolModal(false);

        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${dept.id}/coordinator`);
            let coordId = null;

            if (response.ok) {
                const text = await response.text();
                if (text && text !== "") {
                    coordId = text.replace(/"/g, '');
                }
            }
            setEditingDept({ ...dept, coordinatorId: coordId });
            setIsEditModalOpen(true);
        } catch (e) {
            console.error("Помилка завантаження координатора:", e);
            setEditingDept({ ...dept, coordinatorId: null });
            setIsEditModalOpen(true);
        }
    };

    const handleRemoveVolunteerClick = (userId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Видалення волонтера',
            text: 'Ви впевнені, що хочете видалити волонтера з цього відділу?',
            icon: '⚠️',
            onConfirm: () => executeRemoveVolunteer(userId)
        });
    };

    const executeRemoveVolunteer = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${selectedDept.id}/remove-volunteer?userId=${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setVolunteers(prev => prev.filter(v => v.id !== userId));
                if (showNotification) showNotification("👤 Волонтера видалено з відділу", "success");
            }
        } catch (error) {
            console.error("Мережева помилка:", error);
        } finally {
            closeConfirmModal();
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().startsWith(deptSearch.toLowerCase())
    );

    const filteredVolunteers = volunteers.filter(vol =>
        vol.last_name.toLowerCase().startsWith(volSearchTerm.toLowerCase()) ||
        vol.first_name.toLowerCase().startsWith(volSearchTerm.toLowerCase())
    );

    return (
        <div className="admin-tab-content fade-in">

            {/* СЕКЦІЯ ВЕРИФІКАЦІЇ */}
            <div className="glass-sub-section" style={{ marginBottom: '25px' }}>
                <h3 className="tab-title" style={{ fontSize: '20px', marginBottom: '15px' }}>Верифікація</h3>

                <div className="verification-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '10px 20px', color: '#1e40af', fontWeight: 'bold', fontSize: '14px' }}>
                    <span>Код та користувач</span>
                    <span>ПІБ / Додаткова інформація</span>
                    <span>Документи</span>
                    <span style={{ textAlign: 'right' }}>Дії</span>
                </div>

                <div className="verification-list-container">
                    {verificationList.map(user => (
                        <div key={user.id} className="verif-row-wrapper" style={{ borderBottom: '1px solid rgba(30, 58, 138, 0.1)', marginBottom: '10px' }}>
                            <div className="verification-row" style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr 1fr 1fr',
                                padding: '15px 20px',
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.3)',
                                borderRadius: '10px'
                            }}>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>{user.id}</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '700', color: '#1e3a8a' }}>{user.name}</span>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{user.info}</span>
                                </div>

                                <div onClick={() => toggleDocs(user.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ border: '1px solid #1e3a8a', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: '600', color: '#1e3a8a' }}>
                                        {user.docs.length} Документи ⌄
                                    </div>
                                </div>

                                <div className="action-buttons-side" style={{ justifyContent: 'flex-end' }}>
                                    <button className="btn-action-circle approve" title="Підтвердити">✓</button>
                                    <button className="btn-action-circle reject" onClick={handleReject} title="Відхилити">✕</button>
                                </div>
                            </div>

                            {expandedUser === user.id && (
                                <div className="docs-dropdown fade-in" style={{ padding: '10px 40px', background: 'rgba(30, 58, 138, 0.05)', borderRadius: '0 0 10px 10px' }}>
                                    {user.docs.map((doc, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px', color: '#2563eb', alignItems: 'center' }}>
                                            <span>📄 {doc}</span>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontWeight: 'bold' }} title="Затвердити цей документ">Затвердити</button>
                                                <button style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleReject} title="Відхилити цей документ">Відхилити</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* НИЖНІ СЕКЦІЇ */}
            <div className="grid-split-sections" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

                {/* Блок ВІДДІЛИ */}
                <div className="glass-sub-section" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                    <div className="sub-section-header">
                        <h3>ВІДДІЛИ</h3>
                        <div className="search-bar-mini">
                            <input
                                type="text"
                                placeholder="Пошук відділу..."
                                value={deptSearch}
                                onChange={(e) => setDeptSearch(e.target.value)}
                            /> 🔍
                        </div>
                    </div>

                    <div className="list-items-box" style={{ flex: 1, padding: '10px 0' }}>
                        {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept) => (
                                <div
                                    key={dept.id}
                                    className="list-item"
                                    onClick={() => handleDeptClick(dept)}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedDept?.id === dept.id ? 'rgba(30, 58, 138, 0.2)' : 'transparent',
                                        transition: 'background 0.2s ease'
                                    }}
                                >
                                    {dept.name}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '10px', color: '#6b7280' }}>Нічого не знайдено</div>
                        )}
                    </div>
                    <button
                        className="btn-add-new-item"
                        style={{ marginTop: '15px' }}
                        onClick={() => setShowAddDeptModal(true)}
                    >
                        Додати відділ
                    </button>

                    {/* Модальне вікно для додавання ВІДДІЛУ */}
                    {showAddDeptModal && (
                        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(4px)' }}>
                            <div className="modal-content" style={{ width: '480px', padding: 0, background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
                                <div className="modal-header" style={{ background: '#3b82f6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        📁 Створити відділ
                                    </h3>
                                    <button className="modal-close" onClick={() => setShowAddDeptModal(false)} style={{ background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                                </div>

                                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '18px', padding: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Назва відділу:</label>
                                        <input
                                            type="text"
                                            className="main-search-input"
                                            style={{ width: '100%', padding: '14px 16px', boxSizing: 'border-box', background: '#f0f7ff', border: '1px solid #cbd5e1', borderRadius: '14px', fontSize: '15px' }}
                                            placeholder="Введіть назву..."
                                            value={newDeptName}
                                            onChange={(e) => setNewDeptName(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Короткий опис:</label>
                                        <textarea
                                            className="main-search-input"
                                            style={{ width: '100%', height: '120px', padding: '14px 16px', boxSizing: 'border-box', resize: 'none', background: '#f0f7ff', border: '1px solid #cbd5e1', borderRadius: '14px', fontSize: '15px' }}
                                            placeholder="Опишіть діяльність відділу..."
                                            value={newDeptDescription}
                                            onChange={(e) => setNewDeptDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '0 24px 24px 24px' }}>
                                    <button style={{ background: '#3b82f6', padding: '12px 32px', cursor: 'pointer', border: 'none', color: '#fff', borderRadius: '14px', fontSize: '15px', fontWeight: '600' }} onClick={handleAddDepartment}>Зберегти</button>
                                    <button style={{ background: '#eff6ff', padding: '12px 32px', cursor: 'pointer', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: '14px', fontSize: '15px', fontWeight: '600' }} onClick={() => setShowAddDeptModal(false)}>Скасувати</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Модальне вікно для редагування ВІДДІЛУ */}
                    {isEditModalOpen && editingDept && (
                        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(4px)' }}>
                            <div className="modal-content" style={{ width: '480px', padding: 0, background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none' }}>
                                <div className="modal-header" style={{ background: '#3b82f6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600' }}>✏️ Редагування відділу</h3>
                                    <button className="modal-close" onClick={() => setIsEditModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Назва відділу:</label>
                                        <input type="text" className="main-search-input" style={{ width: '100%', padding: '14px 16px', boxSizing: 'border-box', background: '#f0f7ff', border: '1px solid #cbd5e1', borderRadius: '14px' }} value={editingDept.name} onChange={(e) => setEditingDept({...editingDept, name: e.target.value})} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Короткий опис:</label>
                                        <textarea className="main-search-input" style={{ width: '100%', height: '80px', padding: '14px 16px', boxSizing: 'border-box', resize: 'none', background: '#f0f7ff', border: '1px solid #cbd5e1', borderRadius: '14px' }} value={editingDept.description} onChange={(e) => setEditingDept({...editingDept, description: e.target.value})} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Призначити координатора:</label>
                                        <select
                                            className="main-search-input"
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                cursor: volunteers.length === 0 ? 'not-allowed' : 'pointer',
                                                background: volunteers.length === 0 ? '#f3f4f6' : '#f0f7ff',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '14px',
                                                color: volunteers.length === 0 ? '#9ca3af' : '#1f2937'
                                            }}
                                            value={editingDept.coordinatorId || ""}
                                            onChange={(e) => handleSetCoordinatorClick(editingDept.id, e.target.value)}
                                            disabled={volunteers.length === 0}
                                        >
                                            <option value="" disabled>
                                                {volunteers.length === 0 ? "📌 Немає волонтерів для призначення" : "Оберіть координатора"}
                                            </option>
                                            {volunteers.map(vol => (
                                                <option key={vol.id} value={vol.id}>
                                                    {vol.last_name} {vol.first_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', padding: '0 24px 24px 24px' }}>
                                    <button onClick={handleDeleteDepartmentClick} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '12px 20px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Видалити</button>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setIsEditModalOpen(false)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px 28px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Скасувати</button>
                                        <button onClick={handleSaveDepartment} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Зберегти</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Блок ВОЛОНТЕРИ */}
                <div className="glass-sub-section" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                    <div className="sub-section-header">
                        <h3>
                            {selectedDept ? `ВОЛОНТЕРИ: ${selectedDept.name}` : "ВСІ ВОЛОНТЕРИ"}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {selectedDept && (
                                <button onClick={() => setSelectedDept(null)} style={{ background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
                                    [ Показати всіх ]
                                </button>
                            )}

                            <div className="search-bar-mini">
                                <input
                                    type="text"
                                    placeholder="Пошук волонтера..."
                                    value={volSearchTerm}
                                    onChange={(e) => setVolSearchTerm(e.target.value)}
                                /> 🔍
                            </div>
                        </div>
                    </div>

                    <div className="list-items-box" style={{ flex: 1, padding: '10px 0' }}>
                        {volunteersLoading ? (
                            <div style={{ padding: '20px', textAlign: 'center' }}>Завантаження...</div>
                        ) : (
                            filteredVolunteers.length > 0 ? (
                                filteredVolunteers.map(vol => (
                                    <div key={vol.id} className="vol-list-item" onClick={() => handleOpenVolInfo(vol)}>
                                        <span>{vol.last_name} {vol.first_name}</span>
                                        {selectedDept && (
                                            <button className="btn-delete-vol" onClick={(e) => { e.stopPropagation(); handleRemoveVolunteerClick(vol.id); }}>✕</button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '20px', color: '#6b7280', textAlign: 'center' }}>
                                    {volSearchTerm ? "Нічого не знайдено" : "У цьому відділі поки немає волонтерів"}
                                </div>
                            )
                        )}
                    </div>

                    {selectedDept && (
                        <button className="btn-add-new-item" onClick={handleOpenAddVolModal}>
                            Додати до відділу
                        </button>
                    )}

                    {/* Модальне вікно: ДОДАТИ ВОЛОНТЕРА ДО ВІДДІЛУ (БЕЗ ПОШУКУ) */}
                    {showAddVolModal && (
                        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(4px)' }}>
                            <div className="modal-content" style={{ width: '480px', padding: 0, background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                                <div className="modal-header" style={{ background: '#3b82f6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '600' }}>➕ Додати волонтера до відділу</h3>
                                    <button className="modal-close" onClick={() => setShowAddVolModal(false)} style={{ background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                                </div>
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Оберіть волонтера зі списку:</label>
                                        <select
                                            className="main-search-input"
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            style={{ width: '100%', padding: '14px 16px', background: '#f0f7ff', border: '1px solid #cbd5e1', borderRadius: '14px', cursor: 'pointer', fontSize: '15px' }}
                                        >
                                            <option value="">Виберіть волонтера</option>
                                            {allAvailableVolunteers.length === 0 ? (
                                                <option value="" disabled>Немає доступних волонтерів</option>
                                            ) : (
                                                allAvailableVolunteers.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.last_name} {v.first_name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {allAvailableVolunteers.length === 0 && (
                                            <div style={{ fontSize: '13px', color: '#dc2626', marginTop: '8px', textAlign: 'center' }}>
                                                ⚠️ Немає доступних волонтерів для додавання
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '0 24px 24px 24px' }}>
                                    <button onClick={handleAddVolunteerToDept} disabled={!selectedUserId || allAvailableVolunteers.length === 0} style={{ background: selectedUserId && allAvailableVolunteers.length > 0 ? '#3b82f6' : '#94a3b8', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', cursor: selectedUserId && allAvailableVolunteers.length > 0 ? 'pointer' : 'not-allowed' }}>Додати</button>
                                    <button onClick={() => setShowAddVolModal(false)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px 28px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Скасувати</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Модальне вікно: ПРОФІЛЬ ВОЛОНТЕРА */}
                    {viewingVol && (
                        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(4px)' }}>
                            <div className="modal-content" style={{ width: '520px', padding: 0, background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                                <div className="modal-header" style={{ background: '#3b82f6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600' }}>📄 Розширена інформація</h3>
                                    <button onClick={() => setViewingVol(null)} style={{ background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    <div style={{ background: '#f0f7ff', border: '1px solid #cbd5e1', borderRadius: '18px', padding: '8px 16px' }}>
                                        <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>👤 ПІБ:</strong> {viewingVol.user.last_name} {viewingVol.user.first_name} {viewingVol.user.patronymic}</p>
                                        <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>✉️ Email:</strong> {viewingVol.user.email}</p>
                                        <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>📞 Телефон:</strong> {viewingVol.user.phone_number}</p>
                                        <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>🎂 Д.Н.:</strong> {viewingVol.user.dob}</p>
                                        <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>⭐ Роль:</strong> <span style={{ background: viewingVol.user.role === 'COORDINATOR' ? '#f59e0b' : '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>{viewingVol.user.role === 'COORDINATOR' ? 'Координатор' : 'Волонтер'}</span></p>
                                    </div>

                                    <h4 style={{ margin: '20px 0 10px 0', color: '#1e3a8a' }}>📂 Документи волонтера</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {viewingVol.documents && viewingVol.documents.length > 0 ? (
                                            viewingVol.documents.map(doc => (
                                                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px' }}>
                                                    <span>📄 {doc.type}</span>
                                                    <span style={{ fontWeight: '700', color: doc.status === 'APPROVED' ? 'green' : 'orange' }}>{doc.status}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', borderRadius: '12px', color: '#64748b' }}>Документи відсутні</div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 24px 24px' }}>
                                    <button onClick={() => setViewingVol(null)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px 40px', borderRadius: '14px', fontWeight: '600', cursor: 'pointer' }}>Закрити</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showRejectModal && (
                <div className="custom-reject-overlay">
                    <div className="custom-reject-card">
                        <div className="custom-reject-header">
                            <h3 className="custom-reject-title">🛑 Причина відмови</h3>
                            <button className="custom-reject-close" onClick={() => setShowRejectModal(false)}>✕</button>
                        </div>
                        <div className="custom-reject-body">
                            <textarea
                                className="custom-reject-textarea"
                                placeholder="Вкажіть, що саме не так із наданими документами..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                        <div className="custom-reject-actions">
                            <button className="btn-reject-submit" onClick={handleSendRejectReason}>Відправити</button>
                            <button className="btn-reject-cancel" onClick={() => setShowRejectModal(false)}>Скасувати</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.isOpen && (
                <div className="custom-confirm-overlay">
                    <div className="custom-confirm-card">
                        <div className="custom-confirm-icon">{confirmModal.icon}</div>
                        <h3 className="custom-confirm-title">{confirmModal.title}</h3>
                        <p className="custom-confirm-text">{confirmModal.text}</p>
                        <div className="custom-confirm-actions">
                            <button className="btn-confirm-cancel" onClick={closeConfirmModal}>Скасувати</button>
                            <button
                                className={`btn-confirm-execute ${confirmModal.title.toLowerCase().includes('видал') ? 'danger-action' : ''}`}
                                onClick={confirmModal.onConfirm}
                            >
                                Так, виконати
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Секція Замовників */}
            <div className="glass-sub-section" style={{ marginTop: '40px', marginBottom: '25px', padding: '20px' }}>
                <div className="sub-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>ЗАМОВНИКИ ({customers.filter(c => c.last_name?.toLowerCase().startsWith(customerSearch.toLowerCase())).length})</h3>

                    <div className="search-bar-mini">
                    <input
                        type="text"
                        placeholder="Пошук (за прізвищем)..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            outline: 'none',
                            width: '200px'
                        }}
                    /> 🔍
                    </div>
                </div>

                <div className="list-items-box" style={{ padding: '10px 0', maxHeight: '300px', overflowY: 'auto' }}>
                    {customers
                        .filter(c => c.last_name?.toLowerCase().startsWith(customerSearch.toLowerCase()))
                        .map(customer => (
                            <div
                                key={customer.id}
                                className="list-item"
                                onClick={() => handleOpenCustomerInfo(customer)}
                                style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #f1f5f9' }}
                            >
                                {customer.last_name} {customer.first_name}
                            </div>
                        ))
                    }
                </div>

                {viewingCustomer && (
                    <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(4px)' }}>
                        <div className="modal-content" style={{ width: '520px', padding: 0, background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                            <div className="modal-header" style={{ background: '#3b82f6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '600' }}>👤 Профіль замовника</h3>
                                <button onClick={() => setViewingCustomer(null)} style={{ background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                            </div>

                            <div style={{ padding: '24px' }}>
                                {/* Тепер використовуємо viewingCustomer.user */}
                                <div style={{ background: '#f0f7ff', border: '1px solid #cbd5e1', borderRadius: '18px', padding: '16px' }}>
                                    <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>👤 ПІБ:</strong> {viewingCustomer.user.last_name} {viewingCustomer.user.first_name} {viewingCustomer.user.patronymic}</p>
                                    <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>📞 Телефон:</strong> {viewingCustomer.user.phone_number || 'Не вказано'}</p>
                                    <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>🎂 Дата народження:</strong> {viewingCustomer.user.dob || 'Не вказано'}</p>
                                    <p style={{ margin: '10px 0', fontSize: '15px' }}><strong>✉️ Email:</strong> {viewingCustomer.user.email}</p>
                                </div>

                                <h4 style={{ margin: '20px 0 10px 0', color: '#1e3a8a' }}>📂 Документи замовника</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {viewingCustomer.documents && viewingCustomer.documents.length > 0 ? (
                                        viewingCustomer.documents.map(doc => (
                                            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px' }}>
                                                <span>📄 {doc.type}</span>
                                                <span style={{ fontWeight: '700', color: doc.status === 'APPROVED' ? 'green' : 'orange' }}>{doc.status}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', borderRadius: '12px', color: '#64748b' }}>Документи відсутні</div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 24px 24px' }}>
                                <button onClick={() => setViewingCustomer(null)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px 40px', borderRadius: '14px', fontWeight: '600', cursor: 'pointer' }}>Закрити</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}