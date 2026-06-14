import { INPUT_KEYS } from '../net/multiplayerManager.js';

/**
 * RemoteInputHandler — drives the opponent fighter from network input packets.
 *
 * Implements the same query surface as InputHandler so a Fighter cannot tell
 * the difference (isKeyDown / isKeyJustPressed / update).
 */
export default class RemoteInputHandler {
    constructor() {
        /** @type {Record<string, boolean>} */
        this._keys = {};
        /** @type {Record<string, boolean>} */
        this._prevKeys = {};
    }

    isKeyDown(code) {
        return !!this._keys[code];
    }

    isKeyJustPressed(code) {
        return !!this._keys[code] && !this._prevKeys[code];
    }

    setVirtualKeyDown(code) { this._keys[code] = true; }
    setVirtualKeyUp(code) { this._keys[code] = false; }

    /** Apply a keys map from a network player_input payload. */
    applyKeys(keys = {}) {
        for (const code of INPUT_KEYS) {
            this._keys[code] = !!keys[code];
        }
    }

    /** Must be called at the END of each game frame (mirrors InputHandler). */
    update() {
        this._prevKeys = { ...this._keys };
    }

    reset() {
        this._keys = {};
        this._prevKeys = {};
    }
}
