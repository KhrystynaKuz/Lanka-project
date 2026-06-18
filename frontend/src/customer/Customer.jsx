import React, { useState } from 'react';
import CreateRequestTab from './CreateRequestTab';
import MyRequestsTab from './MyRequestsTab';
import ChatsTab from '../components/chat/ChatsTab.jsx';
import './Customer.css';
import { API_BASE_URL } from '.App';

/**
 * Головний компонент панелі замовника.
 * Відповідає за навігацію між вкладками (створення заявки, мої заявки, чати),
 * керування профілем користувача, завантаження/видалення документів
 * та редагування особистих даних.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.onLogOut - Функція виходу з облікового запису.
 * @returns {JSX.Element} Рендер панелі замовника.
 */
export default function Customer({ onLogOut }) {
    const [activeTab, setActiveTab] = useState('create_request');
    const [showDropdown, setShowDropdown] = useState(false);

    const [showFullProfileModal, setShowFullProfileModal] = useState(false);
    const [fullUserData, setFullUserData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editForm, setEditForm] = useState({
        phone_number: '',
        patronymic: '',
        dob: ''
    });

    const [uploadingFile, setUploadingFile] = useState(false);
    const [toasts, setToasts] = useState([]);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        text: '',
        icon: '⚠️',
        onConfirm: null
    });

    const currentUserId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    /**
     * Показує сповіщення (тост) користувачеві.
     *
     * @param {string} message - Текст повідомлення.
     * @param {string} [type='info'] - Тип сповіщення ('info', 'success', 'error').
     */
    const showNotification = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 4000);
    };

    /**
     * Закриває модальне вікно підтвердження.
     */
    const closeConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            title: '',
            text: '',
            icon: '⚠️',
            onConfirm: null
        });
    };

    /**
     * Завантажує повну інформацію про користувача з бекенду.
     * У разі успіху відкриває модальне вікно з даними.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchFullProfile = async () => {
        if (!currentUserId) {
            showNotification('🚨 ID користувача не знайдено', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/profile/full-info-by-id?userId=${currentUserId}`);
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

    /**
     * Відкриває модальне вікно редагування профілю
     * та попередньо заповнює форму наявними даними.
     */
    const openEditProfileModal = () => {
        setEditForm({
            phone_number: fullUserData?.phone_number || '',
            patronymic: fullUserData?.patronymic || '',
            dob: fullUserData?.dob || ''
        });
        setShowEditProfileModal(true);
    };

    /**
     * Надсилає оновлені дані профілю на бекенд.
     * У разі успіху оновлює відображення профілю.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleUpdateProfile = async () => {
        try {
            const res = await fetch('${API_BASE_URL}/api/profile/update-details', {
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
                fetchFullProfile();
            } else {
                showNotification(`🚨 Помилка: ${data.error || 'Не вдалося зберегти дані'}`, 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('🚨 Сталася помилка при збереженні даних профілю', 'error');
        }
    };

    /**
     * Відкриває кастомне модальне вікно для підтвердження видалення документа.
     *
     * @param {string|number} docId - Ідентифікатор документа.
     */
    const deleteDocument = (docId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Видалення документа',
            text: 'Ви впевнені, що хочете видалити цей документ? Цю дію не можна скасувати.',
            icon: '🗑️',
            onConfirm: () => executeDeleteDocument(docId)
        });
    };

    /**
     * Виконує видалення документа після підтвердження.
     *
     * @async
     * @param {string|number} docId - Ідентифікатор документа.
     * @returns {Promise<void>}
     */
    const executeDeleteDocument = async (docId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/profile/documents/delete?docId=${docId}`, {
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
        } finally {
            closeConfirmModal();
        }
    };

    /**
     * Обробляє вибір файлу для завантаження.
     * Відправляє файл на бекенд разом з ідентифікатором користувача.
     *
     * @async
     * @param {Event} e - Подія вибору файлу з елемента input.
     * @returns {Promise<void>}
     */
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', currentUserId);
        formData.append('title', file.name);

        try {
            const res = await fetch(`${API_BASE_URL}/api/profile/registration/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                showNotification('✅ Документ успішно завантажено', 'success');
                fetchFullProfile();
            } else {
                const errData = await res.json();
                showNotification(`🚨 Помилка: ${errData.error || 'Не вдалося завантажити файл'}`, 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('🚨 Сталася помилка при завантаженні файлу', 'error');
        } finally {
            setUploadingFile(false);
        }
    };

    const [activeChatId, setActiveChatId] = useState(null);

    return (
        <div className="admin-glass-container">
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
                    <div className="admin-logo">ЛАНКА</div>

                    <nav className="admin-nav-menu">
                        <button
                            className={`admin-nav-btn ${activeTab === 'create_request' ? 'active' : ''}`}
                            onClick={() => setActiveTab('create_request')}
                        >
                            Створити заявку
                        </button>
                        <button
                            className={`admin-nav-btn ${activeTab === 'my_requests' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my_requests')}
                        >
                            Мої заявки
                        </button>
                        <button
                            className={`admin-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            Чати
                        </button>
                    </nav>

                    <div className="admin-profile-zone">
                        <div className="admin-profile-avatar" onClick={() => setShowDropdown(!showDropdown)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                        </div>

                        {showDropdown && (
                            <div className="admin-dropdown-menu">
                                <div className="dropdown-info">
                                    {userRole === 'CUSTOMER' ? 'Замовник' : userRole || 'Користувач'}
                                </div>
                                <button className="dropdown-info-btn" onClick={fetchFullProfile} disabled={loading}>
                                    {loading ? 'Завантаження...' : 'Розширена інформація'}
                                </button>
                                <button className="dropdown-logout-btn" onClick={onLogOut}>
                                    Вийти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="admin-glass-content">
                {activeTab === 'create_request' && (
                    <CreateRequestTab
                        userId={currentUserId}
                        onSuccessSubmit={() => setActiveTab('my_requests')}
                    />
                )}

                {activeTab === 'my_requests' && (
                    <MyRequestsTab
                        userId={currentUserId}
                        onGoToChat={(id) => {
                            setActiveChatId(id);
                            setActiveTab('chats');
                        }}
                    />
                )}

                {activeTab === 'chats' && (
                    <ChatsTab initialChatId={activeChatId} />
                )}
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
                                        {[fullUserData.lastName, fullUserData.firstName, fullUserData.patronymic]
                                            .filter(Boolean)
                                            .join(' ') || 'Не вказано'}
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

                                <div className="file-upload-area" style={{ marginBottom: '15px' }}>
                                    <label className="file-upload-label" style={{ cursor: 'pointer', padding: '10px', background: '#f0f9ff', border: '1px dashed #bae6fd', borderRadius: '8px', display: 'block' }}>
                                        📎 Натисніть, щоб обрати файл (JPG, PNG, PDF)
                                        <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploadingFile} style={{ display: 'none' }} />
                                    </label>
                                    {uploadingFile && <span className="upload-spinner">⏳ Завантаження...</span>}
                                </div>

                                {documents.length === 0 ? (
                                    <p className="no-docs" style={{ color: '#64748b' }}>Немає завантажених документів</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {documents.map(doc => (
                                            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', alignItems: 'center' }}>
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                                                    📄 {doc.title || 'Документ'}
                                                </a>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: doc.status === 'APPROVED' ? 'green' : 'orange' }}>
                                                    {doc.status || 'PENDING'}
                                                </span>
                                                <button onClick={() => deleteDocument(doc.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ВІКНО ПІДТВЕРДЖЕННЯ ТЕПЕР ТУТ (Всередині модалки профілю) */}
                        {confirmModal.isOpen && (
                            <div className="modal-overlay" style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 99999,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(4px)'
                            }}>
                                <div className="modal-content" style={{
                                    width: '420px',
                                    padding: 0,
                                    background: '#fff',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                                    border: 'none'
                                }}>
                                    <div className="modal-header" style={{
                                        background: '#ef4444',
                                        padding: '20px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        border: 'none'
                                    }}>
                                        <h3 style={{
                                            margin: 0,
                                            color: '#fff',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            {confirmModal.icon} {confirmModal.title}
                                        </h3>
                                        <button className="modal-close" onClick={closeConfirmModal} style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}>✕</button>
                                    </div>

                                    <div style={{ padding: '24px', fontSize: '15px', color: '#475569', lineHeight: '1.5', textAlign: 'center' }}>
                                        {confirmModal.text}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        justifyContent: 'center',
                                        padding: '0 24px 24px 24px'
                                    }}>
                                        <button style={{
                                            background: '#dc2626',
                                            padding: '12px 32px',
                                            cursor: 'pointer',
                                            border: 'none',
                                            color: '#fff',
                                            borderRadius: '14px',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }} onClick={confirmModal.onConfirm}>Видалити</button>

                                        <button style={{
                                            background: '#eff6ff',
                                            padding: '12px 32px',
                                            cursor: 'pointer',
                                            border: '1px solid #bfdbfe',
                                            color: '#1e40af',
                                            borderRadius: '14px',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }} onClick={closeConfirmModal}>Скасувати</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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