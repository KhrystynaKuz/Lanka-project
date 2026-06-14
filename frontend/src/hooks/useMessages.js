// frontend/src/hooks/useMessages.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

export function useMessages(chatId) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const LIMIT = 50;

    const fetchMessages = useCallback(async (pageNumber = 0, append = false) => {
        if (!chatId) return;
        setLoading(true);

        const from = pageNumber * LIMIT;
        const to = from + LIMIT - 1;

        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:sender_id(first_name, last_name)')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (!error && data) {
            const orderedData = data.reverse();
            if (data.length < LIMIT) setHasMore(false);
            setMessages(prev => append ? [...orderedData, ...prev] : orderedData);
        }
        setLoading(false);
    }, [chatId]);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }
        setPage(0);
        setHasMore(true);
        fetchMessages(0, false);

        const channel = supabase.channel(`chat_${chatId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
                async (payload) => {
                    const newMsg = payload.new;
                    const { data: senderData } = await supabase.from('users').select('first_name, last_name').eq('id', newMsg.sender_id).single();
                    newMsg.sender = senderData;
                    setMessages(prev => [...prev, newMsg]);
                }
            ).subscribe();

        return () => supabase.removeChannel(channel);
    }, [chatId, fetchMessages]);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage, true);
        }
    };

    // UPDATED: Now accepts an object or a string
    const sendMessage = async (payload) => {
        if (!chatId || !user) return;

        let content = '';
        let attachment_url = null;

        if (typeof payload === 'string') {
            content = payload;
        } else {
            content = payload.content;
            attachment_url = payload.attachment_url;
        }

        // Prevent sending completely empty messages
        if (!content?.trim() && !attachment_url) return;

        await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: user.id,
            content: content?.trim() || null,
            attachment_url: attachment_url
        });
    };

    return { messages, loading, hasMore, loadMore, sendMessage };
}