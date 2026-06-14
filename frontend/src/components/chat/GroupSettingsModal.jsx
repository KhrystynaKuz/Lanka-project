import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function GroupSettingsModal({ chatId, onClose }) {
    const { user } = useAuth();

    // State for Name
    const [chatName, setChatName] = useState('');
    const [originalName, setOriginalName] = useState('');

    // State for Members
    const [members, setMembers] = useState([]);
    const [originalMembers, setOriginalMembers] = useState([]);

    // State for Search & UI
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch current chat details and members on load
    useEffect(() => {
        const fetchDetails = async () => {
            const { data: chatData } = await supabase
                .from('chats')
                .select('name')
                .eq('id', chatId)
                .single();

            if (chatData) {
                setChatName(chatData.name || '');
                setOriginalName(chatData.name || '');
            }

            const { data: memberData } = await supabase
                .from('chat_members')
                .select('user_id, users(first_name, last_name, role)')
                .eq('chat_id', chatId);

            if (memberData) {
                const formattedMembers = memberData.map(m => ({ id: m.user_id, ...m.users }));
                setMembers(formattedMembers);
                setOriginalMembers(formattedMembers);
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

            // Filter out people who are ALREADY in the local members array
            const filtered = data?.filter(u => !members.some(m => m.id === u.id)) || [];
            setSearchResults(filtered);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search, members]);

    // UI Action: Add user to local state
    const handleAddUser = (newUser) => {
        setMembers([...members, newUser]);
        setSearch('');
        setSearchResults([]);
    };

    // UI Action: Remove user from local state
    const handleRemoveUser = (userId) => {
        setMembers(members.filter(m => m.id !== userId));
    };

    // DB Action: Save all changes at once
    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // 1. Save Name Change (if modified)
            if (chatName !== originalName && chatName.trim() !== '') {
                await supabase.from('chats').update({ name: chatName }).eq('id', chatId);
                await supabase.from('messages').insert({
                    chat_id: chatId,
                    content: `✏️ ${user.first_name} змінив(ла) назву групи на "${chatName}"`,
                    sender_id: user.id
                });
            }

            // 2. Figure out exactly who was added and who was removed
            const addedMembers = members.filter(m => !originalMembers.some(om => om.id === m.id));
            const removedMembers = originalMembers.filter(om => !members.some(m => m.id === om.id));

            // 3. Process Additions
            for (const added of addedMembers) {
                const { error: insertError } = await supabase
                    .from('chat_members')
                    .insert({ chat_id: chatId, user_id: added.id });

                // ONLY send the system message if the addition was actually successful
                if (!insertError) {
                    await supabase.from('messages').insert({
                        chat_id: chatId,
                        content: `👋 ${user.first_name} додав(ла) ${added.first_name} до чату`,
                        sender_id: user.id
                    });
                } else {
                    console.error("Помилка додавання користувача:", insertError);
                    throw new Error("Не вдалося додати користувача");
                }
            }

            // 4. Process Removals
            for (const removed of removedMembers) {
                const { error: deleteError } = await supabase
                    .from('chat_members')
                    .delete()
                    .match({ chat_id: chatId, user_id: removed.id });

                // ONLY send the system message if the deletion was actually successful
                if (!deleteError) {
                    await supabase.from('messages').insert({
                        chat_id: chatId,
                        content: `🚪 ${removed.first_name} видалено з чату`,
                        sender_id: user.id
                    });
                } else {
                    console.error("Помилка видалення користувача:", deleteError);
                    throw new Error("Не вдалося видалити користувача");
                }
            }

            onClose(); // Close modal after successful save
        } catch (error) {
            console.error("Помилка при збереженні:", error);
            alert("Сталася помилка при збереженні налаштувань. Перевірте консоль.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="modal-overlay fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <h3 className="modal-title" style={{ marginTop: 0, marginBottom: '20px' }}>Налаштування групи</h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                        НАЗВА ГРУПИ
                    </label>
                    <input
                        className="modal-input"
                        value={chatName}
                        onChange={(e) => setChatName(e.target.value)}
                        placeholder="Введіть назву..."
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                        УЧАСНИКИ
                    </label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px' }}>
                        {members.map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ fontSize: '14px' }}>{m.first_name} {m.last_name} <small style={{color: '#888'}}>({m.role})</small></span>
                                {m.id !== user.id && (
                                    <button
                                        onClick={() => handleRemoveUser(m.id)}
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
                        placeholder="Пошук та додавання користувача..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    {searchResults.length > 0 && (
                        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '5px', overflow: 'hidden' }}>
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

                {/* Unified Action Buttons */}
                <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button onClick={onClose} disabled={saving} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Скасувати
                    </button>
                    <button onClick={handleSaveAll} disabled={saving} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        {saving ? 'Збереження...' : 'Зберегти зміни'}
                    </button>
                </div>
            </div>
        </div>
    );
}