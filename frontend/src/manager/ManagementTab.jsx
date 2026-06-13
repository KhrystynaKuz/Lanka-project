import React, { useState, useEffect } from 'react';
import './Manager.css';

export default function ManagementTab() {

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
    const [volunteerSearch, setVolunteerSearch] = useState('');

    const [allAvailableVolunteers, setAllAvailableVolunteers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [viewingVol, setViewingVol] = useState(null);
    const [volunteersLoading, setVolunteersLoading] = useState(false);
    const [volSearchTerm, setVolSearchTerm] = useState("");

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
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    useEffect(() => {
        const fetchVolunteers = async () => {
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
            }
        };

        fetchVolunteers();
    }, [selectedDept]);

    useEffect(() => {
        const fetchVolunteers = async () => {
            if (!selectedDept) return;

            setVolunteersLoading(true);
            try {
                const url = `http://localhost:8080/api/management/departments/${selectedDept.id}/volunteers`;
                const response = await fetch(url);
                const data = await response.json();
                setVolunteers(data);
            } catch (error) {
                console.error("Помилка:", error);
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
        setShowRejectModal(true);
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
            } else {
                const errorText = await response.text();
                console.error("Помилка сервера:", errorText);
                alert("Не вдалося створити відділ: " + errorText);
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
            alert("Помилка мережі. Перевірте з'єднання з сервером.");
        }
    };

    const handleDeleteDepartment = async () => {
        const isConfirmed = window.confirm("Ви впевнені, що хочете видалити цей відділ?")
        if (!isConfirmed) {
            return;
        }
        if (!editingDept || !editingDept.id) return;

        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${editingDept.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setDepartments(departments.filter(d => d.id !== editingDept.id));
                setIsEditModalOpen(false);
                setEditingDept(null);
            } else {
                console.error("Помилка при видаленні на сервері");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
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
            }
        } catch (error) {
            console.error("Помилка при збереженні:", error);
        }
    };

    const handleSetCoordinator = async (deptId, userId) => {
        if (!userId) return;

        const confirmChange = window.confirm("Ви впевнені, що хочете призначити нового координатора?");
        if (!confirmChange) return;

        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${deptId}/set-coordinator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userId)
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);

                setEditingDept(prev => ({
                    ...prev,
                    coordinatorId: userId
                }));
            } else {
                console.error("Помилка на сервері");
            }
        } catch (error) {
            console.error("Помилка мережі:", error);
        }
    };

    const handleOpenAddVolModal = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/management/volunteers');
            const data = await response.json();

            const allVolunteers = data.filter(u => u.role === 'VOLUNTEER');

            const alreadyInDeptIds = volunteers.map(v => v.id);

            const availableToAdd = allVolunteers.filter(v => !alreadyInDeptIds.includes(v.id));

            setAllAvailableVolunteers(availableToAdd);
            setShowAddVolModal(true);
        } catch (error) {
            console.error("Помилка при завантаженні списку:", error);
        }
    };

    const handleOpenVolInfo = async (vol) => {
        try {
            const response = await fetch(`http://localhost:8080/api/management/volunteers/${vol.id}/details`);
            const data = await response.json();
            setViewingVol(data);
        } catch (error) {
            console.error("Помилка завантаження деталей:", error);
        }
    };

    const handleDeptClick = async (dept) => {
        setSelectedDept(dept);

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

    const openEditModal = (dept) => {
        setEditingDept(dept);
        setIsEditModalOpen(true);
    };

    const removeVolunteer = async (userId) => {
        if (!window.confirm("Ви впевнені, що хочете видалити волонтера з відділу?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/management/departments/${selectedDept.id}/remove-volunteer?userId=${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setVolunteers(prev => prev.filter(v => v.id !== userId));
            } else {
                console.error("Сервер повернув помилку:", await response.text());
            }
        } catch (error) {
            console.error("Мережева помилка:", error);
        }
    };

    const fetchAllVolunteers = async () => {
        const res = await fetch('http://localhost:8080/api/management/volunteers');
        const data = await res.json();
        setAllAvailableVolunteers(data.filter(u => u.role === 'VOLUNTEER'));
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

            {/* ВЕРХНЯ ПАНЕЛЬ ПОШУКУ ЗАМОВНИКІВ */}
            <div className="glass-sub-section" style={{ marginBottom: '25px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h3 style={{ margin: 0, color: '#1e3a8a', minWidth: '120px', letterSpacing: '0.5px' }}>ЗАМОВНИКИ</h3>
                    <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="main-search-input"
                            placeholder="Пошук замовника..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                        <button className="main-search-btn" style={{ padding: '0 20px' }}>Пошук</button>
                    </div>
                </div>
            </div>

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

                                {/* Випадаючий список документів */}
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

                            {/* Розгорнуті документи */}
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

                    {/* Модальне вікно для додавання */}
                    {showAddDeptModal && (
                        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="modal-content" style={{ width: '450px', padding: '25px', background: '#fff', borderRadius: '12px' }}>
                                <div className="modal-header" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0 }}>Створити відділ</h3>
                                    <button className="modal-close" onClick={() => setShowAddDeptModal(false)}>✖</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <input
                                        type="text"
                                        className="main-search-input"
                                        style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }}
                                        placeholder="Назва відділу..."
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                    />

                                    <textarea
                                        className="main-search-input"
                                        style={{ width: '100%', height: '80px', padding: '12px', boxSizing: 'border-box', resize: 'none' }}
                                        placeholder="Короткий опис..."
                                        value={newDeptDescription}
                                        onChange={(e) => setNewDeptDescription(e.target.value)}
                                    />

                                    <select className="main-search-input" style={{ width: '100%', padding: '12px' }}>
                                        <option value="">Оберіть координатора...</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                                    <button
                                        className="dropdown-logout-btn"
                                        style={{ background: '#1e3a8a', padding: '10px 20px', cursor: 'pointer', border: 'none', color: '#fff', borderRadius: '6px' }}
                                        onClick={handleAddDepartment}
                                    >
                                        Зберегти
                                    </button>
                                    <button
                                        className="dropdown-logout-btn"
                                        style={{ background: '#6b7280', padding: '10px 20px', cursor: 'pointer', border: 'none', color: '#fff', borderRadius: '6px' }}
                                        onClick={() => setShowAddDeptModal(false)}
                                    >
                                        Скасувати
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isEditModalOpen && editingDept && (
                        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="modal-content" style={{ width: '450px', padding: '25px', background: '#fff', borderRadius: '12px' }}>
                                <h3>Редагування відділу</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                    <input type="text" className="main-search-input" value={editingDept.name} onChange={(e) => setEditingDept({...editingDept, name: e.target.value})} placeholder="Назва відділу" />
                                    <textarea className="main-search-input" value={editingDept.description} onChange={(e) => setEditingDept({...editingDept, description: e.target.value})} placeholder="Короткий опис" />

                                    <label style={{ fontSize: '13px', color: '#4b5563', marginBottom: '-10px' }}>Призначити координатора:</label>
                                    <select
                                        className="main-search-input"
                                        style={{ width: '100%', padding: '12px', cursor: 'pointer' }}
                                        value={editingDept.coordinatorId || ""}
                                        onChange={(e) => handleSetCoordinator(editingDept.id, e.target.value)}
                                        disabled={volunteers.length === 0}
                                    >
                                        <option value="">{volunteers.length === 0 ? "Немає волонтерів для призначення" : "Оберіть координатора..."}</option>
                                        {volunteers.map(vol => (
                                            <option key={vol.id} value={vol.id}>
                                                {vol.last_name} {vol.first_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                                    <button onClick={handleDeleteDepartment} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px' }}>Видалити</button>
                                    <button onClick={() => setIsEditModalOpen(false)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px' }}>Скасувати</button>
                                    <button onClick={handleSaveDepartment} style={{ background: '#1e3a8a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px' }}>Зберегти</button>
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
                                <button
                                    onClick={() => setSelectedDept(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#1e3a8a',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        textDecoration: 'underline'
                                    }}
                                >
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
                                            <button className="btn-delete-vol" onClick={(e) => { e.stopPropagation(); removeVolunteer(vol.id); }}>✕</button>
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

                    {viewingVol && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>Профіль волонтера</h3>

                                <div className="volunteer-info">
                                    <p><strong>ПІБ:</strong> {viewingVol.user.last_name} {viewingVol.user.first_name} {viewingVol.user.patronymic}</p>
                                    <p><strong>Email:</strong> {viewingVol.user.email}</p>
                                    <p><strong>Телефон:</strong> {viewingVol.user.phone_number}</p>
                                    <p><strong>Дата народження:</strong> {viewingVol.user.dob}</p>
                                    <p><strong>Роль:</strong> {viewingVol.user.role}</p>
                                </div>

                                <h4>Документи:</h4>
                                <ul>
                                    {viewingVol.documents.length > 0 ? (
                                        viewingVol.documents.map(doc => (
                                            <li key={doc.id}>
                                                📄 {doc.type} —
                                                <span style={{ color: doc.status === 'APPROVED' ? 'green' : 'orange' }}>
                                 {doc.status}
                            </span>
                                            </li>
                                        ))
                                    ) : (
                                        <li>Документи відсутні</li>
                                    )}
                                </ul>

                                <button className="btn-close-modal" onClick={() => setViewingVol(null)}>Закрити</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* МОДАЛЬНЕ ВІКНО: ПРИЧИНА ВІДМОВИ */}
            {showRejectModal && (
                <div className="modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="modal-content small-modal" style={{ width: '400px' }}>
                        <div className="modal-header">
                            <h3>Причина відмови</h3>
                            <button className="modal-close" onClick={() => setShowRejectModal(false)}>✖</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <textarea
                                className="main-search-input"
                                style={{ width: '100%', height: '100px', padding: '10px', boxSizing: 'border-box', resize: 'none', marginBottom: '15px' }}
                                placeholder="Вкажіть, що саме не так із наданими документами..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button className="dropdown-logout-btn" style={{ background: '#1e3a8a', width: 'auto', margin: 0, padding: '10px 20px' }} onClick={() => setShowRejectModal(false)}>Відправити</button>
                                <button className="dropdown-logout-btn" style={{ background: '#6b7280', width: 'auto', margin: 0, padding: '10px 20px' }} onClick={() => setShowRejectModal(false)}>Скасувати</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}