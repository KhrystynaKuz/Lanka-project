import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

export function useMessages(chatId) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef(null);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*, sender:users!sender_id(first_name, last_name)')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (!error) setMessages(data);
            setLoading(false);
        };

        fetchMessages();

        channelRef.current = supabase
            .channel(`messages-${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    supabase
                        .from('messages')
                        .select('*, sender:users!sender_id(first_name, last_name)')
                        .eq('id', payload.new.id)
                        .single()
                        .then(({ data }) => {
                            if (data) setMessages(prev => [...prev, data]);
                        });
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [chatId]);

    const sendMessage = async (content) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !chatId) return;
        const { error } = await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: user.id,
            content,
        });
        if (error) console.error(error);
    };

    return { messages, loading, sendMessage };
}