import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useChats(userId) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchChats = async () => {
            setLoading(true);

            // 1. Get all chat IDs where user is a member
            const { data: memberships, error } = await supabase
                .from('chat_members')
                .select('chat_id')
                .eq('user_id', userId);

            if (error || !memberships) {
                console.error(error);
                setLoading(false);
                return;
            }

            const chatIds = memberships.map(m => m.chat_id);
            if (chatIds.length === 0) {
                setChats([]);
                setLoading(false);
                return;
            }

            // 2. Fetch the chat records
            const { data: chatsData, error: chatsErr } = await supabase
                .from('chats')
                .select('*')
                .in('id', chatIds)
                .order('created_at', { ascending: false });

            if (chatsErr) {
                console.error(chatsErr);
                setLoading(false);
                return;
            }

            // 3. For each DIRECT chat, find the other member's name
            const enrichedChats = await Promise.all(
                chatsData.map(async (chat) => {
                    if (chat.type === 'GROUP') {
                        return {
                            ...chat,
                            displayName: chat.name || 'Group Chat',
                            preview: '', // we'll set preview later if needed
                        };
                    }

                    // DIRECT chat: get the other member's user info
                    const { data: members } = await supabase
                        .from('chat_members')
                        .select('user_id')
                        .eq('chat_id', chat.id);

                    const otherUserId = members?.find(m => m.user_id !== userId)?.user_id;
                    if (!otherUserId) {
                        return { ...chat, displayName: 'Unknown User', preview: '' };
                    }

                    const { data: otherUser } = await supabase
                        .from('users')
                        .select('first_name, last_name')
                        .eq('id', otherUserId)
                        .single();

                    const name = otherUser
                        ? `${otherUser.first_name} ${otherUser.last_name}`
                        : 'Unknown User';

                    // Optional: get last message preview
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('content')
                        .eq('chat_id', chat.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    return {
                        ...chat,
                        displayName: name,
                        preview: lastMsg?.content || '',
                    };
                })
            );

            setChats(enrichedChats);
            setLoading(false);
        };

        fetchChats();

        // Realtime: refresh list when a new membership is added
        const channel = supabase
            .channel('chat_members_changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_members', filter: `user_id=eq.${userId}` },
                () => fetchChats()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return { chats, loading };
}