import React, { useState } from 'react';
import ManagementTab from './ManagementTab';
import RequestsTab from './RequestsTab';
import ChatsTab from '../components/chat/ChatsTab.jsx';
import ReportsTab from './ReportsTab';
import SiteEditorTab from './SiteEditorTab';
import InventoryTab from './InventoryTab';
import './Manager.css';

export default function Header({ onLogOut, onBackToHome }) {
    const [activeTab, setActiveTab] = useState('verification');
    const [showDropdown, setShowDropdown] = useState(false);

    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    const [showFullProfileModal, setShowFullProfileModal] = useState(false);
    const [fullUserData, setFullUserData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [editingDoc, setEditingDoc] = useState(null);
    const [loading, setLoading] = useState(false);

    // Об'єднаний стейт для редагування додаткових полів профілю
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editForm, setEditForm] = useState({
        phone_number: '',
        patronymic: '',
        dob: ''
    });

    const [uploadingFile, setUploadingFile] = useState(false);

    // --- СТЕЙТ ТА ФУНКЦІЯ ДЛЯ КАСТОМНИХ СПОВІЩЕНЬ (TOASTS) ---
    const [toasts, setToasts] = useState([]);

    const showNotification = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 4000);
    };

    const fetchFullProfile = async () => {
        if (!userId) {
            showNotification('🚨 ID користувача не знайдено', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/profile/full-info-by-id?userId=${userId}`);
            const data = await res.json();
            if (res.ok) {
                setFullUserData(data);
                setDocuments(data.documents || []);
                setShowFullProfileModal(true);
                showNotification('✨ Профіль успішно завантажено', 'success');
            } else {
                showNotification(`🚨 Помилка: ${data.error || JSON.stringify(data)}`, 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('🚨 Не вдалося завантажити дані користувача', 'error');
        }
        setLoading(false);
    };

    // Відкриття модалки редагування із передзаповненими поточними даними
    const openEditProfileModal = () => {
        setEditForm({
            phone_number: fullUserData?.phone_number || '',
            patronymic: fullUserData?.patronymic || '',
            dob: fullUserData?.dob || ''
        });
        setShowEditProfileModal(true);
    };

    // Функція відправки оновлених даних на бекенд
    const handleUpdateProfile = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/profile/update-details', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: fullUserData.id,
                    phone_number: editForm.phone_number,
                    patronymic: editForm.patronymic,
                    dob: editForm.dob
                })
            });

            const data = await res.json();

            if (res.ok) {
                showNotification('📝 Профіль успішно оновлено в БД', 'success');
                setShowEditProfileModal(false);
                fetchFullProfile(); // Перезавантажуємо інформацію для відображення змін
            } else {
                showNotification(`🚨 Помилка: ${data.error || 'Не вдалося зберегти дані'}`, 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('🚨 Сталася помилка при збереженні даних профілю', 'error');
        }
    };

    const deleteDocument = async (docId) => {
        if (!confirm('Видалити документ?')) return;
        try {
            const res = await fetch(`http://localhost:8080/api/profile/documents/delete?docId=${docId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showNotification('🗑️ Документ успішно видалено з БД', 'success');
                fetchFullProfile();
            } else {
                showNotification('🚨 Помилка видалення документа', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('🚨 Сталася помилка під час видалення', 'error');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);

        setTimeout(() => {
            showNotification(`📎 Файл "${file.name}" готовий до завантаження. Потрібен ендпоінт для збереження файлів.`, 'info');
            setUploadingFile(false);
        }, 1000);
    };

    return (
        <div className="admin-glass-container">
            {/* ─── КАНАЛ СПОВІЩЕНЬ ЧЕРЕЗ ЧИСТІ CSS КЛАСИ ─── */}
            <div className="toast-notifications-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-item toast-${toast.type}`}>
                        <span style={{ flexGrow: 1 }}>{toast.message}</span>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="toast-close-btn"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <header className="admin-glass-header">
                <div className="admin-header-left">
                    <div className="admin-logo" onClick={onBackToHome} style={{ cursor: 'pointer' }}>ЛАНКА</div>
                    <nav className="admin-nav-menu">
                        <button className={`admin-nav-btn ${activeTab === 'verification' ? 'active' : ''}`} onClick={() => setActiveTab('verification')}>Керування</button>
                        <button className={`admin-nav-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Заявки</button>
                        <button className={`admin-nav-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>Чати</button>
                        <button className={`admin-nav-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Звіти</button>
                        <button className={`admin-nav-btn ${activeTab === 'site' ? 'active' : ''}`} onClick={() => setActiveTab('site')}>Сайт</button>
                        <button className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Склад</button>
                    </nav>
                </div>

                <div className="admin-profile-zone">
                    <div className="admin-profile-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                    </div>
                    {showDropdown && (
                        <div className="admin-dropdown-menu">
                            <div className="dropdown-info">
                                {userRole === 'HEAD' ? 'Голова Організації' : userRole}
                            </div>
                            <button className="dropdown-info-btn" onClick={fetchFullProfile} disabled={loading}>
                                {loading ? 'Завантаження...' : 'Розширена інформація'}
                            </button>
                            <button className="dropdown-logout-btn" onClick={onLogOut}>Вийти</button>
                        </div>
                    )}
                </div>
            </header>

            <main className="admin-glass-content">
                {activeTab === 'verification' && <ManagementTab showNotification={showNotification} />}
                {activeTab === 'requests' && <RequestsTab showNotification={showNotification} />}
                {activeTab === 'chats' && <ChatsTab showNotification={showNotification} />}
                {activeTab === 'reports' && <ReportsTab showNotification={showNotification} />}
                {activeTab === 'site' && <SiteEditorTab showNotification={showNotification} />}
                {activeTab === 'inventory' && <InventoryTab showNotification={showNotification} />}
            </main>

            {showFullProfileModal && fullUserData && (
                <div className="modal-overlay" onClick={() => setShowFullProfileModal(false)}>
                    <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📄 Розширена інформація</h3>
                            <button className="modal-close" onClick={() => setShowFullProfileModal(false)}>✖</button>
                        </div>

                        <div className="modal-scrollable-content">
                            <div className="info-content">
                                <div className="info-row">
                                    <span className="info-label">👤 ПІБ:</span>
                                    <span className="info-value">
                            {fullUserData.lastName} {fullUserData.firstName} {fullUserData.patronymic || '—'}
                        </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">📧 Email:</span>
                                    <span className="info-value">{fullUserData.email}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">📞 Телефон:</span>
                                    <span className="info-value">{fullUserData.phone_number || 'Не вказано'}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">⭐ Роль:</span>
                                    <span className="info-value">{fullUserData.role}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">🎂 Дата народження:</span>
                                    <span className="info-value">{fullUserData.dob || 'Не вказано'}</span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label">📅 Дата реєстрації:</span>
                                    <span className="info-value">
                            {fullUserData.created_at ? new Date(fullUserData.created_at).toLocaleDateString() : 'Не вказано'}
                        </span>
                                </div>

                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <button className="edit-phone-btn" onClick={openEditProfileModal}>✏️ Редагувати дані</button>
                                </div>
                            </div>

                            <hr />

                            <div className="documents-section">
                                <h4>📁 Мої документи</h4>

                                <div className="file-upload-area">
                                    <label className="file-upload-label">
                                        📎 Завантажити файл (фото/PDF)
                                        <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploadingFile} style={{ display: 'none' }} />
                                    </label>
                                    {uploadingFile && <span className="upload-spinner">⏳ Завантаження...</span>}
                                </div>

                                {documents.length === 0 ? (
                                    <p className="no-docs">Немає документів</p>
                                ) : (
                                    <div className="documents-list">
                                        {documents.map(doc => (
                                            <div key={doc.id} className="document-card">
                                                <div className="doc-icon">📄</div>
                                                <div className="doc-info">
                                                    <div className="doc-title">{doc.title}</div>
                                                    {doc.content && <div className="doc-preview">{doc.content.substring(0, 50)}...</div>}
                                                    {doc.file_url && <div className="doc-file">📎 {doc.file_url}</div>}
                                                </div>
                                                <div className="doc-actions">
                                                    <button onClick={() => deleteDocument(doc.id)} className="doc-delete">🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button className="close-modal-btn" onClick={() => setShowFullProfileModal(false)}>
                            Закрити
                        </button>
                    </div>
                </div>
            )}

            {/* ОНОВЛЕНЕ МОДАЛЬНЕ ВІКНО ДЛЯ РЕДАГУВАННЯ ВСІХ ДОДАТКОВИХ ПОЛІВ ЧЕРЕЗ ОБ'ЄКТНИЙ СТЕЙТ */}
            {showEditProfileModal && (
                <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
                    <div className="modal-content small-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Редагування профілю</h3>
                            <button className="modal-close" onClick={() => setShowEditProfileModal(false)}>✖</button>
                        </div>
                        <div className="phone-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>По-батькові:</label>
                                <input
                                    type="text"
                                    placeholder="Введіть по-батькові"
                                    value={editForm.patronymic}
                                    onChange={e => setEditForm({...editForm, patronymic: e.target.value})}
                                    className="phone-input"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Номер телефону:</label>
                                <input
                                    type="tel"
                                    placeholder="+380 XX XXX XXXX"
                                    value={editForm.phone_number}
                                    onChange={e => setEditForm({...editForm, phone_number: e.target.value})}
                                    className="phone-input"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Дата народження:</label>
                                <input
                                    type="date"
                                    value={editForm.dob}
                                    onChange={e => setEditForm({...editForm, dob: e.target.value})}
                                    className="phone-input"
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div className="phone-form-actions" style={{ marginTop: '10px' }}>
                                <button onClick={handleUpdateProfile} className="save-phone-btn">Зберегти</button>
                                <button onClick={() => setShowEditProfileModal(false)} className="cancel-phone-btn">Скасувати</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}