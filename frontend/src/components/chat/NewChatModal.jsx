import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function NewChatModal({ onClose, onChatCreated }) {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const searchUsers = async (query) => {
        const safeQuery = query.replace(/[,"]/g, '').trim();

        if (safeQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);

        const { data, error } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .or(`first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%`)
            .limit(10);

        if (error) {
            console.error("Error searching users:", error);
        }

        setResults(data || []);
        setLoading(false);
    };

    const startDirectChat = async (otherUserId) => {
        if (!user) return;
        const { data } = await supabase.rpc('get_or_create_direct_chat', {
            user1_id: user.id,
            user2_id: otherUserId,
        });
        if (data) {
            onChatCreated(data);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '8px',
                width: '400px', maxHeight: '80vh', overflowY: 'auto'
            }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Новий чат</h3>

                <input
                    type="text"
                    placeholder="Пошук користувача..."
                    value={search}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSearch(val);

                        // Clear the previous timeout if the user is still typing
                        if (searchTimeout) clearTimeout(searchTimeout);

                        // Wait 300ms after they stop typing before hitting the database
                        setSearchTimeout(setTimeout(() => {
                            searchUsers(val);
                        }, 300));
                    }}
                    style={{ width: '100%', padding: '8px', marginBottom: '16px', boxSizing: 'border-box' }}
                />
                {loading && <p>Пошук...</p>}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {results.map((u) => (
                        <div
                            key={u.id}
                            onClick={() => startDirectChat(u.id)}
                            style={{
                                padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <span>{u.first_name} {u.last_name}</span>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}>Скасувати</button>
            </div>
        </div>
    );
}