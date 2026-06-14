import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useChats(userId) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchChats = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        // 1. Fetch memberships INCLUDING the new is_archived flag
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
                // Find the user's specific membership to grab their archive status
                const membership = memberships.find(m => m.chat_id === chat.id);

                if (chat.type === 'GROUP') {
                    return {
                        ...chat,
                        is_archived: membership?.is_archived || false, // Inject archive flag
                        displayName: chat.name || 'Груповий чат',
                        preview: '',
                    };
                }

                // For Direct Chats
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
                    is_archived: membership?.is_archived || false, // Inject archive flag
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

        // 1. Listen for new chats being added to the user
        const membersInsertChannel = supabase
            .channel('chat_members_insert')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members', filter: `user_id=eq.${userId}` }, () => {
                fetchChats();
            })
            .subscribe();

        // 2. Listen for Archive/Unarchive toggles (UPDATE on chat_members)
        const membersUpdateChannel = supabase
            .channel('chat_members_update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members', filter: `user_id=eq.${userId}` }, (payload) => {
                setChats(prevChats => prevChats.map(chat => {
                    if (chat.id === payload.new.chat_id) {
                        // Update only the archive status
                        return { ...chat, is_archived: payload.new.is_archived };
                    }
                    return chat;
                }));
            })
            .subscribe();

        // 3. Listen for Name changes on the chats table (Groups)
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

        // 4. Listen for new messages to update the preview snippet
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