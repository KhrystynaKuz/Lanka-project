import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function GroupSettingsModal({ chatId, onClose }) {
    const { user } = useAuth();

    const [chatName, setChatName] = useState('');
    const [originalName, setOriginalName] = useState('');
    const [members, setMembers] = useState([]);
    const [originalMembers, setOriginalMembers] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Функція для відображення ролі
    const getRoleLabel = (role) => {
        const roles = {
            'HEAD': { icon: '👑', label: 'Голова', color: '#8b5cf6' },
            'COORDINATOR': { icon: '📋', label: 'Координатор', color: '#3b82f6' },
            'VOLUNTEER': { icon: '🤝', label: 'Волонтер', color: '#10b981' },
            'CUSTOMER': { icon: '🛍️', label: 'Замовник', color: '#f59e0b' }
        };
        return roles[role] || { icon: '👤', label: role || 'Користувач', color: '#64748b' };
    };

    // Анімація при відкритті
    useEffect(() => {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

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

            const filtered = data?.filter(u => !members.some(m => m.id === u.id)) || [];
            setSearchResults(filtered);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search, members]);

    const handleAddUser = (newUser) => {
        setMembers([...members, newUser]);
        setSearch('');
        setSearchResults([]);
    };

    const handleRemoveUser = (userId) => {
        setMembers(members.filter(m => m.id !== userId));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            if (chatName !== originalName && chatName.trim() !== '') {
                await supabase.from('chats').update({ name: chatName }).eq('id', chatId);
                await supabase.from('messages').insert({
                    chat_id: chatId,
                    content: `✏️ ${user.first_name} змінив(ла) назву групи на "${chatName}"`,
                    sender_id: user.id,
                    is_system_message: true
                });
            }

            const addedMembers = members.filter(m => !originalMembers.some(om => om.id === m.id));
            const removedMembers = originalMembers.filter(om => !members.some(m => m.id === om.id));

            for (const added of addedMembers) {
                const { error: insertError } = await supabase
                    .from('chat_members')
                    .insert({ chat_id: chatId, user_id: added.id });

                if (!insertError) {
                    await supabase.from('messages').insert({
                        chat_id: chatId,
                        content: `👋 ${user.first_name} додав(ла) ${added.first_name} до чату`,
                        sender_id: user.id,
                        is_system_message: true
                    });
                } else {
                    console.error("Помилка додавання користувача:", insertError);
                    throw new Error("Не вдалося додати користувача");
                }
            }

            for (const removed of removedMembers) {
                const { error: deleteError } = await supabase
                    .from('chat_members')
                    .delete()
                    .match({ chat_id: chatId, user_id: removed.id });

                if (!deleteError) {
                    await supabase.from('messages').insert({
                        chat_id: chatId,
                        content: `🚪 ${removed.first_name} видалено з чату`,
                        sender_id: user.id,
                        is_system_message: true
                    });
                } else {
                    console.error("Помилка видалення користувача:", deleteError);
                    throw new Error("Не вдалося видалити користувача");
                }
            }

            handleClose();
        } catch (error) {
            console.error("Помилка при збереженні:", error);
            alert("Сталася помилка при збереженні налаштувань. Перевірте консоль.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <>
            <style>
                {`
                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: translateY(20px) scale(0.96);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    @keyframes modalSlideOut {
                        from {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                        to {
                            opacity: 0;
                            transform: translateY(20px) scale(0.96);
                        }
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>

            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: isVisible ? 'rgba(30, 58, 138, 0.4)' : 'rgba(30, 58, 138, 0)',
                    backdropFilter: isVisible ? 'blur(6px)' : 'blur(0px)',
                    transition: 'all 0.25s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                onClick={handleClose}
            >
                <div
                    style={{
                        background: 'white',
                        padding: '28px',
                        borderRadius: '28px',
                        width: '480px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        boxSizing: 'border-box',
                        animation: isVisible ? 'modalSlideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards' : 'modalSlideOut 0.2s ease-in forwards'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        paddingBottom: '16px',
                        borderBottom: '2px solid #eef2ff'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '22px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent'
                        }}>
                            ⚙️ Налаштування групи
                        </h3>
                        <button
                            onClick={handleClose}
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                width: '32px',
                                height: '32px',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#64748b',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e2e8f0';
                                e.currentTarget.style.color = '#1e293b';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.color = '#64748b';
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Назва групи */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            fontSize: '12px',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 700,
                            display: 'block',
                            marginBottom: '8px'
                        }}>
                            🏷️ Назва групи
                        </label>
                        <input
                            value={chatName}
                            onChange={(e) => setChatName(e.target.value)}
                            placeholder="Введіть назву групи..."
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s',
                                background: '#f8fafc'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#3b82f6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                e.target.style.background = 'white';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                                e.target.style.background = '#f8fafc';
                            }}
                        />
                    </div>

                    {/* Учасники */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            fontSize: '12px',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 700,
                            display: 'block',
                            marginBottom: '8px'
                        }}>
                            👥 Учасники ({members.length})
                        </label>
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: '#f8fafc',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            padding: '8px'
                        }}>
                            {members.map(m => {
                                const roleInfo = getRoleLabel(m.role);
                                return (
                                    <div
                                        key={m.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            borderBottom: '1px solid #e2e8f0',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div>
                                            <span style={{
                                                fontWeight: 600,
                                                color: '#1e293b',
                                                fontSize: '14px'
                                            }}>
                                                {m.first_name} {m.last_name}
                                            </span>
                                            <span style={{
                                                fontSize: '11px',
                                                color: roleInfo.color,
                                                marginLeft: '8px',
                                                background: `${roleInfo.color}15`,
                                                padding: '2px 8px',
                                                borderRadius: '20px'
                                            }}>
                                                {roleInfo.icon} {roleInfo.label}
                                            </span>
                                        </div>
                                        {m.id !== user.id && (
                                            <button
                                                onClick={() => handleRemoveUser(m.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '20px',
                                                    padding: '4px 8px',
                                                    borderRadius: '30px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#fee2e2';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Пошук та додавання */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            fontSize: '12px',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 700,
                            display: 'block',
                            marginBottom: '8px'
                        }}>
                            🔍 Додати учасника
                        </label>
                        <input
                            placeholder="Введіть ім'я або прізвище..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s',
                                background: '#f8fafc'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#3b82f6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                e.target.style.background = 'white';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                                e.target.style.background = '#f8fafc';
                            }}
                        />
                        {searchResults.length > 0 && (
                            <div style={{
                                marginTop: '8px',
                                background: '#f8fafc',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden'
                            }}>
                                {searchResults.map(u => {
                                    const roleInfo = getRoleLabel(u.role);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => handleAddUser(u)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #e2e8f0',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#eef2ff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <div>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: '#1e293b',
                                                    fontSize: '14px'
                                                }}>
                                                    {u.first_name} {u.last_name}
                                                </span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: roleInfo.color,
                                                    marginLeft: '8px',
                                                    background: `${roleInfo.color}15`,
                                                    padding: '2px 8px',
                                                    borderRadius: '20px'
                                                }}>
                                                    {roleInfo.icon} {roleInfo.label}
                                                </span>
                                            </div>
                                            <button style={{
                                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 14px',
                                                borderRadius: '30px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.02)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}>
                                                ➕ Додати
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Кнопки дій */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '16px',
                        borderTop: '1px solid #eef2ff'
                    }}>
                        <button
                            onClick={handleClose}
                            disabled={saving}
                            style={{
                                padding: '12px 24px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '40px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!saving) e.currentTarget.style.background = '#e2e8f0';
                            }}
                            onMouseLeave={(e) => {
                                if (!saving) e.currentTarget.style.background = '#f1f5f9';
                            }}
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            style={{
                                padding: '12px 28px',
                                background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '40px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                boxShadow: saving ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                if (!saving) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!saving) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.2)';
                                }
                            }}
                        >
                            {saving ? 'Збереження...' : 'Зберегти зміни'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}