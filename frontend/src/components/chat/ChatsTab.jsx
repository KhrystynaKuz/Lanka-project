// frontend/src/components/chat/ChatsTab.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Chats.css';
import { useChats } from '../../hooks/useChats';
import { useMessages } from '../../hooks/useMessages';
import NewChatModal from '../../components/chat/NewChatModal';
import GroupSettingsModal from '../../components/chat/GroupSettingsModal';
import OrderDetailsModal from './OrderDetailsModal'; // Make sure this file exists in the same folder
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';

export default function ChatsTab() {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;
    const isHeadOrCoord = ['HEAD', 'COORDINATOR'].includes(user?.role);

    const { chats, loading: chatsLoading } = useChats(userId);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ACTIVE');

    const { messages, loading: msgsLoading, hasMore, loadMore, sendMessage } = useMessages(selectedChatId);

    const [showNewChat, setShowNewChat] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(null);

    const [newMessage, setNewMessage] = useState('');
    const fileInputRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);

    const selectedChat = chats.find(c => c.id === selectedChatId) || null;

    const filteredChats = chats.filter(chat => {
        const title = chat.type === 'DIRECT' ? chat.displayName : chat.name;
        const matchesSearch = title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ACTIVE' ? !chat.is_archived : chat.is_archived;
        return matchesSearch && matchesTab;
    });

    useEffect(() => {
        if (messages.length > 0 && !msgsLoading) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages.length, msgsLoading]);

    useEffect(() => {
        if (selectedChatId && userId) {
            supabase.rpc('mark_chat_as_read', { p_chat_id: selectedChatId, p_user_id: userId }).then();
        }
    }, [selectedChatId, userId, messages.length]);

    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMore && !msgsLoading) {
            loadMore();
        }
    };

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    const handleToggleArchive = async () => {
        if (!selectedChat) return;
        const newStatus = !selectedChat.is_archived;

        const { error } = await supabase
            .from('chats')
            .update({ is_archived: newStatus })
            .eq('id', selectedChat.id);

        if (!error) {
            setActiveTab(newStatus ? 'ARCHIVED' : 'ACTIVE');
            setSelectedChatId(null);
        } else {
            console.error("Failed to archive chat:", error);
            alert("Помилка архівації чату.");
        }
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
                            placeholder="🔍 Пошук..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
                        <button
                            style={{ flex: 1, padding: '10px', background: activeTab === 'ACTIVE' ? '#e0e0e0' : 'transparent', border: 'none', cursor: 'pointer' }}
                            onClick={() => { setActiveTab('ACTIVE'); setSelectedChatId(null); }}
                        >Активні</button>
                        <button
                            style={{ flex: 1, padding: '10px', background: activeTab === 'ARCHIVED' ? '#e0e0e0' : 'transparent', border: 'none', cursor: 'pointer' }}
                            onClick={() => { setActiveTab('ARCHIVED'); setSelectedChatId(null); }}
                        >Архів</button>
                    </div>

                    {isHeadOrCoord && (
                        <button onClick={() => setShowNewChat(true)} className="new-chat-btn" style={{ margin: '8px', padding: '8px', background: '#4caf50', color: 'white', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>
                            + Новий чат
                        </button>
                    )}

                    <div className="chat-list" style={{ overflowY: 'auto', flex: 1 }}>
                        {chatsLoading ? (
                            <p style={{padding: '10px'}}>Завантаження...</p>
                        ) : filteredChats.length === 0 ? (
                            <p style={{padding: '10px', color: '#888'}}>Немає чатів</p>
                        ) : (
                            filteredChats.map((chat) => {
                                const isUnread = chat.last_msg_at > chat.last_read_at;
                                return (
                                    <div
                                        className={`channel-item ${chat.id === selectedChatId ? 'active' : ''}`}
                                        key={chat.id}
                                        onClick={() => setSelectedChatId(chat.id)}
                                    >
                                        <div className="channel-meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="channel-title" style={{ fontWeight: isUnread ? 'bold' : 'normal' }}>
                                                {isUnread && <span style={{color: 'red'}}>🔴 </span>}
                                                {chat.type === 'DIRECT' ? chat.displayName : chat.name || 'Груповий чат'}
                                            </span>
                                        </div>
                                        <div className="channel-preview text-sm truncate opacity-75">
                                            {chat.preview || '...'}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="chat-main">
                    {selectedChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-info">
                                    <h3>{selectedChat.type === 'DIRECT' ? selectedChat.displayName : selectedChat.name}</h3>
                                    <span className="chat-status" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                                        <button
                                            onClick={handleToggleArchive}
                                            style={{ fontSize: '0.8rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '12px', border: 'none', background: selectedChat.is_archived ? '#4caf50' : '#ff9800', color: 'white' }}
                                        >
                                            {selectedChat.is_archived ? '⬆️ Розархівувати' : '⬇️ В архів'}
                                        </button>
                                        {selectedChat.type === 'GROUP' && (
                                            <button onClick={() => setShowGroupSettings(true)} style={{fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: 'none'}}>
                                                ⚙️ Налаштування
                                            </button>
                                        )}
                                    </span>
                                </div>
                                {selectedChat.order_id && (
                                    <button className="info-btn" onClick={() => setShowOrderDetails(selectedChat.order_id)}>
                                        Деталі заявки #{selectedChat.order_id.substring(0, 8)}
                                    </button>
                                )}
                            </div>

                            <div
                                className="chat-messages"
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                style={{ overflowY: 'auto', flex: 1, padding: '16px' }}
                            >
                                {hasMore && <div style={{textAlign: 'center', color: '#888', fontSize: '12px'}}>Завантаження історії...</div>}
                                {messages.length === 0 && !msgsLoading ? (
                                    <p style={{textAlign: 'center', color: '#888'}}>Почніть спілкування!</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.sender_id === userId;
                                        const senderName = msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Користувач';
                                        return (
                                            <div key={msg.id} className={`msg ${isOwn ? 'outgoing' : 'incoming'}`}>
                                                {!isOwn && <span className="msg-author">{senderName}</span>}
                                                <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                                                    {msg.content}
                                                </div>
                                                <span className="msg-time">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedChat.is_archived ? (
                                <div style={{ padding: '20px', textAlign: 'center', background: '#f5f5f5', color: '#888' }}>
                                    Цей чат архівовано. Ви не можете надсилати сюди повідомлення.
                                </div>
                            ) : (
                                <div className="chat-footer">
                                    <form style={{ display: 'flex', width: '100%', gap: '8px' }}>
                                        <div className="input-wrap" style={{ display: 'flex', flex: 1, alignItems: 'center', background: '#f1f1f1', borderRadius: '20px', padding: '5px 15px' }}>
                                            <textarea
                                                placeholder="Напишіть повідомлення (Shift+Enter для нового рядка)..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend();
                                                    }
                                                }}
                                                style={{
                                                    flex: 1, border: 'none', background: 'transparent', outline: 'none',
                                                    padding: '10px', resize: 'none', maxHeight: '100px', fontFamily: 'inherit'
                                                }}
                                                rows={1}
                                            />
                                        </div>
                                        <button type="button" onClick={handleSend} className="send-btn" style={{ borderRadius: '50%', width: '45px', height: '45px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}>
                                            ➔
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                            Оберіть чат або почніть новий
                        </div>
                    )}
                </div>
            </div>

            {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onChatCreated={(id) => { setSelectedChatId(id); setShowNewChat(false); }} />}
            {showGroupSettings && selectedChat && <GroupSettingsModal chatId={selectedChat.id} onClose={() => setShowGroupSettings(false)} />}
            {showOrderDetails && <OrderDetailsModal orderId={showOrderDetails} onClose={() => setShowOrderDetails(null)} />}
        </div>
    );
}