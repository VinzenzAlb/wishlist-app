import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

if (/secret/i.test(supabaseAnonKey)) {
	// Guard against accidentally using the service role key in the browser
	throw new Error('Use the Supabase anon public key in the browser, not the service role key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
