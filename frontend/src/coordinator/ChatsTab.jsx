import React, { useState } from 'react';
import './Coordinator.css';
import { useAuth } from '../hooks/useAuth.js';
import { useChats } from '../hooks/useChats';
import { useMessages } from '../hooks/useMessages';
import NewChatModal from '../components/chat/NewChatModal';

export default function ChatsTab() {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;

    const { chats, loading: chatsLoading } = useChats(userId);
    const [selectedChatId, setSelectedChatId] = useState(null);

    const { messages, loading: msgsLoading, sendMessage } = useMessages(selectedChatId);
    const [showNewChat, setShowNewChat] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    // FIX: Add a fallback so the UI renders immediately before the hook refetches
    const selectedChat = chats.find(c => c.id === selectedChatId) ||
        (selectedChatId ? { id: selectedChatId, type: 'DIRECT', displayName: 'Завантаження...', name: 'Завантаження...' } : null);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    if (authLoading) return <div className="coord-fullscreen-chat">Завантаження...</div>;
    if (!user) return <div className="coord-fullscreen-chat">Будь ласка, увійдіть у систему.</div>;

    return (
        <div className="coord-fullscreen-chat">
            <div className="coord-chat-layout">
                {/* Sidebar */}
                <div className="coord-chat-sidebar">
                    <div className="coord-chat-search">
                        <input type="text" placeholder="🔍 Пошук чату або заявки..." />
                    </div>
                    <button
                        onClick={() => setShowNewChat(true)}
                        style={{ margin: '8px', padding: '8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + Новий чат
                    </button>
                    <div className="coord-chat-list">
                        {chatsLoading ? (
                            <p>Завантаження...</p>
                        ) : chats.length === 0 ? (
                            <p>Немає чатів</p>
                        ) : (
                            chats.map((chat) => (
                                <div
                                    className={`coord-channel-item ${chat.id === selectedChatId ? 'active' : ''}`}
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                >
                                    <div className="coord-channel-meta">
                                        <span className="coord-channel-title">
                                          {chat.type === 'DIRECT' ? chat.displayName : chat.name || 'Груповий чат'}
                                        </span>
                                        <span className="coord-channel-time">
                                          {chat.created_at ? new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="coord-channel-preview">{chat.preview}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main chat area */}
                <div className="coord-chat-main">
                    {selectedChat ? (
                        <>
                            <div className="coord-chat-header">
                                <div className="coord-chat-header-info">
                                    <h3>
                                        {selectedChat.type === 'DIRECT' ? selectedChat.displayName : selectedChat.name || 'Груповий чат'}
                                    </h3>
                                    <span className="coord-chat-status">
                                        {selectedChat.type === 'DIRECT' ? 'Діалог' : 'Груповий чат'}
                                    </span>
                                </div>
                                <button className="coord-info-btn" disabled>
                                    ПЕРЕГЛЯНУТИ інформацію по заявці
                                </button>
                            </div>

                            <div className="coord-chat-messages">
                                {msgsLoading ? (
                                    <p>Завантаження повідомлень...</p>
                                ) : messages.length === 0 ? (
                                    <p style={{textAlign: 'center', color: '#888', marginTop: '20px'}}>Немає повідомлень. Почніть спілкування!</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.sender_id === userId;
                                        const senderName = msg.sender
                                            ? `${msg.sender.first_name} ${msg.sender.last_name}`
                                            : 'Користувач';
                                        return (
                                            <div key={msg.id} className={`coord-msg ${isOwn ? 'outgoing' : 'incoming'}`}>
                                                {!isOwn && <span className="coord-msg-author">{senderName}</span>}
                                                <div className="coord-msg-bubble">{msg.content}</div>
                                                <span className="coord-msg-time">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="coord-chat-footer">
                                <form onSubmit={handleSend} style={{ display: 'flex', width: '100%' }}>
                                    <div className="coord-input-wrap">
                                        <button type="button" className="coord-attach-btn">📎</button>
                                        <input
                                            type="text"
                                            placeholder="Повідомлення..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="coord-send-btn">➔</button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                            Оберіть чат
                        </div>
                    )}
                </div>
            </div>

            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onChatCreated={(chatId) => {
                        setSelectedChatId(chatId);
                        setShowNewChat(false);
                    }}
                />
            )}
        </div>
    );
}