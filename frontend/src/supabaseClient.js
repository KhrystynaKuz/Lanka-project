import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dxgywtqqzpyrueostjdy.supabase.co";
const supabaseAnonKey = 'sb_publishable_avyWvNv3SrmJZGmaMszNrw_AGJptVhK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);