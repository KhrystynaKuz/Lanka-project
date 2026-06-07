import React, { useState } from 'react';
import './Coordinator.css';

export default function Coordinator({ onLogout, onBackToHome }) {
    const [activeTab, setActiveTab] = useState('department_tasks');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNewRequestsOpen, setIsNewRequestsOpen] = useState(true);

    const [subTasks, setSubTasks] = useState([
        { id: 1, title: '', desc: '', assignee: '', deadline: '' }
    ]);

    const [warehouseItems, setWarehouseItems] = useState([
        { id: 1, name: 'Бинти медичні', quantity: 150 },
        { id: 2, name: 'Антисептики (л)', quantity: 40 },
        { id: 3, name: 'Інсулін (флакони)', quantity: 25 }
    ]);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const chatChannels = [
        { id: 123, title: "ЗАЯВКА №123 (Медицина)", preview: "Марія П.: Коли очікувати доставку?", time: "14:40", active: true },
        { id: 10, title: "Волонтер: Олексій (Завдання №10)", preview: "Ви: Олексій, уточни деталі по складу", time: "Вчора" }
    ];

    const handleAddSubTask = () => {
        const newId = subTasks.length > 0 ? Math.max(...subTasks.map(t => t.id)) + 1 : 1;
        setSubTasks([...subTasks, { id: newId, title: '', desc: '', assignee: '', deadline: '' }]);
    };

    const handleUpdateSubTask = (id, field, value) => {
        setSubTasks(subTasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleDeleteSubTask = (id) => {
        setSubTasks(subTasks.filter(t => t.id !== id));
    };

    const handleAddWarehouseItem = () => {
        const newId = warehouseItems.length > 0 ? Math.max(...warehouseItems.map(i => i.id)) + 1 : 1;
        const newItem = { id: newId, name: 'Новий ресурс', quantity: 0 };
        setWarehouseItems([...warehouseItems, newItem]);
        setEditingItem(newItem);
    };

    return (
        <div className="coord-glass-container">
            <header className="coord-glass-header">
                <div className="coord-header-left">
                    <div className="coord-logo" onClick={onBackToHome} style={{ cursor: 'pointer' }}>ЛАНКА</div>

                    <nav className="coord-nav-menu">
                        <button
                            className={`coord-nav-btn ${activeTab === 'department_tasks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('department_tasks')}
                        >
                            Завдання відділу
                        </button>
                        <button
                            className={`coord-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            Чати
                        </button>
                        <button
                            className={`coord-nav-btn ${activeTab === 'warehouse' ? 'active' : ''}`}
                            onClick={() => setActiveTab('warehouse')}
                        >
                            Склад
                        </button>
                    </nav>

                    <div className="coord-profile-zone">
                        <div className="coord-profile-avatar" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="coord-profile-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                        </div>

                        {isDropdownOpen && (
                            <div className="volunteer-dropdown-menu fade-in">
                                <div className="volunteer-dropdown-info">Координатор</div>
                                <button className="volunteer-logout-btn" onClick={onLogout}>
                                    Вийти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="coord-glass-content fade-in">
                {activeTab === 'department_tasks' && (
                    <div className="coord-tasks-section">
                        <div className="coord-toggle-header" onClick={() => setIsNewRequestsOpen(!isNewRequestsOpen)}>
                            <span className="coord-toggle-title">Нові заявки <span className="coord-badge-count">1</span></span>
                            <span className="coord-toggle-icon">{isNewRequestsOpen ? '▲' : '▼'}</span>
                        </div>

                        {isNewRequestsOpen && (
                            <div className="coord-main-request-card fade-in">
                                <div className="coord-req-header">ЗАЯВКА №123</div>
                                <div className="coord-req-field"><strong>Назва:</strong> Медикаменти для дитячої лікарні №5</div>
                                <div className="coord-req-field"><strong>Опис:</strong> Термінова потреба в перев'язувальних матеріалах та інсуліні.</div>
                                <div className="coord-req-field"><strong>Складські ресурси:</strong> Бинти, антисептики, інсулін</div>

                                <div className="coord-subtasks-divider">
                                    <span>РОЗПОДІЛ НА ЗАВДАННЯ</span>
                                </div>

                                <div className="coord-subtasks-list">
                                    {subTasks.map((task, index) => (
                                        <div className="coord-subtask-row" key={task.id}>
                                            <div className="coord-subtask-number">{index + 1}</div>
                                            <div className="coord-subtask-inputs">
                                                <input
                                                    type="text"
                                                    placeholder="Назва завдання..."
                                                    value={task.title}
                                                    onChange={(e) => handleUpdateSubTask(task.id, 'title', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Відповідальні (волонтер)..."
                                                    value={task.assignee}
                                                    onChange={(e) => handleUpdateSubTask(task.id, 'assignee', e.target.value)}
                                                />
                                                <textarea
                                                    placeholder="Опис підзавдання..."
                                                    value={task.desc}
                                                    onChange={(e) => handleUpdateSubTask(task.id, 'desc', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Дедлайн (напр. 12.06)..."
                                                    value={task.deadline}
                                                    onChange={(e) => handleUpdateSubTask(task.id, 'deadline', e.target.value)}
                                                />
                                            </div>
                                            <div className="coord-subtask-actions">
                                                <button className="coord-btn-edit-inline" title="Редагувати">✏️</button>
                                                <button className="coord-btn-delete-inline" onClick={() => handleDeleteSubTask(task.id)} title="Видалити">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="coord-add-subtask-center">
                                    <button className="coord-circle-add-btn" onClick={handleAddSubTask}>+</button>
                                </div>

                                <div className="coord-action-right">
                                    <button className="coord-btn-save" onClick={() => alert('Розподіл завдань успішно збережено!')}>ЗБЕРЕГТИ</button>
                                </div>
                            </div>
                        )}

                        <div className="coord-filter-row">
                            <select className="coord-minimal-select">
                                <option value="all">усі ▾</option>
                                <option value="process">в процесі</option>
                                <option value="done">виконані</option>
                            </select>
                        </div>

                        <div className="coord-main-request-card archive-request">
                            <div className="coord-req-header">ЗАЯВКА №44</div>
                            <div className="coord-req-field"><strong>Назва:</strong> Transporting warm clothes for IDPs</div>
                            <div className="coord-archive-actions">
                                <button className="coord-btn-details-outline" onClick={() => alert('Відкриття деталей заявки...')}>ДЕТАЛЬНІШЕ</button>
                                <div className="coord-conditional-edit">
                                    <small>тільки, якщо <u>не</u> виконана</small>
                                    <button className="coord-btn-edit-action" onClick={() => alert('Форма редагування архівованої заявки')}>РЕДАГУВАТИ</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chats' && (
                    <div className="coord-fullscreen-chat">
                        <div className="coord-chat-layout">
                            <div className="coord-chat-sidebar">
                                <div className="coord-chat-search">
                                    <input type="text" placeholder="🔍 Пошук чату або заявки..." />
                                </div>
                                <div className="coord-chat-list">
                                    {chatChannels.map((chat, idx) => (
                                        <div className={`coord-channel-item ${chat.active ? 'active' : ''}`} key={idx}>
                                            <div className="coord-channel-meta">
                                                <span className="coord-channel-title">{chat.title}</span>
                                                <span className="coord-channel-time">{chat.time}</span>
                                            </div>
                                            <div className="coord-channel-preview">{chat.preview}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="coord-chat-main">
                                <div className="coord-chat-header">
                                    <div className="coord-chat-header-info">
                                        <h3>ЗАЯВКА №123 (Медицина)</h3>
                                        <span className="coord-chat-status">Діалог із заявником та виконавцями</span>
                                    </div>
                                    <button className="coord-info-btn">ПЕРЕГЛЯНУТИ інформацію по заявці</button>
                                </div>

                                <div className="coord-chat-messages">
                                    <div className="coord-msg incoming">
                                        <span className="coord-msg-author">Заявник (Марія П.)</span>
                                        <div className="coord-msg-bubble">Доброго дня! Коли очікувати доставку медикаментів для лікарні?</div>
                                        <span className="coord-msg-time">14:40</span>
                                    </div>
                                    <div className="coord-msg outgoing">
                                        <span className="coord-msg-author">Ви (Координатор)</span>
                                        <div className="coord-msg-bubble">Вітаю! Завдання вже формується, волонтера буде призначено найближчим часом.</div>
                                        <span className="coord-msg-time">14:45</span>
                                    </div>
                                </div>

                                <div className="coord-chat-footer">
                                    <div className="coord-input-wrap">
                                        <button className="coord-attach-btn">📎</button>
                                        <input type="text" placeholder="Повідомлення..." />
                                    </div>
                                    <button className="coord-send-btn">➔</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'warehouse' && (
                    <div className="coord-warehouse-section">
                        <div className="coord-search-bar-row">
                            <input
                                type="text"
                                className="coord-search-input"
                                placeholder="ПОШУК..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="coord-btn-search-action">ЗНАЙТИ</button>
                        </div>

                        <div className="coord-table-control-row">
                            <button className="coord-btn-add-item" onClick={handleAddWarehouseItem}>+ ДОДАТИ</button>
                        </div>

                        <div className="coord-table-wrapper">
                            <table className="coord-warehouse-table">
                                <thead>
                                <tr>
                                    <th>НАЗВА</th>
                                    <th>К-ТЬ В НАЯВНОСТІ</th>
                                </tr>
                                </thead>
                                <tbody>
                                {warehouseItems
                                    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(item => (
                                        <tr key={item.id} onClick={() => setEditingItem(item)} className="coord-table-row-clickable">
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="coord-table-hint">
                                💡 при натисканні на рядок відкривається форма редагування
                            </div>
                        </div>

                        {editingItem && (
                            <div className="coord-editing-panel fade-in">
                                <h4>Редагування ресурсу: ID {editingItem.id}</h4>
                                <div className="coord-editing-inputs">
                                    <input
                                        type="text"
                                        value={editingItem.name}
                                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                    />
                                    <input
                                        type="number"
                                        value={editingItem.quantity}
                                        onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="coord-editing-actions">
                                    <button className="coord-btn-save-item" onClick={() => {
                                        setWarehouseItems(warehouseItems.map(i => i.id === editingItem.id ? editingItem : i));
                                        setEditingItem(null);
                                    }}>Зберегти зміни</button>
                                    <button className="coord-btn-cancel-item" onClick={() => setEditingItem(null)}>Скасувати</button>
                                </div>
                            </div>
                        )}

                        <div className="coord-action-right-warehouse">
                            <button className="coord-btn-book" onClick={() => alert('Ресурси успішно заброньовано під активні заявки!')}>ЗАБРОНЮВАТИ</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}