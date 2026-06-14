import { supabase, createPlayerId } from './supabaseClient.js';
import { CONFIG } from '../configs/config.js';

/** The set of inputs relayed over the network (no dev cheats). */
export const INPUT_KEYS = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'KeyA',
    'KeyD',
    'KeyW',
    'KeyJ',
    'KeyU',
    'KeyI',
    'KeyK',
];

// Ambiguous characters (0/O, 1/I) are omitted so codes are easy to read aloud.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Build a plain object of the currently-held relayed keys. */
export function keysFromInput(input) {
    const keys = {};
    for (const code of INPUT_KEYS) {
        keys[code] = input.isKeyDown(code);
    }
    return keys;
}

export function generateRoomCode(length = CONFIG.roomCodeLength) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}

/**
 * MultiplayerManager — wraps a single Supabase Realtime channel per room.
 *
 * Slot 1 = host (left fighter), slot 2 = guest (right fighter).
 * The host is authoritative for combat: it resolves hits and broadcasts the
 * results; the guest applies them. Both clients relay their own inputs.
 *
 * Events you can subscribe to via on(event, handler):
 *   'ready'         — both players are present; payload { roomCode, slot, isHost }
 *   'remote_input'  — opponent input    { frame, slot, keys }
 *   'hit_event'     — authoritative hit (guest only)
 *   'state_snapshot'— position/health correction (guest only)
 *   'round_end'     — round resolved (guest only)
 *   'rematch'       — host restarted the match (guest only)
 *   'rematch_request' — guest asked to rematch (host only)
 *   'opponent_name' — the opponent's display name became known { name }
 *   'latency'       — round-trip ping updated { ms }
 *   'opponent_left' — the other player disconnected
 *   'error'         — { message }
 */
export default class MultiplayerManager {
    constructor() {
        this._playerId = createPlayerId();
        this._channel = null;
        this._roomCode = null;
        this._slot = null;
        this._isHost = false;
        this._connected = false;
        this._readyFired = false;

        this._playerName = '';
        this._opponentName = '';
        this._latencyMs = null;
        this._pingTimer = null;

        /** @type {Record<string, Function[]>} */
        this._handlers = {
            ready: [],
            remote_input: [],
            hit_event: [],
            state_snapshot: [],
            round_end: [],
            rematch: [],
            rematch_request: [],
            opponent_name: [],
            latency: [],
            opponent_left: [],
            error: [],
        };
    }

    get roomCode() { return this._roomCode; }
    get slot() { return this._slot; }
    get isHost() { return this._isHost; }
    get isConnected() { return this._connected; }
    get playerName() { return this._playerName; }
    get opponentName() { return this._opponentName; }
    get latencyMs() { return this._latencyMs; }

    /** Normalize a display name; falls back to a slot-based default. */
    _cleanName(name, slot) {
        const trimmed = String(name ?? '').trim().slice(0, 14);
        return trimmed || `Player ${slot ?? '?'}`;
    }

    _setOpponentName(name) {
        const clean = String(name ?? '').trim().slice(0, 14);
        if (!clean || clean === this._opponentName) return;
        this._opponentName = clean;
        this._emit('opponent_name', { name: clean });
    }

    on(event, handler) {
        this._handlers[event]?.push(handler);
        return () => {
            const list = this._handlers[event];
            if (!list) return;
            const idx = list.indexOf(handler);
            if (idx >= 0) list.splice(idx, 1);
        };
    }

    _emit(event, payload) {
        for (const handler of this._handlers[event] ?? []) {
            handler(payload);
        }
    }

    async createRoom(playerName) {
        await this.leaveRoom();
        this._playerName = this._cleanName(playerName, 1);

        // Register the room (with a few retries in case of a code collision).
        let roomCode = generateRoomCode();
        for (let attempt = 0; attempt < 5; attempt++) {
            const result = await this._registerRoom(roomCode);
            if (result === 'exists') { roomCode = generateRoomCode(); continue; }
            break; // 'ok' or null (registry unavailable) — proceed either way
        }

        await this._joinChannel(roomCode, 1, true);
        return { roomCode, slot: 1, isHost: true };
    }

    async joinRoom(roomCode, playerName) {
        const normalized = String(roomCode ?? '').trim().toUpperCase();
        if (normalized.length !== CONFIG.roomCodeLength) {
            throw new Error(`Enter a valid ${CONFIG.roomCodeLength}-character room code.`);
        }
        await this.leaveRoom();
        this._playerName = this._cleanName(playerName, 2);

        const check = await this._validateRoom(normalized);
        if (check.result === 'not_found') throw new Error('Room not found. Check the code, son.');
        if (check.result === 'expired') throw new Error('This room has expired.');
        // 'ok' or null (registry unavailable) — proceed.

        // Show the host's name right away (before the realtime handshake), and
        // record our own name on the room so the host can display it too.
        if (check.hostName) this._setOpponentName(check.hostName);
        await this._saveGuestName(normalized, this._playerName);

        await this._joinChannel(normalized, 2, false);
        return { roomCode: normalized, slot: 2, isHost: false };
    }

