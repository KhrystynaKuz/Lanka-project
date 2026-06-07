import React from 'react';

export default function ChatsTab() {
    return (
        <div className="fullscreen-chat-mode fade-in">
            <div className="chat-layout-container">

                {/* ЛІВА ЧАСТИНА: КОРИСТУВАЧІ */}
                <div className="chat-sidebar-glass">
                    <div className="chat-search-box">
                        <input type="text" placeholder="Пошук координатора..." />
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

                {/* ПРАВА ЧАСТИНА: ВІКНО ЧАТУ */}
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
                            <div className="msg-bubble">Вітаю! Ми прийняли вашу заявку в роботу. Уточнюємо логістику.</div>
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
                            <input type="text" placeholder="Напишіть повідомлення..." />
                        </div>
                        <button className="btn-send-message">➔</button>
                    </div>
                </div>

            </div>
        </div>
    );
}