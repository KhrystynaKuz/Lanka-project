import React, {useState} from 'react';
import './Customer.css';

export default function Customer({onLogOut}) {
    const [activeTab, setActiveTab] = useState('create_request');
    const [showDropdown, setShowDropdown] = useState(false);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('humanitarian');
    const [description, setDescription] = useState('');

    const handleCreateRequest = (e) => {
        e.preventDefault();
        alert(`Заявку "${title}" успішно створено!`);
        setTitle('');
        setDescription('');
        setActiveTab('my_requests'); // Перенаправляємо на список заявок
    };

    return (
        <div className="admin-glass-container">
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
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                        </div>

                        {showDropdown && (
                            <div className="admin-dropdown-menu fade-in">
                                <div className="dropdown-info">Замовник</div>
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
                    <div className="fade-in" style={{marginTop: '15px'}}>
                        <div className="tab-header-block">
                            <h2 className="tab-title">Нова заявка на допомогу</h2>
                        </div>

                        <form onSubmit={handleCreateRequest} className="request-full-card">
                            <div className="editor-glass-block"
                                 style={{border: 'none', background: 'transparent', padding: 0}}>
                                <div className="input-field-group">
                                    <label>Назва заявки / Що саме потрібно? *</label>
                                    <input
                                        type="text"
                                        placeholder="Наприклад: Продукти харчування для ВПО"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-field-group" style={{marginTop: '15px'}}>
                                    <label>Категорія допомоги</label>
                                    <select
                                        className="admin-select"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        style={{width: '100%', padding: '12px'}}
                                    >
                                        <option value="humanitarian">Гуманітарна допомога</option>
                                        <option value="medical">Медикаменти</option>
                                        <option value="military">Військова амуніція</option>
                                        <option value="transport">Транспортування</option>
                                    </select>
                                </div>

                                <div className="input-field-group" style={{marginTop: '15px'}}>
                                    <label>Детальний опис ситуації та потреб *</label>
                                    <textarea
                                        placeholder="Опишіть кількість, терміновість та куди потрібна доставка..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        style={{height: '140px'}}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="request-action-footer" style={{marginTop: '25px'}}>
                                <div/>
                                <button type="submit" className="btn-approve-request">
                                    Опублікувати заявку
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'my_requests' && (
                    <div className="fade-in" style={{marginTop: '15px'}}>
                        <div className="tab-header-block">
                            <h2 className="tab-title">Історія моїх заявок</h2>
                            <div className="badge-counter">Усього: <span className="counter-number">1</span></div>
                        </div>

                        <div className="glass-verification-list">
                            {/* Картка активної заявки за твоїм макетом */}
                            <div className="verification-card">
                                <div className="user-info-side">
                                    <div className="user-name">Продукти харчування для ВПО (Харків)</div>
                                    <div className="user-role-badge">Категорія: Гуманітарна допомога • Статус: <span
                                        style={{color: '#2563eb', fontWeight: 700}}>В обробці</span></div>
                                    <div className="user-role-badge" style={{marginTop: '5px', opacity: 0.8}}>
                                        Опис: Необхідно 50 продуктових наборів тривалого зберігання.
                                    </div>
                                </div>
                                <div className="action-buttons-side">
                                    <button className="btn-detail-view" onClick={() => setActiveTab('chats')}>
                                        Чат по заявці
                                    </button>
                                    <button className="btn-action-circle reject" title="Скасувати заявку">✕</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. ВКЛАДКА: ЧАТИ (КОПІЯ ДИЗАЙНУ МЕНЕДЖЕРА З ПРАВИЛЬНИМИ ВІДСТУПАМИ) */}
                {activeTab === 'chats' && (
                    <div className="fullscreen-chat-mode fade-in">
                        <div className="chat-layout-container">

                            {/* ЛІВА ЧАСТИНА: КОРИСТУВАЧІ */}
                            <div className="chat-sidebar-glass">
                                <div className="chat-search-box">
                                    <input type="text" placeholder="Пошук координатора..."/>
                                </div>
                                <div className="chat-channels-list">
                                    <div className="chat-channel-item active">
                                        <div className="channel-meta">
                                            <span className="channel-title">Координатор: Олексій</span>
                                            <span className="channel-time-badge">14:32</span>
                                        </div>
                                        <div className="channel-preview">Вітаю! Ми прийняли вашу заявку в роботу.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="chat-main-window-glass">
                                <div className="chat-window-header">
                                    <div className="chat-header-info">
                                        <h3>Чат підтримки заявок</h3>
                                        <span className="chat-header-status">Координатор онлайн</span>
                                    </div>
                                    <button className="btn-view-info-top">Деталі заявки</button>
                                </div>

                                <div className="chat-messages-stream">
                                    <div className="message incoming">
                                        <span className="msg-author">Олексій (Координатор)</span>
                                        <div className="msg-bubble">Вітаю! Ми прийняли вашу заявку в роботу. Уточнюємо
                                            логістику.
                                        </div>
                                        <span className="msg-time">14:32</span>
                                    </div>
                                    <div className="message outgoing">
                                        <span className="msg-author">Ви</span>
                                        <div className="msg-bubble">Дуже дякую! Будемо чекати на інформацію.</div>
                                        <span className="msg-time">14:35</span>
                                    </div>
                                </div>

                                <div className="chat-input-footer-row">
                                    <div className="input-wrap-glass">
                                        <button className="btn-attach-file">📎</button>
                                        <input type="text" placeholder="Напишіть повідомлення..."/>
                                    </div>
                                    <button className="btn-send-message">➔</button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}