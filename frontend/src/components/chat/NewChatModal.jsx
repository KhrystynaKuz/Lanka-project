import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function NewChatModal({ onClose, onChatCreated }) {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Group Chat State
    const [isGroup, setIsGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    const searchUsers = async (query) => {
        const safeQuery = query.replace(/[,"]/g, '').trim();
        if (safeQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, role')
            .or(`first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%`)
            .neq('id', user.id) // Don't search yourself
            .limit(10);

        if (error) console.error("Search error:", error);
        setResults(data || []);
        setLoading(false);
    };

    const handleUserSelect = async (selectedUser) => {
        if (!isGroup) {
            // Direct Chat Logic
            const { data, error } = await supabase.rpc('get_or_create_direct_chat', {
                user1_id: user.id,
                user2_id: selectedUser.id,
            });
            if (data && !error) onChatCreated(data);
        } else {
            // Group Chat Logic - add to array
            if (!selectedUsers.find(u => u.id === selectedUser.id)) {
                setSelectedUsers([...selectedUsers, selectedUser]);
            }
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;

        // You'll need a custom RPC function in Supabase to handle group creation & adding participants
        const { data, error } = await supabase.rpc('create_group_chat', {
            creator_id: user.id,
            chat_name: groupName,
            participant_ids: selectedUsers.map(u => u.id)
        });

        if (data && !error) onChatCreated(data);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Новий чат</h3>
                    <div>
                        <label>
                            <input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} />
                            Груповий
                        </label>
                    </div>
                </div>

                {isGroup && (
                    <input
                        type="text"
                        placeholder="Назва групи..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                    />
                )}

                {/* Selected Users Pills for Group */}
                {isGroup && selectedUsers.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                        {selectedUsers.map(u => (
                            <span key={u.id} style={{ background: '#e0e0e0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                {u.first_name} <span style={{cursor: 'pointer', color: 'red'}} onClick={() => setSelectedUsers(selectedUsers.filter(su => su.id !== u.id))}>×</span>
                            </span>
                        ))}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Пошук користувача..."
                    value={search}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSearch(val);
                        if (searchTimeout) clearTimeout(searchTimeout);
                        setSearchTimeout(setTimeout(() => searchUsers(val), 300));
                    }}
                    style={{ width: '100%', padding: '8px', marginBottom: '16px', boxSizing: 'border-box' }}
                />

                <div style={{ flex: 1, overflowY: 'auto', minHeight: '150px' }}>
                    {results.map((u) => (
                        <div
                            key={u.id}
                            onClick={() => handleUserSelect(u)}
                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                        >
                            {u.first_name} {u.last_name} <span style={{fontSize: '10px', color: '#888'}}>({u.role})</span>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer' }}>Скасувати</button>
                    {isGroup && (
                        <button onClick={handleCreateGroup} style={{ padding: '8px 16px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Створити групу
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}