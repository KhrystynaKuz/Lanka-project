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
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                msg.sender_id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                            }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                            <span className="text-xs opacity-75">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-3 py-2"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                    Send
                </button>
            </form>
        </div>
    );
}