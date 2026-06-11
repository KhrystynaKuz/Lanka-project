import React, { useState } from 'react';
import './Manager.css';

export default function ManagementTab() {
    // Стани для списків та пошуку
    const [customerSearch, setCustomerSearch] = useState('');
    const [expandedUser, setExpandedUser] = useState(null); // ID розгорнутого користувача для документів
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Імітація даних для верифікації
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

            {/* НИЖНІ СЕКЦІЇ: ВІДДІЛИ ТА ВОЛОНТЕРИ */}
            <div className="grid-split-sections">
                <div className="glass-sub-section" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="sub-section-header">
                        <h3>ВІДДІЛИ</h3>
                        <div className="search-bar-mini">
                            <input type="text" placeholder="Пошук відділу..."/> 🔍
                        </div>
                    </div>
                    <div className="list-items-box" style={{ flex: 1, minHeight: '150px' }}>
                        <div className="list-item">Медичний відділ</div>
                        <div className="list-item">Гуманітарний відділ</div>
                        <div className="list-item">Технічний відділ</div>
                    </div>
                    <button className="btn-add-new-item" style={{ marginTop: '15px' }}>Додати відділ</button>
                </div>

                <div className="glass-sub-section" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="sub-section-header">
                        <h3>ВОЛОНТЕРИ</h3>
                        <div className="search-bar-mini">
                            <input type="text" placeholder="Пошук волонтера..."/> 🔍
                        </div>
                    </div>
                    <div className="list-items-box" style={{ flex: 1, minHeight: '150px' }}>
                        <div className="list-item">Дмитро Литвин</div>
                        <div className="list-item">Анна Сидоренко</div>
                        <div className="list-item">Максим Мороз</div>
                    </div>
                    <button className="btn-add-new-item" style={{ marginTop: '15px' }}>Додати волонтера</button>
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