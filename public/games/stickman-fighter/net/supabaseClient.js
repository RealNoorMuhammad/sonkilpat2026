import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

// Supabase project used for Stickman Fighter online PvP.
// The anon publishable key is safe to expose in the browser.
const SUPABASE_URL = 'https://lyhvpqxneltsfkpagmgm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xD_cCCh5UwxJ-2wePZ7uCw_-RNp8D_B';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
        // Raise the per-client message rate ceiling above the default of 10/s
        // so frequent input + snapshot broadcasts are not throttled.
        params: { eventsPerSecond: 30 },
    },
});

export function createPlayerId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
