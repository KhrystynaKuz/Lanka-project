import React, {useState} from 'react';
import './Header.css';

export default function Header({onLogOut}) {
    // Стейт для перемикання вкладок (як у твоїй шапці)
    const [activeTab, setActiveTab] = useState('verification');
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="admin-glass-container">
            {/* ШАПКА АДМІН-ПАНЕЛІ */}
            <header className="admin-glass-header">
                <div className="admin-header-left">
                    <div className="admin-logo">ЛАНКА</div>
                    <nav className="admin-nav-menu">
                        <button className={`admin-nav-btn ${activeTab === 'verification' ? 'active' : ''}`}
                                onClick={() => setActiveTab('verification')}>Верифікація
                        </button>
                        <button className={`admin-nav-btn ${activeTab === 'requests' ? 'active' : ''}`}
                                onClick={() => setActiveTab('requests')}>Заявки
                        </button>
                        <button className={`admin-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
                                onClick={() => setActiveTab('chats')}>Чати
                        </button>
                        <button className={`admin-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
                                onClick={() => setActiveTab('reports')}>Звіти
                        </button>
                        <button className={`admin-nav-btn ${activeTab === 'site' ? 'active' : ''}`}
                                onClick={() => setActiveTab('site')}>Сайт
                        </button>
                        <button className={`admin-nav-btn ${activeTab === 'warehouse' ? 'active' : ''}`}
                                onClick={() => setActiveTab('warehouse')}>Склад
                        </button>
                    </nav>
                </div>

                {/* Профіль з випадаючим меню (іконка користувача) */}
                <div className="admin-profile-zone">
                    <div className="admin-profile-avatar" onClick={() => setShowDropdown(!showDropdown)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                    </div>
                    {showDropdown && (
                        <div className="admin-dropdown-menu">
                            <div className="dropdown-info">Голова Організації</div>
                            <button className="dropdown-logout-btn" onClick={onLogOut}>Вийти</button>
                        </div>
                    )}
                </div>
            </header>

            {/* ОСНОВНИЙ КОНТЕНТ (ЗМІНЮЄТЬСЯ ЗАЛЕЖНО ВІД ВКЛАДКИ) */}
            <main className="admin-glass-content">

                {/* 1. ВКЛАДКА: ВЕРИФІКАЦІЯ (голова1.jpg) */}
                {activeTab === 'verification' && (
                    <div className="admin-tab-content fade-in">
                        <div className="tab-header-block">
                            <h2 className="tab-title">Верифікація</h2>
                            <div className="badge-counter">Нові користувачі: <span className="counter-number">2</span> ▲
                            </div>
                        </div>

                        <div className="glass-verification-list">
                            <div className="verification-card">
                                <div className="user-info-side">
                                    <span className="user-name">Олександр Ковальчук</span>
                                    <span className="user-role-badge">Роль: Волонтер</span>
                                    <span className="user-docs">📄 Паспорт_верифікація.pdf</span>
                                </div>
                                <div className="action-buttons-side">
                                    <button className="btn-detail-view">Детальніше</button>
                                    <button className="btn-action-circle approve">✓</button>
                                    <button className="btn-action-circle reject">✕</button>
                                </div>
                            </div>

                            <div className="verification-card">
                                <div className="user-info-side">
                                    <span className="user-name">Благодійний Фонд "Разом"</span>
                                    <span className="user-role-badge">Роль: Замовник (Організація)</span>
                                    <span className="user-docs">📄 Виписка_ЄДРПОУ.pdf</span>
                                </div>
                                <div className="action-buttons-side">
                                    <button className="btn-detail-view">Детальніше</button>
                                    <button className="btn-action-circle approve">✓</button>
                                    <button className="btn-action-circle reject">✕</button>
                                </div>
                            </div>
                        </div>

                        {/* Блок Відділи та Волонтери знизу */}
                        <div className="grid-split-sections">
                            <div className="glass-sub-section">
                                <div className="sub-section-header">
                                    <h3>Відділи</h3>
                                    <div className="search-bar-mini"><input type="text" placeholder="Пошук..."/> 🔍</div>
                                </div>
                                <div className="list-items-box clickable-hint">
                                    <div className="list-item">Медичний відділ</div>
                                    <div className="list-item">Гуманітарний відділ (Продукти)</div>
                                    <div className="list-item">Технічний та авто-відділ</div>
                                    <span className="hint-text">*при натисканні — редагування</span>
                                </div>
                            </div>

                            <div className="glass-sub-section">
                                <div className="sub-section-header">
                                    <h3>Волонтери обраного відділу</h3>
                                    <div className="search-bar-mini"><input type="text" placeholder="Пошук..."/> 🔍</div>
                                </div>
                                <div className="list-items-box font-creative-cloud">
                                    <div className="list-item">Дмитро Литвин (Координатор)</div>
                                    <div className="list-item">Анна Сидоренко</div>
                                    <div className="list-item">Максим Мороз</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ВКЛАДКА: ЗАЯВКИ (голова2.jpg) */}
                {activeTab === 'requests' && (
                    <div className="admin-tab-content fade-in">
                        <div className="search-main-row">
                            <input type="text" className="main-search-input"
                                   placeholder="Пошук заявок за ключовими словами або номерами..."/>
                            <button className="main-search-btn">Знайти</button>
                        </div>

                        <div className="tab-header-block" style={{marginTop: '20px'}}>
                            <div className="badge-counter">Нові заявки: <span className="counter-number">1</span> ▲
                            </div>
                        </div>

                        <div className="glass-main-request-panel">
                            <div className="request-full-card">
                                <div className="request-header-line">
                                    <h3>ЗАЯВКА №123</h3>
                                    <span className="applicant-pib">Замовник: Іванов Петро Борисович</span>
                                </div>
                                <div className="request-body-fields">
                                    <p><strong>Назва:</strong> Запит на закупівлю засобів індивідуального захисту</p>
                                    <p><strong>Офіційний запит:</strong> <span className="doc-link">📄 запит_лікарня_№4.pdf</span>
                                    </p>
                                    <p><strong>Дані:</strong> КНП "Міська клінічна лікарня №4", м. Київ</p>
                                    <p><strong>Опис:</strong> Необхідно 50 комплектів спеціального захисного одягу для
                                        інфекційного відділення у зв'язку зі збільшенням навантаження.</p>
                                </div>

                                <div className="department-assignment-zone">
                                    <h4>Призначити відповідальний(-і) відділ(-и):</h4>
                                    <div className="checkbox-grid">
                                        <label><input type="checkbox" defaultChecked/> Медичний (Дмитро Л. координатор)</label>
                                        <label><input type="checkbox"/> Гуманітарний</label>
                                        <label><input type="checkbox"/> Авто-відділ</label>
                                        <label><input type="checkbox"/> Склад логістики</label>
                                    </div>
                                </div>

                                <div className="request-action-footer">
                                    <button className="btn-reject-request">Відхилити запит</button>
                                    <button className="btn-approve-request">Затвердити і передати</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. ВКЛАДКА: ЧАТИ (замовник2.jpg) — ПОВНОЕКРАННИЙ РЕЖИМ */}
                {activeTab === 'chats' && (
                    <div className="fullscreen-chat-mode fade-in">
                        <div className="chat-layout-container">

                            {/* Бокова панель списку чатів */}
                            <div className="chat-sidebar-glass">
                                <div className="chat-search-box">
                                    <input type="text" placeholder="🔍 Пошук чату або заявки..."/>
                                </div>
                                <div className="chat-channels-list">
                                    <div className="chat-channel-item active">
                                        <div className="channel-meta">
                                            <span className="channel-title">ЗАЯВКА №123 (Медицина)</span>
                                            <span className="channel-time-badge">14:45</span>
                                        </div>
                                        <span
                                            className="channel-preview">Ви: Доброго дня! Переглядаю вашу заявку...</span>
                                    </div>
                                    <div className="chat-channel-item">
                                        <div className="channel-meta">
                                            <span className="channel-title">ЗАЯВКА №119 (Авто)</span>
                                            <span className="channel-time-badge">Вчора</span>
                                        </div>
                                        <span className="channel-preview">Сергій: Машину повністю завантажили</span>
                                    </div>
                                    <div className="chat-channel-item">
                                        <div className="channel-meta">
                                            <span className="channel-title">Загальний чат волонтерів</span>
                                            <span className="channel-time-badge">2 дн.</span>
                                        </div>
                                        <span
                                            className="channel-preview">Ольга: Хто має вільний час завтра зранку?</span>
                                    </div>
                                </div>
                            </div>

                            {/* Основне вікно відкритого чату */}
                            <div className="chat-main-window-glass">
                                <div className="chat-window-header">
                                    <div className="chat-header-info">
                                        <h3>ЗАЯВКА №123</h3>
                                        <span className="chat-header-status">● у мережі (Замовник)</span>
                                    </div>
                                    <button className="btn-view-info-top">Переглянути інформацію по заявці</button>
                                </div>

                                {/* Стрічка повідомлень */}
                                <div className="chat-messages-stream">
                                    <div className="message incoming">
                                        <span className="msg-author">Петро Борисович (Замовник)</span>
                                        <div className="msg-bubble">Вітання! Документи завантажили, підкажіть коли
                                            чекати на затвердження комісії?
                                        </div>
                                        <span className="msg-time">14:32</span>
                                    </div>

                                    <div className="message incoming">
                                        <span className="msg-author">Петро Борисович (Замовник)</span>
                                        <div className="msg-bubble">Додали також офіційне звернення від головного
                                            лікаря.
                                        </div>
                                        <span className="msg-time">14:33</span>
                                    </div>

                                    <div className="message outgoing">
                                        <span className="msg-author">Ви (Голова)</span>
                                        <div className="msg-bubble">Доброго дня! Переглядаю вашу заявку. Зараз
                                            призначимо медичний відділ для збору коштів.
                                        </div>
                                        <span className="msg-time">14:45</span>
                                    </div>
                                </div>

                                {/* Нижня панель введення тексту */}
                                <div className="chat-input-footer-row">
                                    <div className="input-wrap-glass">
                                        <button className="btn-attach-file" title="Додати документи або фото">📎</button>
                                        <input type="text"
                                               placeholder="Напишіть повідомлення волонтерам або замовнику..."/>
                                    </div>
                                    <button className="btn-send-message" title="Відправити">➔</button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* 4. ВКЛАДКА: ЗВІТИ (голова3.jpg) */}
                {activeTab === 'reports' && (
                    <div className="admin-tab-content fade-in">
                        <div className="reports-selectors-card">
                            <div className="selector-row">
                                <span className="selector-bullet">•</span>
                                <label>Звіт з виконання: </label>
                                <select className="admin-select">
                                    <option>ЗАЯВКА №123</option>
                                    <option>ЗАЯВКА №122</option>
                                </select>
                                <button className="btn-download-icon" title="Завантажити">📥</button>
                            </div>

                            <div className="selector-row" style={{marginTop: '16px'}}>
                                <span className="selector-bullet">•</span>
                                <label>Звіт за період: </label>
                                <span className="date-span">з</span> <input type="date" className="admin-date-input"
                                                                            defaultValue="2026-05-01"/>
                                <span className="date-span">по</span> <input type="date" className="admin-date-input"
                                                                             defaultValue="2026-05-31"/>
                                <button className="btn-download-icon" title="Завантажити">📥</button>
                            </div>
                        </div>

                        <div className="analytics-section">
                            <h3 className="analytics-title">Статистика та аналітика:</h3>
                            <div className="charts-mock-grid">
                                <div className="chart-box-glass">
                                    <div className="bar-chart-mock">
                                        <div className="bar" style={{height: '50%'}}></div>
                                        <div className="bar" style={{height: '80%'}}></div>
                                        <div className="bar" style={{height: '40%'}}></div>
                                        <div className="bar" style={{height: '95%'}}></div>
                                    </div>
                                    <p className="chart-label">Динаміка закриття заявок</p>
                                </div>

                                <div className="chart-box-glass">
                                    <div className="pie-chart-mock"></div>
                                    <div className="pie-legend">
                                        <div><span className="dot med"></span> Медицина</div>
                                        <div><span className="dot hum"></span> Гуманітарка</div>
                                        <div><span className="dot transport"></span> Транспорт</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. ВКЛАДКА: САЙТ (КЕРУВАННЯ КОНТЕНТОМ) (голова4.jpg) */}
                {activeTab === 'site' && (
                    <div className="admin-tab-content fade-in site-editor-layout">
                        <h2 className="editor-title">Редактор сайту</h2>

                        {/* БЛОК 1 */}
                        <div className="editor-glass-block">
                            <span className="block-badge">Блок 1 : ГОЛОВНА СТОРІНКА</span>
                            <div className="input-field-group">
                                <label>Заголовок :</label>
                                <input type="text" defaultValue="ЛАНКА"/>
                            </div>
                            <div className="input-field-group">
                                <label>Опис :</label>
                                <textarea defaultValue="Ми — волонтерська організація, що створює міцні зв'язки..."/>
                            </div>
                            <div className="photo-upload-row">
                                <label>Фото :</label>
                                <button className="btn-inline-upload">ЗАВАНТАЖИТИ</button>
                            </div>
                            <div className="block-footer-save">
                                <button className="btn-update-block">ОНОВИТИ</button>
                            </div>
                        </div>

                        {/* БЛОК 2 */}
                        <div className="editor-glass-block">
                            <span className="block-badge">Блок 2 : СТОРІНКА ЗБОРІВ</span>
                            <h4 className="sub-block-title">Активні збори</h4>
                            <div className="table-like-row">
                                <input type="text" placeholder="Назва..." defaultValue="Медикаменти для Бахмута"/>
                                <input type="text" placeholder="Опис..." defaultValue="Збір на такмед"/>
                                <input type="text" placeholder="Посилання..." defaultValue="https://monobank..."/>
                                <span className="qr-placeholder-text">qr code</span>
                                <div className="row-actions">
                                    <button className="btn-row-edit">РЕДАГУВАТИ</button>
                                    <button className="btn-row-hide">ПРИХОВАТИ</button>
                                    <button className="btn-row-delete">✕</button>
                                </div>
                            </div>
                            <button className="btn-add-new-item">+ опублікувати новий збір на сайт</button>
                        </div>

                        {/* БЛОК 3 */}
                        <div className="editor-glass-block">
                            <span className="block-badge">Блок 3 : СТОРІНКА ЗВІТІВ</span>

                            <div className="images-sub-group">
                                <label>ЗАВАНТАЖЕНІ ФОТО:</label>
                                <div className="loaded-photos-list">
                                    <span className="photo-item-tag">фото1.jpg ✕</span>
                                    <span className="photo-item-tag">фото2.png ✕</span>
                                </div>
                                <button className="btn-add-element">+ ДОДАТИ ФОТО</button>
                            </div>

                            <div className="documents-sub-group">
                                <label>ОФІЦІЙНІ ДОКУМЕНТИ ТА ЗВІТИ :</label>
                                <div className="table-like-row">
                                    <input type="text" defaultValue="Фінансовий звіт за Травень"/>
                                    <span className="file-attached-badge">звіт.pdf</span>
                                    <div className="row-actions">
                                        <button className="btn-row-edit">РЕДАГУВАТИ</button>
                                        <button className="btn-row-hide">ПРИХОВАТИ</button>
                                        <button className="btn-row-delete">✕</button>
                                    </div>
                                </div>
                                <button className="btn-add-element" style={{marginTop: '10px'}}>+ ДОДАТИ ДОКУМЕНТ
                                </button>
                            </div>

                            <div className="block-footer-save">
                                <button className="btn-update-block">ОНОВИТИ</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. ВКЛАДКА: СКЛАД */}
                {activeTab === 'warehouse' && (
                    <div className="admin-tab-content fade-in">
                        <h2 className="tab-title">Облік складу логістики</h2>
                        <p style={{color: '#4b5563'}}>Модуль інтеграції залишків гуманітарної допомоги, ліків та
                            спец-засобів перебуває в розробці...</p>
                    </div>
                )}
            </main>
        </div>
    );
}