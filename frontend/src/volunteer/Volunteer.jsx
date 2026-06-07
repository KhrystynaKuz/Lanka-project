import React, { useState } from 'react';
import './Volunteer.css';

export default function Volunteer({ onLogout, onBackToHome }) {
    const [activeTab, setActiveTab] = useState('tasks');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [taskStatus, setTaskStatus] = useState('В процесі');
    const [reportFile, setReportFile] = useState(null);

    const mockTask = {
        id: 10,
        requestId: 123,
        description: "Доставка медикаментів для дитячої лікарні №5. Потрібно забрати коробки зі складу та передати координатору.",
        deadline: "12.06.2026",
        materials: "Бинти, антисептики, дитячі ліки (3 коробки)"
    };

    const archivedTasks = [
        { id: 8, title: "Завдання №8", desc: "Роздача гуманітарної допомоги в хабі" },
        { id: 5, title: "Завдання №5", desc: "Транспортування теплих речей" }
    ];

    const chatChannels = [
        { id: 123, title: "ЗАЯВКА №123 (Медицина)", preview: "Ви: Доброго дня! Переглядаю вашу заявку...", time: "14:45", active: true },
        { id: 119, title: "ЗАЯВКА №119 (Авто)", preview: "Сергій: Машину повністю завантажили", time: "Вчора" },
        { id: 0, title: "Загальний чат волонтерів", preview: "Ольга: Хто має вільний час завтра зранку?", time: "2 дн." }
    ];

    return (
        <div className="volunteer-glass-container">
            <header className="volunteer-glass-header">
                <div className="volunteer-header-left">
                    <div className="volunteer-logo" onClick={onBackToHome} style={{ cursor: 'pointer' }}>ЛАНКА</div>

                    <nav className="volunteer-nav-menu">
                        <button
                            className={`volunteer-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tasks')}
                        >
                            Мої завдання
                        </button>
                        <button
                            className={`volunteer-nav-btn ${activeTab === 'archive' ? 'active' : ''}`}
                            onClick={() => setActiveTab('archive')}
                        >
                            Архів
                        </button>
                        <button
                            className={`volunteer-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            Мої чати
                        </button>
                        <button
                            className={`volunteer-nav-btn ${activeTab === 'badges' ? 'active' : ''}`}
                            onClick={() => setActiveTab('badges')}
                        >
                            Відзнаки
                        </button>
                    </nav>

                    <div className="volunteer-profile-zone">
                        <div className="volunteer-profile-avatar" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="volunteer-profile-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                        </div>

                        {isDropdownOpen && (
                            <div className="volunteer-dropdown-menu fade-in">
                                <div className="volunteer-dropdown-info">Волонтер</div>
                                <button className="volunteer-logout-btn" onClick={onLogout}>
                                    Вийти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="volunteer-glass-content fade-in">
                {activeTab === 'tasks' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {mockTask && (
                            <div className="volunteer-task-card">
                                <div className="volunteer-task-header">
                                    <h3>ЗАВДАННЯ №{mockTask.id}</h3>
                                    <span className="volunteer-task-link">Прив'язано до ЗАЯВКИ №{mockTask.requestId}</span>
                                </div>

                                <div className="volunteer-task-body">
                                    <p><strong>Опис:</strong> {mockTask.description}</p>
                                    <p><strong>Дедлайн:</strong> <span style={{ color: '#e11d48', fontWeight: '700' }}>{mockTask.deadline}</span></p>
                                    <p><strong>Матеріали:</strong> {mockTask.materials}</p>

                                    <div className="volunteer-status-row">
                                        <strong>Статус:</strong>
                                        <select
                                            className="volunteer-select"
                                            value={taskStatus}
                                            onChange={(e) => setTaskStatus(e.target.value)}
                                        >
                                            <option value="В процесі">В процесі ⏳</option>
                                            <option value="Виконано">Виконано (Очікує підтвердження)</option>
                                        </select>
                                    </div>

                                    <div className="volunteer-upload-row">
                                        <strong>Звітувати про виконання:</strong>
                                        <label className="volunteer-upload-btn">
                                            Завантажити 📎
                                            <input
                                                type="file"
                                                style={{ display: 'none' }}
                                                onChange={(e) => setReportFile(e.target.files[0])}
                                            />
                                        </label>
                                        {reportFile && <span className="volunteer-file-badge">{reportFile.name}</span>}
                                    </div>
                                </div>

                                <button
                                    className="volunteer-circle-approve-btn"
                                    onClick={() => alert('Звіт успішно надіслано координатору!')}
                                    title="Надіслати звіт"
                                >
                                    ✓
                                </button>
                            </div>
                        )}

                        <div className="volunteer-empty-tasks">
                            <p>У вас більше немає завдань</p>
                            <span>❤️</span>
                        </div>
                    </div>
                )}

                {activeTab === 'archive' && (
                    <div>
                        <div className="volunteer-tab-header">
                            <h2 className="volunteer-tab-title">Виконані завдання</h2>
                            <div className="volunteer-badge-counter">Всього виконано: <span className="volunteer-counter-num">{archivedTasks.length}</span></div>
                        </div>

                        <div className="volunteer-list-container">
                            {archivedTasks.map(task => (
                                <div className="volunteer-archive-card" key={task.id}>
                                    <div className="volunteer-archive-info">
                                        <div className="volunteer-archive-title">{task.title}</div>
                                        <div className="volunteer-archive-desc">{task.desc}</div>
                                    </div>
                                    <button className="volunteer-detail-btn" onClick={() => alert(`Деталі ${task.title}`)}>
                                        Детальніше ▾
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'chats' && (
                    <div className="volunteer-fullscreen-chat">
                        <div className="volunteer-chat-layout">
                            <div className="volunteer-chat-sidebar">
                                <div className="volunteer-chat-search">
                                    <input type="text" placeholder="🔍 Пошук чату або заявки..." />
                                </div>
                                <div className="volunteer-chat-list">
                                    {chatChannels.map((chat, idx) => (
                                        <div className={`volunteer-channel-item ${chat.active ? 'active' : ''}`} key={idx}>
                                            <div className="volunteer-channel-meta">
                                                <span className="volunteer-channel-title">{chat.title}</span>
                                                <span className="volunteer-channel-time">{chat.time}</span>
                                            </div>
                                            <div className="volunteer-channel-preview">{chat.preview}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="volunteer-chat-main">
                                <div className="volunteer-chat-header">
                                    <div className="volunteer-chat-header-info">
                                        <h3>ЗАЯВКА №123 (Медицина)</h3>
                                        <span className="volunteer-chat-status">В процесі виконання</span>
                                    </div>
                                    <button className="volunteer-info-btn">
                                        ПЕРЕГЛЯНУТИ інформацію по заявці
                                    </button>
                                </div>

                                <div className="volunteer-chat-messages">
                                    <div className="volunteer-msg incoming">
                                        <span className="volunteer-msg-author">Координатор (Олег)</span>
                                        <div className="volunteer-msg-bubble">Доброго дня! Переглядаю вашу заявку на матеріали, ліки готові до видачі.</div>
                                        <span className="volunteer-msg-time">14:40</span>
                                    </div>
                                    <div className="volunteer-msg outgoing">
                                        <span className="volunteer-msg-author">Ви</span>
                                        <div className="volunteer-msg-bubble">Супер! Вже виїжджаю на склад забирати.</div>
                                        <span className="volunteer-msg-time">14:45</span>
                                    </div>
                                </div>

                                <div className="volunteer-chat-footer">
                                    <div className="volunteer-input-wrap">
                                        <button className="volunteer-attach-btn">📎</button>
                                        <input type="text" placeholder="Повідомлення..." />
                                    </div>
                                    <button className="volunteer-send-btn">➔</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="volunteer-badges-grid">
                        <div className="volunteer-sub-section level-map-section">
                            <div className="volunteer-sub-section-title">
                                <h3>МІЙ РІВЕНЬ</h3>
                            </div>

                            <div className="volunteer-level-card active-level">
                                <div className="volunteer-level-info">
                                    <h4>Волонтер-новачок</h4>
                                    <small>К-ть виконаних завдань: 1</small>
                                </div>
                                <div className="volunteer-level-num">1</div>
                            </div>

                            <div className="volunteer-level-divider"></div>

                            <div className="volunteer-level-card locked-level">
                                <div className="volunteer-level-info">
                                    <h4>Рятівник</h4>
                                    <small>Потрібно виконати ще 4 завдання</small>
                                </div>
                                <div className="volunteer-level-num">2</div>
                            </div>

                            <div className="volunteer-level-divider gray-divider"></div>

                            <div className="volunteer-level-card locked-level transparent-level">
                                <div className="volunteer-level-info">
                                    <h4>Герой громади</h4>
                                    <small>Епічні завдання</small>
                                </div>
                                <div className="volunteer-level-num">3</div>
                            </div>
                        </div>

                        <div className="volunteer-sub-section rewards-section">
                            <div>
                                <div className="volunteer-sub-section-title">
                                    <h3>МОЇ ДОСЯГНЕННЯ</h3>
                                </div>
                                <div className="volunteer-badges-list">
                                    <div className="volunteer-badge-item">🥇 Перший виїзд (Отримано за закриття завдання №8)</div>
                                    <div className="volunteer-badge-item">⚡ Безвідмовний (3 завдання в процесі одночасно)</div>
                                    <div className="volunteer-badge-item locked-badge">🔒 Майстер логістики (Блоковано)</div>
                                </div>
                            </div>

                            <div className="volunteer-certificate-box">
                                <h4>СЕРТИФІКАТ ВОЛОНТЕРА</h4>
                                <p>Ви можете завантажити офіційний документ, що підтверджує вашу волонтерську діяльність у проекті.</p>
                                <button className="volunteer-download-cert-btn" onClick={() => alert('Завантаження сертифікату PDF...')}>
                                    ЗАВАНТАЖИТИ 📥
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}