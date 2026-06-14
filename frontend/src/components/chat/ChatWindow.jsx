// frontend/src/components/chat/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';

export default function ChatWindow({ chatId }) {
    const { user } = useAuth();
    const { messages, loading, sendMessage } = useMessages(chatId);
    const [newMsg, setNewMsg] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!chatId) {
        return <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat</div>;
    }

    const handleSend = (e) => {
        e.preventDefault();
        if (newMsg.trim()) {
            sendMessage(newMsg.trim());
            setNewMsg('');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && <p>Loading messages...</p>}
                {messages.map((msg) => {
                    // 1. Handle System Messages
                    if (msg.is_system_message) {
                        return (
                            <div key={msg.id} className="flex justify-center my-4">
                                <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">
                                    {msg.content}
                                </span>
                            </div>
                        );
                    }

                    // 2. Handle Regular Messages
                    const isOwn = msg.sender_id === user?.id;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                <span className="text-xs opacity-75">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                <textarea
                    placeholder="Напишіть повідомлення..."
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                    rows={1}
                    style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        padding: '10px',
                        resize: 'none',
                        maxHeight: '100px'
                    }}
                    className="border rounded-lg"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                    Send
                </button>
            </form>
        </div>
    );
}