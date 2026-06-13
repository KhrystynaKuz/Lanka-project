import React, { useState, useRef, useEffect } from 'react';
import './Chats.css';
import { useChats } from '../../hooks/useChats';
import { useMessages } from '../../hooks/useMessages';
import NewChatModal from '../../components/chat/NewChatModal';
import GroupSettingsModal from '../../components/chat/GroupSettingsModal';
import { useAuth } from '../../hooks/useAuth';

export default function ChatsTab() {
    const { user, loading: authLoading } = useAuth();
    console.log("Current user:", user)
    const userId = user?.id;

    // Derived role from your auth hook or user object
    const isHeadOrCoord = ['HEAD', 'COORDINATOR'].includes(user?.role);

    const { chats, loading: chatsLoading } = useChats(userId);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { messages, loading: msgsLoading, sendMessage } = useMessages(selectedChatId);

    // Modal states
    const [showNewChat, setShowNewChat] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const selectedChat = chats.find(c => c.id === selectedChatId) || null;

    // Filter chats locally based on search term
    const filteredChats = chats.filter(chat => {
        const title = chat.type === 'DIRECT' ? chat.displayName : chat.name;
        return title?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Handle Supabase Storage upload here, then send message with file URL
        console.log("File selected for upload:", file.name);
    };

    if (authLoading) return <div className="fullscreen-chat">Завантаження...</div>;
    if (!user) return <div className="fullscreen-chat">Будь ласка, увійдіть у систему.</div>;

    return (
        <div className="fullscreen-chat fade-in">
            <div className="chat-layout">

                {/* Sidebar */}
                <div className="chat-sidebar">
                    <div className="chat-search">
                        <input
                            type="text"
                            placeholder="🔍 Пошук чату або заявки..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {isHeadOrCoord && (
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="new-chat-btn"
                            style={{ margin: '8px', padding: '8px', background: '#4caf50', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            + Новий чат
                        </button>
                    )}

                    <div className="chat-list">
                        {chatsLoading ? (
                            <p style={{padding: '10px'}}>Завантаження...</p>
                        ) : filteredChats.length === 0 ? (
                            <p style={{padding: '10px', color: '#888'}}>Немає чатів</p>
                        ) : (
                            filteredChats.map((chat) => (
                                <div
                                    className={`channel-item ${chat.id === selectedChatId ? 'active' : ''}`}
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                >
                                    <div className="channel-meta">
                                        <span className="channel-title">
                                          {chat.type === 'DIRECT' ? chat.displayName : chat.name || 'Груповий чат'}
                                        </span>
                                        <span className="channel-time">
                                          {chat.created_at ? new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="channel-preview text-sm truncate opacity-75">
                                        {chat.preview || 'Немає повідомлень'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="chat-main">
                    {selectedChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-info">
                                    <h3>
                                        {selectedChat.type === 'DIRECT' ? selectedChat.displayName : selectedChat.name || 'Груповий чат'}
                                    </h3>
                                    <span className="chat-status">
                                        {selectedChat.type === 'GROUP' && (
                                            <button onClick={() => setShowGroupSettings(true)} style={{fontSize: '0.8rem', marginLeft: '10px'}}>
                                                ⚙️ Налаштування групи
                                            </button>
                                        )}
                                    </span>
                                </div>
                                {/* ONLY SHOW IF THIS CHAT IS LINKED TO AN ORDER */}
                                {selectedChat.order_id && (
                                    <button className="info-btn">
                                        Деталі заявки #{selectedChat.order_id}
                                    </button>
                                )}
                            </div>

                            <div className="chat-messages" style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
                                {msgsLoading ? (
                                    <p>Завантаження повідомлень...</p>
                                ) : messages.length === 0 ? (
                                    <p style={{textAlign: 'center', color: '#888'}}>Почніть спілкування!</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.sender_id === userId;
                                        const senderName = msg.sender
                                            ? `${msg.sender.first_name} ${msg.sender.last_name}`
                                            : 'Користувач';
                                        return (
                                            <div key={msg.id} className={`msg ${isOwn ? 'outgoing' : 'incoming'}`}>
                                                {!isOwn && <span className="msg-author">{senderName}</span>}
                                                <div className="msg-bubble">{msg.content}</div>
                                                <span className="msg-time">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-footer">
                                <form onSubmit={handleSend} style={{ display: 'flex', width: '100%', gap: '8px' }}>
                                    <div className="input-wrap" style={{ display: 'flex', flex: 1, alignItems: 'center', background: '#f1f1f1', borderRadius: '20px', padding: '5px 15px' }}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />
                                        <button
                                            type="button"
                                            className="attach-btn"
                                            onClick={() => fileInputRef.current.click()}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                        >
                                            📎
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Напишіть повідомлення..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '10px' }}
                                        />
                                    </div>
                                    <button type="submit" className="send-btn" style={{ borderRadius: '50%', width: '45px', height: '45px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}>
                                        ➔
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                            Оберіть чат або почніть новий
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onChatCreated={(chatId) => {
                        setSelectedChatId(chatId);
                        setShowNewChat(false);
                    }}
                />
            )}

            {showGroupSettings && selectedChat && (
                <GroupSettingsModal
                    chatId={selectedChat.id}
                    onClose={() => setShowGroupSettings(false)}
                />
            )}
        </div>
    );
}