import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cnxhngklpqlnkxghcfxr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    '❌ MISSING SUPABASE ENVIRONMENT VARIABLES!\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'Local: Add to .env file\n' +
    'Vercel: Add in Project Settings > Environment Variables'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

