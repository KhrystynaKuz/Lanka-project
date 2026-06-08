import React from 'react';
import './Coordinator.css';

export default function ChatsTab() {
    const chatChannels = [
        { id: 123, title: "ЗАЯВКА №123 (Медицина)", preview: "Марія П.: Коли очікувати доставку?", time: "14:40", active: true },
        { id: 10, title: "Волонтер: Олексій (Завдання №10)", preview: "Ви: Олексій, уточни деталі по складу", time: "Вчора" }
    ];

    return (
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
    );
}