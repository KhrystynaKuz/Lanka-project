import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

/**
 * Компонент модального вікна створення нового чату.
 * Дозволяє створювати прямий чат з користувачем або груповий чат
 * з кількома учасниками. Виконує пошук користувачів та створює чати
 * через Supabase RPC-функції.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.onClose - Функція закриття модального вікна.
 * @param {Function} props.onChatCreated - Функція, що викликається після створення чату з передачею його ідентифікатора.
 * @returns {JSX.Element} Рендер модального вікна створення чату.
 */
export default function NewChatModal({ onClose, onChatCreated }) {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const [isGroup, setIsGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    /**
     * Повертає інформацію про роль користувача для відображення.
     *
     * @param {string} role - Роль користувача.
     * @returns {Object} Об'єкт з іконкою, міткою та кольором ролі.
     */
    const getRoleLabel = (role) => {
        const roles = {
            'HEAD': { icon: '👑', label: 'Голова', color: '#8b5cf6' },
            'COORDINATOR': { icon: '📋', label: 'Координатор', color: '#3b82f6' },
            'VOLUNTEER': { icon: '🤝', label: 'Волонтер', color: '#10b981' },
            'CUSTOMER': { icon: '🛍️', label: 'Замовник', color: '#f59e0b' }
        };
        return roles[role] || { icon: '👤', label: role || 'Користувач', color: '#64748b' };
    };

    useEffect(() => {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    /**
     * Закриває модальне вікно з анімацією.
     */
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 200);
    };

    /**
     * Виконує пошук користувачів за іменем або прізвищем.
     *
     * @async
     * @param {string} query - Пошуковий запит.
     * @returns {Promise<void>}
     */
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
            .neq('id', user.id)
            .limit(10);

        if (error) console.error("Search error:", error);
        setResults(data || []);
        setLoading(false);
    };

    /**
     * Обробляє вибір користувача.
     * Для прямого чату одразу створює чат, для групового додає до списку учасників.
     *
     * @async
     * @param {Object} selectedUser - Обраний користувач.
     * @returns {Promise<void>}
     */
    const handleUserSelect = async (selectedUser) => {
        if (!isGroup) {
            const { data, error } = await supabase.rpc('get_or_create_direct_chat', {
                user1_id: user.id,
                user2_id: selectedUser.id,
            });
            if (data && !error) onChatCreated(data);
        } else {
            if (!selectedUsers.find(u => u.id === selectedUser.id)) {
                setSelectedUsers([...selectedUsers, selectedUser]);
            }
            setSearch('');
        }
    };

    /**
     * Створює груповий чат з вибраними учасниками.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;

        const { data, error } = await supabase.rpc('create_group_chat', {
            creator_id: user.id,
            chat_name: groupName,
            participant_ids: selectedUsers.map(u => u.id)
        });

        if (data && !error) onChatCreated(data);
    };

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
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }
                    .modal-content {
                        animation: modalSlideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
                    }
                    .modal-content.closing {
                        animation: modalSlideOut 0.2s ease-in forwards;
                    }
                `}
            </style>

            <div
                className="modal-overlay"
                style={{
                    background: isVisible ? 'rgba(30, 58, 138, 0.4)' : 'rgba(30, 58, 138, 0)',
                    backdropFilter: isVisible ? 'blur(6px)' : 'blur(0px)',
                    transition: 'all 0.25s ease-out'
                }}
                onClick={handleClose}
            >
                <div
                    className={`modal-content ${!isVisible ? 'closing' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        padding: '28px',
                        borderRadius: '28px',
                        width: '460px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        boxSizing: 'border-box'
                    }}
                >
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
                            💬 Новий чат
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

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: '#f8fafc',
                        padding: '12px 16px',
                        borderRadius: '20px',
                        marginBottom: '20px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1e293b'
                        }}>
                            👥 Груповий чат
                        </span>
                        <div style={{
                            width: '44px',
                            height: '24px',
                            background: isGroup ? '#2563eb' : '#cbd5e1',
                            borderRadius: '30px',
                            position: 'relative',
                            transition: 'background 0.2s',
                            cursor: 'pointer'
                        }}
                             onClick={() => setIsGroup(!isGroup)}>
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: isGroup ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                background: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.2s'
                            }} />
                        </div>
                    </label>

                    {isGroup && (
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
                                🏷️ Назва групи
                            </label>
                            <input
                                type="text"
                                placeholder="Наприклад: Команда волонтерів"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
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
                                autoFocus={isGroup}
                            />
                        </div>
                    )}

                    {isGroup && selectedUsers.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                fontSize: '12px',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 700,
                                display: 'block',
                                marginBottom: '8px'
                            }}>
                                👥 Учасники ({selectedUsers.length})
                            </label>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                padding: '12px',
                                background: '#f8fafc',
                                borderRadius: '16px',
                                minHeight: '50px',
                                maxHeight: '100px',
                                overflowY: 'auto'
                            }}>
                                {selectedUsers.map(u => (
                                    <span key={u.id} style={{
                                        background: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)',
                                        color: '#1e40af',
                                        padding: '6px 12px',
                                        borderRadius: '30px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {u.first_name} {u.last_name}
                                        <span
                                            onClick={() => setSelectedUsers(selectedUsers.filter(su => su.id !== u.id))}
                                            style={{
                                                cursor: 'pointer',
                                                color: '#ef4444',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                marginLeft: '4px'
                                            }}
                                        >
                                            ×
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            fontSize: '12px',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontWeight: 700,
                            display: 'block',
                            marginBottom: '8px'
                        }}>
                            🔍 Пошук користувачів
                        </label>
                        <input
                            type="text"
                            placeholder="Введіть ім'я або прізвище..."
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                if (searchTimeout) clearTimeout(searchTimeout);
                                setSearchTimeout(setTimeout(() => searchUsers(val), 300));
                            }}
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
                            autoFocus={!isGroup}
                        />
                    </div>

                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: '180px',
                        maxHeight: '280px',
                        background: '#f8fafc',
                        borderRadius: '16px',
                        marginBottom: '16px'
                    }}>
                        {loading ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '40px',
                                gap: '10px'
                            }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '3px solid #e2e8f0',
                                    borderTopColor: '#3b82f6',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                                <span style={{ color: '#64748b' }}>Пошук...</span>
                            </div>
                        ) : results.length > 0 ? (
                            results.map((u) => {
                                const roleInfo = getRoleLabel(u.role);
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => handleUserSelect(u)}
                                        style={{
                                            padding: '14px 16px',
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
                                            {isGroup ? '➕ Додати' : '💬 Обрати'}
                                        </button>
                                    </div>
                                );
                            })
                        ) : search.length >= 2 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#94a3b8'
                            }}>
                                👤 Користувачів не знайдено
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#94a3b8'
                            }}>
                                Введіть 2+ символи для пошуку
                            </div>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '16px',
                        borderTop: '1px solid #eef2ff'
                    }}>
                        <button
                            onClick={handleClose}
                            style={{
                                padding: '12px 24px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '40px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e2e8f0';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                            }}
                        >
                            Скасувати
                        </button>
                        {isGroup && (
                            <button
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || selectedUsers.length === 0}
                                style={{
                                    padding: '12px 28px',
                                    background: (!groupName.trim() || selectedUsers.length === 0)
                                        ? '#cbd5e1'
                                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '40px',
                                    cursor: (!groupName.trim() || selectedUsers.length === 0) ? 'not-allowed' : 'pointer',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                    boxShadow: (!groupName.trim() || selectedUsers.length === 0) ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.2)'
                                }}
                                onMouseEnter={(e) => {
                                    if (groupName.trim() && selectedUsers.length > 0) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (groupName.trim() && selectedUsers.length > 0) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.2)';
                                    }
                                }}
                            >
                                Створити групу
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}