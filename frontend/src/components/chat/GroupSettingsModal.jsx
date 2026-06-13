import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function GroupSettingsModal({ chatId, onClose }) {
    const { user } = useAuth();
    const [chatName, setChatName] = useState('');
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch current chat details and members
    useEffect(() => {
        const fetchDetails = async () => {
            // Get chat name
            const { data: chatData } = await supabase
                .from('chats')
                .select('name')
                .eq('id', chatId)
                .single();

            if (chatData) setChatName(chatData.name || '');

            // Get members
            const { data: memberData } = await supabase
                .from('chat_members')
                .select('user_id, users(first_name, last_name, role)')
                .eq('chat_id', chatId);

            if (memberData) {
                setMembers(memberData.map(m => ({ id: m.user_id, ...m.users })));
            }
            setLoading(false);
        };

        fetchDetails();
    }, [chatId]);

    // Search for new users to add
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (search.length < 2) {
                setSearchResults([]);
                return;
            }
            const { data } = await supabase
                .from('users')
                .select('id, first_name, last_name, role')
                .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
                .limit(5);

            // Filter out people already in the group
            const filtered = data?.filter(u => !members.some(m => m.id === u.id)) || [];
            setSearchResults(filtered);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search, members]);

    const handleSaveName = async () => {
        if (!chatName.trim()) return;
        await supabase.from('chats').update({ name: chatName }).eq('id', chatId);
        // Add a system message about the rename
        await supabase.from('messages').insert({
            chat_id: chatId,
            content: `${user.first_name} змінив(ла) назву групи на "${chatName}"`,
            is_system: true,
            sender_id: user.id
        });
    };

    const handleAddUser = async (newUser) => {
        await supabase.from('chat_members').insert({ chat_id: chatId, user_id: newUser.id });
        setMembers([...members, newUser]);
        setSearch('');
        setSearchResults([]);

        await supabase.from('messages').insert({
            chat_id: chatId,
            content: `${user.first_name} додав(ла) ${newUser.first_name} до чату`,
            is_system: true,
            sender_id: user.id
        });
    };

    const handleRemoveUser = async (userId, userName) => {
        await supabase.from('chat_members').delete().match({ chat_id: chatId, user_id: userId });
        setMembers(members.filter(m => m.id !== userId));

        await supabase.from('messages').insert({
            chat_id: chatId,
            content: `${userName} видалено з чату`,
            is_system: true,
            sender_id: user.id
        });
    };

    if (loading) return null;

    return (
        <div className="modal-overlay fade-in">
            <div className="modal-content">
                <h3 className="modal-title">Налаштування групи</h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                        НАЗВА ГРУПИ
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            className="modal-input"
                            value={chatName}
                            onChange={(e) => setChatName(e.target.value)}
                            placeholder="Введіть назву..."
                        />
                        <button className="btn-save" style={{ width: 'auto', marginBottom: 0 }} onClick={handleSaveName}>
                            OK
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                        УЧАСНИКИ
                    </label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '10px', padding: '8px' }}>
                        {members.map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ fontSize: '14px' }}>{m.first_name} {m.last_name} <small style={{color: '#888'}}>({m.role})</small></span>
                                {m.id !== user.id && (
                                    <button
                                        onClick={() => handleRemoveUser(m.id, m.first_name)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input
                        className="modal-input"
                        placeholder="Додати користувача..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                        <div style={{ border: '1px solid #d1d5db', borderRadius: '10px', marginTop: '5px', overflow: 'hidden' }}>
                            {searchResults.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => handleAddUser(u)}
                                    style={{ padding: '10px', cursor: 'pointer', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}
                                >
                                    + Додати {u.first_name} {u.last_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose} style={{ marginBottom: 0 }}>
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
}