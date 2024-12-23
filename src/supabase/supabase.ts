import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ocvjewugogahbycyatvg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'going-reading-auth',
    storage: window.localStorage,
  },
});
