/** Lightweight procedural SFX — no external assets required. */
export class SoundFX {
    constructor() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        this._ctx = Ctx ? new Ctx() : null;
        this._enabled = true;
    }

    async resume() {
        if (this._ctx?.state === 'suspended') {
            await this._ctx.resume().catch(() => {});
        }
    }

    setEnabled(on) {
        this._enabled = on;
    }

    _tone(freq, duration, type = 'square', volume = 0.08) {
        if (!this._ctx || !this._enabled) return;
        this.resume();

        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
        osc.connect(gain).connect(this._ctx.destination);
        osc.start();
        osc.stop(this._ctx.currentTime + duration);
    }

    playJump() {
        this._tone(320, 0.08, 'square', 0.06);
    }

    playBreak() {
        if (!this._ctx || !this._enabled) return;
        this.resume();

        const len = this._ctx.sampleRate * 0.06;
        const buf = this._ctx.createBuffer(1, len, this._ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        }

        const src = this._ctx.createBufferSource();
        src.buffer = buf;
        const gain = this._ctx.createGain();
        gain.gain.value = 0.12;
        src.connect(gain).connect(this._ctx.destination);
        src.start();
    }

    playPlace() {
        this._tone(120, 0.1, 'triangle', 0.1);
    }
}
