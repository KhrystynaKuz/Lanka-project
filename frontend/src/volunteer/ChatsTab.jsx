import React from 'react';

export default function ChatsTab() {
    const chatChannels = [
        { id: 123, title: "ЗАЯВКА №123 (Медицина)", preview: "Ви: Доброго дня! Переглядаю вашу заявку...", time: "14:45", active: true },
        { id: 119, title: "ЗАЯВКА №119 (Авто)", preview: "Сергій: Машину повністю завантажили", time: "Вчора" },
        { id: 0, title: "Загальний чат волонтерів", preview: "Ольга: Хто має вільний час завтра зранку?", time: "2 дн." }
    ];

    return (
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
    );
}