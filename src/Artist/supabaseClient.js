import { createClient } from '@supabase/supabase-js';

const env = typeof process !== 'undefined' ? process.env : {};

const supabaseUrl =
  env.REACT_APP_SUPABASE_URL ||
  env.VITE_SUPABASE_URL ||
  'https://xpjhnruphqxnlyddrooa.supabase.co';
const supabaseKey =
  env.REACT_APP_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_4-_m6PhmDAOn8pfIwNwgDg_JPL-W0e8';
export const supabase = createClient(supabaseUrl, supabaseKey);
