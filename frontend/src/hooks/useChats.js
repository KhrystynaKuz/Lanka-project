import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Кастомний хук для управління чатами користувача.
 * Завантажує список чатів, їх учасників, останні повідомлення
 * та відстежує зміни в реальному часі (нові чати, архівація,
 * оновлення назв груп, нові повідомлення).
 *
 * @function
 * @param {string|number} userId - Ідентифікатор користувача.
 * @returns {Object} Об'єкт з двома полями:
 *   - {Array} chats - Масив об'єктів чатів з додатковими полями (displayName, preview, is_archived)
 *   - {boolean} loading - Стан завантаження даних чатів
 */
export function useChats(userId) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    /**
     * Завантажує список чатів користувача з бази даних.
     * Отримує учасників, останні повідомлення та статус архівації.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchChats = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        const { data: memberships, error } = await supabase
            .from('chat_members')
            .select('chat_id, is_archived')
            .eq('user_id', userId);

        if (error || !memberships || memberships.length === 0) {
            setChats([]);
            setLoading(false);
            return;
        }

        const chatIds = memberships.map(m => m.chat_id);

        const { data: chatsData, error: chatsErr } = await supabase
            .from('chats')
            .select('*')
            .in('id', chatIds)
            .order('created_at', { ascending: false });

        if (chatsErr) {
            setLoading(false);
            return;
        }

        const enrichedChats = await Promise.all(
            chatsData.map(async (chat) => {
                const membership = memberships.find(m => m.chat_id === chat.id);

                if (chat.type === 'GROUP') {
                    return {
                        ...chat,
                        is_archived: membership?.is_archived || false,
                        displayName: chat.name || 'Груповий чат',
                        preview: '',
                    };
                }

                const { data: members } = await supabase
                    .from('chat_members')
                    .select('user_id')
                    .eq('chat_id', chat.id);

                const otherUserId = members?.find(m => m.user_id !== userId)?.user_id;
                let name = 'Невідомий користувач';

                if (otherUserId) {
                    const { data: otherUser } = await supabase
                        .from('users')
                        .select('first_name, last_name')
                        .eq('id', otherUserId)
                        .single();
                    if (otherUser) {
                        name = `${otherUser.first_name} ${otherUser.last_name}`;
                    }
                }

                const { data: lastMsg } = await supabase
                    .from('messages')
                    .select('content')
                    .eq('chat_id', chat.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                return {
                    ...chat,
                    is_archived: membership?.is_archived || false,
                    displayName: name,
                    preview: lastMsg?.content || '',
                };
            })
        );

        setChats(enrichedChats);
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchChats();

        if (!userId) return;

        const membersInsertChannel = supabase
            .channel('chat_members_insert')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members', filter: `user_id=eq.${userId}` }, () => {
                fetchChats();
            })
            .subscribe();

        const membersUpdateChannel = supabase
            .channel('chat_members_update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members', filter: `user_id=eq.${userId}` }, (payload) => {
                setChats(prevChats => prevChats.map(chat => {
                    if (chat.id === payload.new.chat_id) {
                        return { ...chat, is_archived: payload.new.is_archived };
                    }
                    return chat;
                }));
            })
            .subscribe();

        const chatsUpdateChannel = supabase
            .channel('chats_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' }, (payload) => {
                setChats(prevChats => prevChats.map(chat => {
                    if (chat.id === payload.new.id) {
                        return {
                            ...chat,
                            name: payload.new.name,
                            displayName: payload.new.type === 'GROUP' ? payload.new.name : chat.displayName
                        };
                    }
                    return chat;
                }));
            })
            .subscribe();

        const messagesChannel = supabase
            .channel('messages_preview_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                setChats(prevChats => prevChats.map(chat => {
                    if (chat.id === payload.new.chat_id) {
                        return { ...chat, preview: payload.new.content };
                    }
                    return chat;
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(membersInsertChannel);
            supabase.removeChannel(membersUpdateChannel);
            supabase.removeChannel(chatsUpdateChannel);
            supabase.removeChannel(messagesChannel);
        };
    }, [userId, fetchChats]);

    return { chats, loading };
}