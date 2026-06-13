// frontend/src/hooks/useAuth.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionAndUser = async () => {
            // 1. Get initial auth session
            const { data: { session } } = await supabase.auth.getSession();
            let currentUser = session?.user ?? null;

            // 2. If logged in, fetch the custom role from public.users
            if (currentUser) {
                const { data: publicUserData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', currentUser.id)
                    .single();

                if (publicUserData) {
                    // Attach the custom role to the user object
                    currentUser.role = publicUserData.role;
                }
            }

            setUser(currentUser);
            setLoading(false);
        };

        fetchSessionAndUser();

        // 3. Listen for changes (login/logout)
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            let currentUser = session?.user ?? null;

            if (currentUser) {
                const { data: publicUserData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', currentUser.id)
                    .single();

                if (publicUserData) {
                    currentUser.role = publicUserData.role;
                }
            }
            setUser(currentUser);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}