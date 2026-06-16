import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dxgywtqqzpyrueostjdy.supabase.co";
const supabaseAnonKey = 'sb_publishable_avyWvNv3SrmJZGmaMszNrw_AGJptVhK';

/**
 * Клієнт Supabase для взаємодії з базою даних та сховищем.
 * Налаштований на збереження сесії та автоматичне оновлення токенів.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
})