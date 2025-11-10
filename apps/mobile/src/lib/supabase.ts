import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url)
  throw new Error('Missing VITE_SUPABASE_URL in apps/mobile/.env.local');
if (!anon)
  throw new Error('Missing VITE_SUPABASE_ANON_KEY in apps/mobile/.env.local');

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