    //  Room registry (optional Supabase table — see supabase/stickman_rooms.sql) 

    /** @returns {Promise<'ok'|'exists'|null>} null when the registry is unavailable. */
    async _registerRoom(code) {
        try {
            const { error } = await supabase.from('stickman_rooms').insert({
                code,
                host_id: this._playerId,
                host_name: this._playerName || null,
                status: 'waiting',
            });
            if (!error) return 'ok';
            if (error.code === '23505') return 'exists'; // unique_violation
            console.warn('[MP] room registry insert failed:', error.message);
            return null;
        } catch (e) {
            console.warn('[MP] room registry unavailable:', e?.message);
            return null;
        }
    }

    /**
     * @returns {Promise<{ result: 'ok'|'not_found'|'expired'|null, hostName?: string }>}
     *   result is null when the registry is unavailable.
     */
    async _validateRoom(code) {
        try {
            const { data, error } = await supabase
                .from('stickman_rooms')
                .select('code,status,expires_at,host_name')
                .eq('code', code)
                .maybeSingle();
            if (error) { console.warn('[MP] room lookup failed:', error.message); return { result: null }; }
            if (!data) return { result: 'not_found' };
            if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return { result: 'expired' };
            if (data.status === 'finished') return { result: 'not_found' };
            return { result: 'ok', hostName: data.host_name || '' };
        } catch (e) {
            console.warn('[MP] room registry unavailable:', e?.message);
            return { result: null };
        }
    }

    /** Persist the guest's name onto the room row so the host can read it. */
    async _saveGuestName(code, name) {
        if (!code || !name) return;
        try {
            await supabase.from('stickman_rooms')
                .update({ guest_name: name })
                .eq('code', code);
        } catch { /* registry unavailable — ignore */ }
    }

    async _markRoomInProgress() {
        if (!this._roomCode) return;
        try {
            await supabase.from('stickman_rooms')
                .update({ status: 'in_progress' })
                .eq('code', this._roomCode);
        } catch { /* registry unavailable — ignore */ }
    }

    async _deleteRoom(code) {
        if (!code) return;
        try {
            await supabase.from('stickman_rooms').delete().eq('code', code);
        } catch { /* registry unavailable — ignore */ }
    }

