import React from 'react';

export default function ChatsTab() {
    return (
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
                            <span className="channel-preview">Ви: Доброго дня! Переглядаю вашу заявку...</span>
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
                            <span className="channel-preview">Ольга: Хто має вільний час завтра зранку?</span>
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
                            <div className="msg-bubble">Вітання! Документи завантажили, підкажіть коли чекати на затвердження комісії?</div>
                            <span className="msg-time">14:32</span>
                        </div>

                        <div className="message incoming">
                            <span className="msg-author">Петро Борисович (Замовник)</span>
                            <div className="msg-bubble">Додали також офіційне звернення від головного лікаря.</div>
                            <span className="msg-time">14:33</span>
                        </div>

                        <div className="message outgoing">
                            <span className="msg-author">Ви (Голова)</span>
                            <div className="msg-bubble">Доброго дня! Переглядаю вашу заявку. Зараз призначимо медичний відділ для збору коштів.</div>
                            <span className="msg-time">14:45</span>
                        </div>
                    </div>

                    {/* Нижня панель введення тексту */}
                    <div className="chat-input-footer-row">
                        <div className="input-wrap-glass">
                            <button className="btn-attach-file" title="Додати документи або photo">📎</button>
                            <input type="text" placeholder="Напишіть повідомлення волонтерам або замовнику..."/>
                        </div>
                        <button className="btn-send-message" title="Відправити">➔</button>
                    </div>
                </div>

            </div>
        </div>
    );
}