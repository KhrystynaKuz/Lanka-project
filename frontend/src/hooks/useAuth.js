import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionAndUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            let currentUser = session?.user ?? null;

            if (currentUser) {
                // Fetch the role, first name, and last name
                const { data: publicUserData } = await supabase
                    .from('users')
                    .select('role, first_name, last_name')
                    .eq('id', currentUser.id)
                    .single();

                if (publicUserData) {
                    currentUser.role = publicUserData.role;
                    currentUser.first_name = publicUserData.first_name;
                    currentUser.last_name = publicUserData.last_name;
                }
            }

            setUser(currentUser);
            setLoading(false);
        };

        fetchSessionAndUser();

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            let currentUser = session?.user ?? null;

            if (currentUser) {
                const { data: publicUserData } = await supabase
                    .from('users')
                    .select('role, first_name, last_name')
                    .eq('id', currentUser.id)
                    .single();

                if (publicUserData) {
                    currentUser.role = publicUserData.role;
                    currentUser.first_name = publicUserData.first_name;
                    currentUser.last_name = publicUserData.last_name;
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