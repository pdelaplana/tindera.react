import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.generated';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn(
		'Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
	);
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
	auth: {
		flowType: 'pkce', // Required for Capacitor/mobile
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
	},
});
