// frontend/src/components/chat/ChatsTab.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Chats.css';
import { useChats } from '../../hooks/useChats';
import { useMessages } from '../../hooks/useMessages';
import NewChatModal from '../../components/chat/NewChatModal';
import GroupSettingsModal from '../../components/chat/GroupSettingsModal';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';

export default function ChatsTab({ initialChatId }) {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;
    const isHeadOrCoord = ['HEAD', 'COORDINATOR'].includes(user?.role);

    const { chats, loading: chatsLoading } = useChats(userId);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ACTIVE');

    useEffect(() => {
        if (initialChatId) {
            setSelectedChatId(initialChatId);
        }
    }, [initialChatId]);

    const { messages, loading: msgsLoading, hasMore, loadMore, sendMessage } = useMessages(selectedChatId);

    const [showNewChat, setShowNewChat] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);

    const [newMessage, setNewMessage] = useState('');

    // NEW: File upload state and ref
    const [isUploading, setIsUploading] = useState(false);
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

    const toggleArchiveChat = async (chatId, willArchive, currentUser) => {
        try {
            const { error: updateError } = await supabase
                .from('chat_members')
                .update({ is_archived: willArchive })
                .eq('chat_id', chatId)
                .eq('user_id', currentUser.id);

            if (updateError) throw updateError;
            setSelectedChatId(null);
        } catch (error) {
            console.error("Error toggling archive status:", error);
        }
    };

    const handleToggleArchive = () => {
        if (!selectedChat || !user) return;
        const willArchive = !selectedChat.is_archived;
        toggleArchiveChat(selectedChat.id, willArchive, user);
    };

    // FIXED: File upload function
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);

            // Create a unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${selectedChatId}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('chat-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            // Send message with attachment
            await sendMessage({
                content: newMessage.trim(), // Keep typed text if any
                attachment_url: publicUrl
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error uploading file:", error.message);
            alert("Помилка завантаження файлу!");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Helper to check if file is an image based on URL extension
    const isImageUrl = (url) => {
        if (!url) return false;
        return url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null;
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
                                        if (msg.is_system_message) {
                                            return (
                                                <div key={msg.id} style={{ textAlign: 'center', margin: '16px 0' }}>
                                                    <span style={{
                                                        background: '#e0e0e0',
                                                        color: '#555',
                                                        padding: '6px 12px',
                                                        borderRadius: '16px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {msg.content}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        const isOwn = msg.sender_id === userId;
                                        const senderName = msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Користувач';

                                        return (
                                            <div key={msg.id} className={`msg ${isOwn ? 'outgoing' : 'incoming'}`}>
                                                {!isOwn && <span className="msg-author">{senderName}</span>}

                                                <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap', position: 'relative' }}>
                                                    {/* Text content if available */}
                                                    {msg.content && <div>{msg.content}</div>}

                                                    {/* Attachment Rendering */}
                                                    {msg.attachment_url && (
                                                        <div style={{ marginTop: msg.content ? '8px' : '0' }}>
                                                            {isImageUrl(msg.attachment_url) ? (
                                                                <img
                                                                    src={msg.attachment_url}
                                                                    alt="Додаток"
                                                                    style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer' }}
                                                                    onClick={() => window.open(msg.attachment_url, '_blank')}
                                                                />
                                                            ) : (
                                                                <a
                                                                    href={msg.attachment_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ color: isOwn ? '#fff' : '#007bff', textDecoration: 'underline', wordBreak: 'break-all' }}
                                                                >
                                                                    📎 Вкладений файл
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
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
                                        <div className="input-wrap" style={{ display: 'flex', flex: 1, alignItems: 'center', background: '#f1f1f1', borderRadius: '20px', padding: '5px 15px', gap: '8px' }}>

                                            {/* NEW: Hidden file input and visible Paperclip button */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                style={{ display: 'none' }}
                                                onChange={handleFileUpload}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '0 5px' }}
                                                title="Прикріпити файл"
                                            >
                                                {isUploading ? '⌛' : '📎'}
                                            </button>

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
                                                    padding: '10px 0', resize: 'none', maxHeight: '100px', fontFamily: 'inherit'
                                                }}
                                                rows={1}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSend}
                                            disabled={isUploading}
                                            className="send-btn"
                                            style={{ borderRadius: '50%', width: '45px', height: '45px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}
                                        >
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
        </div>
    );
}