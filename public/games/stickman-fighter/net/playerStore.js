/**
 * playerStore — Supabase queries for player accounts + the leaderboard.
 *
 * Backed by the public.stickman_players table (see supabase/stickman_players.sql).
 * Each player is keyed by their Phantom wallet address and owns a unique name.
 */
import { supabase } from './supabaseClient.js';

const TABLE = 'stickman_players';

/** @returns {Promise<{address,name,round_wins}|null>} */
export async function getPlayerByAddress(address) {
    if (!address) return null;
    const { data, error } = await supabase
        .from(TABLE)
        .select('address,name,round_wins')
        .eq('address', address)
        .maybeSingle();
    if (error) { console.warn('[players] lookup failed:', error.message); return null; }
    return data ?? null;
}

/** @returns {Promise<boolean>} true if another player already uses this name. */
export async function isNameTaken(name, exceptAddress = null) {
    const clean = String(name ?? '').trim();
    if (!clean) return false;
    const { data, error } = await supabase
        .from(TABLE)
        .select('address')
        .ilike('name', clean)
        .limit(1);
    if (error) { console.warn('[players] name check failed:', error.message); return false; }
    if (!data?.length) return false;
    return data.some(row => row.address !== exceptAddress);
}

/**
 * Register a brand-new player. Throws a user-facing Error on a name clash.
 * @returns {Promise<{address,name,round_wins}>}
 */
export async function registerPlayer(address, name) {
    const clean = String(name ?? '').trim();
    if (!address) throw new Error('Connect your wallet first.');
    if (clean.length < 2) throw new Error('Name must be at least 2 characters.');

    const { data, error } = await supabase
        .from(TABLE)
        .insert({ address, name: clean })
        .select('address,name,round_wins')
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('That name is taken. Pick another, son.');
        throw new Error(error.message || 'Could not save your name.');
    }
    return data;
}

/** Add to a player's round-win total (atomic via RPC, with a safe fallback). */
export async function incrementRoundWins(address, delta = 1) {
    if (!address || delta <= 0) return;
    try {
        const { error } = await supabase.rpc('increment_round_wins', {
            p_address: address,
            p_delta: delta,
        });
        if (!error) return;
        console.warn('[players] increment RPC failed, falling back:', error.message);
    } catch (e) {
        console.warn('[players] increment RPC unavailable:', e?.message);
    }
    // Fallback: read-modify-write (not atomic, but better than nothing).
    try {
        const current = await getPlayerByAddress(address);
        if (current) {
            await supabase.from(TABLE)
                .update({ round_wins: (current.round_wins ?? 0) + delta, updated_at: new Date().toISOString() })
                .eq('address', address);
        }
    } catch { /* ignore */ }
}

/** @returns {Promise<Array<{name,round_wins,address}>>} top players by wins. */
export async function getLeaderboard(limit = 20) {
    const { data, error } = await supabase
        .from(TABLE)
        .select('name,round_wins,address')
        .order('round_wins', { ascending: false })
        .order('updated_at', { ascending: true })
        .limit(limit);
    if (error) { console.warn('[players] leaderboard failed:', error.message); return []; }
    return data ?? [];
}