    async _joinChannel(roomCode, slot, isHost) {
        this._roomCode = roomCode;
        this._slot = slot;
        this._isHost = isHost;
        this._readyFired = false;

        const channelName = `stickman:${roomCode}`;
        this._channel = supabase.channel(channelName, {
            config: { presence: { key: this._playerId } },
        });

        this._channel
            .on('presence', { event: 'sync' }, () => this._onPresenceSync())
            .on('presence', { event: 'join' }, () => this._onPresenceSync())
            .on('presence', { event: 'leave' }, () => this._onPresenceLeave())
            .on('broadcast', { event: 'hello' }, ({ payload }) => {
                // Guest announced itself — the host confirms the start. Replying
                // even after we've started lets a late/reloaded guest catch up.
                if (!this._isHost) return;
                console.info('[MP] host received hello → sending game_start');
                if (payload?.name) this._setOpponentName(payload.name);
                this.broadcast('game_start', { roomCode: this._roomCode, name: this._playerName });
                this._fireReadyOnce();
            })
            .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                if (this._isHost) return;
                console.info('[MP] guest received game_start → starting');
                if (payload?.name) this._setOpponentName(payload.name);
                this._fireReadyOnce();
            })
            .on('broadcast', { event: 'ping' }, ({ payload }) => {
                // Echo a peer's ping straight back so it can measure round-trip.
                if (payload?.slot === this._slot) return;
                this.broadcast('pong', { toSlot: payload?.slot, t: payload?.t });
            })
            .on('broadcast', { event: 'pong' }, ({ payload }) => {
                if (payload?.toSlot !== this._slot || typeof payload?.t !== 'number') return;
                const ms = Math.max(0, Math.round(performance.now() - payload.t));
                this._latencyMs = ms;
                this._emit('latency', { ms });
            })
            .on('broadcast', { event: 'player_input' }, ({ payload }) => {
                if (payload?.slot !== this._slot) this._emit('remote_input', payload);
            })
            .on('broadcast', { event: 'hit_event' }, ({ payload }) => {
                if (!this._isHost) this._emit('hit_event', payload);
            })
            .on('broadcast', { event: 'state_snapshot' }, ({ payload }) => {
                if (!this._isHost) this._emit('state_snapshot', payload);
            })
            .on('broadcast', { event: 'round_end' }, ({ payload }) => {
                if (!this._isHost) this._emit('round_end', payload);
            })
            .on('broadcast', { event: 'rematch' }, ({ payload }) => {
                if (!this._isHost) this._emit('rematch', payload);
            })
            .on('broadcast', { event: 'rematch_request' }, ({ payload }) => {
                if (this._isHost) this._emit('rematch_request', payload);
            })
            .on('broadcast', { event: 'leave' }, ({ payload }) => {
                if (payload?.slot !== this._slot) this._emit('opponent_left', payload);
            });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new Error('Connection timed out. Check your network and try again.')),
                12000,
            );
            this._channel.subscribe(async (status, err) => {
                console.info('[MP] channel status:', status, 'room:', roomCode, 'host:', isHost);
                if (status === 'SUBSCRIBED') {
                    clearTimeout(timeout);
                    this._connected = true;
                    await this._channel.track({
                        slot,
                        role: isHost ? 'host' : 'guest',
                        joined_at: Date.now(),
                    });
                    // Guest actively pings the host to start (robust across
                    // devices/networks where presence sync can lag or drop).
                    if (!isHost) this._beginGuestHandshake();
                    resolve();
                    return;
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    clearTimeout(timeout);
                    reject(err ?? new Error('Could not connect to the room.'));
                }
            });
        });

        this._onPresenceSync();
    }

    _getPresenceEntries() {
        const state = this._channel?.presenceState?.() ?? {};
        const entries = [];
        for (const presences of Object.values(state)) {
            for (const entry of presences) entries.push(entry);
        }
        return entries.sort((a, b) => (a.joined_at ?? 0) - (b.joined_at ?? 0));
    }

    _onPresenceSync() {
        const entries = this._getPresenceEntries();

        // A guest arriving to an already-occupied room (3+ present) is rejected.
        if (!this._isHost && entries.length > 2 && !this._readyFired) {
            this._emit('error', { message: 'Room is already full.' });
            this.leaveRoom();
            return;
        }

        if (entries.length >= 2) {
            console.info('[MP] presence shows 2 players → ready');
            // Backup signal for the guest in case it sees presence late.
            if (this._isHost) this.broadcast('game_start', { roomCode: this._roomCode });
            this._fireReadyOnce();
        }
    }

    /** Fire the 'ready' event exactly once (host or guest). */
    _fireReadyOnce() {
        if (this._readyFired) return;
        this._readyFired = true;
        if (this._isHost) this._markRoomInProgress();
        this._startLatencyProbe();
        this._emit('ready', {
            roomCode: this._roomCode,
            slot: this._slot,
            isHost: this._isHost,
            playerName: this._playerName,
            opponentName: this._opponentName,
        });
    }

    /** Guest repeatedly pings the host until the match starts. */
    _beginGuestHandshake() {
        let tries = 0;
        const ping = () => {
            if (this._readyFired || !this._connected) return;
            this.broadcast('hello', { slot: this._slot, name: this._playerName });
            if (++tries < 15) setTimeout(ping, 500);
        };
        ping();
    }

    /** Periodically measure round-trip latency to the opponent. */
    _startLatencyProbe() {
        if (this._pingTimer) return;
        const tick = () => {
            if (!this._connected) return;
            this.broadcast('ping', { slot: this._slot, t: performance.now() });
        };
        tick();
        this._pingTimer = setInterval(tick, 2000);
    }

    _stopLatencyProbe() {
        if (this._pingTimer) {
            clearInterval(this._pingTimer);
            this._pingTimer = null;
        }
        this._latencyMs = null;
    }

    _onPresenceLeave() {
        const entries = this._getPresenceEntries();
        const others = entries.filter(e => e.slot !== this._slot);
        if (others.length === 0 && this._connected && this._readyFired) {
            this._emit('opponent_left', { roomCode: this._roomCode });
        }
    }

    sendInput(frame, keys) {
        this.broadcast('player_input', { frame, slot: this._slot, keys });
    }

    sendHitEvent(payload) {
        if (!this._isHost) return;
        this.broadcast('hit_event', payload);
    }

    sendStateSnapshot(payload) {
        if (!this._isHost) return;
        this.broadcast('state_snapshot', payload);
    }

    sendRoundEnd(payload) {
        if (!this._isHost) return;
        this.broadcast('round_end', payload);
    }

    sendRematch(payload) {
        if (!this._isHost) return;
        this.broadcast('rematch', payload);
    }

    requestRematch() {
        if (this._isHost) return;
        this.broadcast('rematch_request', { slot: this._slot });
    }

    broadcast(event, payload) {
        if (!this._channel || !this._connected) return;
        this._channel.send({ type: 'broadcast', event, payload });
    }

    async leaveRoom() {
        this._stopLatencyProbe();
        // Host tears down its registry row so the code can't be re-joined.
        if (this._isHost && this._roomCode) {
            await this._deleteRoom(this._roomCode);
        }
        if (this._channel) {
            try {
                this.broadcast('leave', { slot: this._slot });
                await this._channel.untrack();
                await supabase.removeChannel(this._channel);
            } catch {
                // ignore cleanup errors
            }
        }
        this._channel = null;
        this._roomCode = null;
        this._slot = null;
        this._isHost = false;
        this._connected = false;
        this._readyFired = false;
        this._opponentName = '';
    }
}
