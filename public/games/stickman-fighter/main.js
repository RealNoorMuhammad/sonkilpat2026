import InputHandler from './controllers/input.js';
import AssetLoader from './utils/assetLoader.js';
import AudioManager from './utils/audioManager.js';
import { ANIMATION_CONFIG } from './configs/animationConfig.js';
import Fighter from './controllers/fighter.js';
import { CONFIG } from './configs/config.js';
import { ATTACKS } from './configs/attack.js';
import AIController from './controllers/ai.js';
import RemoteInputHandler from './controllers/remoteInput.js';
import { keysFromInput } from './net/multiplayerManager.js';
import UIManager from './ui.js';
import { drawTradingCandle } from './utils/tradingCandle.js';


// Canvas setup

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

function resizeCanvas() {
    const scaleX = window.innerWidth / CONFIG.canvasWidth;
    const scaleY = window.innerHeight / CONFIG.canvasHeight;
    const scale = Math.min(scaleX, scaleY);
    canvas.style.width = `${CONFIG.canvasWidth * scale}px`;
    canvas.style.height = `${CONFIG.canvasHeight * scale}px`;
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Show a loading placeholder immediately
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
ctx.fillStyle = '#18181b';
ctx.textAlign = 'center';
ctx.font = '18px Pix32, sans-serif';
ctx.fillText('Loading…', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);

// 
// Orientation guard
// 

(function initOrientationGuard() {
    const overlay = document.getElementById('rotateOverlay');
    if (!overlay) return;

    let pausedByRotate = false;

    function check() {
        const portrait = window.matchMedia('(orientation: portrait)').matches;
        overlay.style.display = portrait ? 'flex' : 'none';

        if (portrait && window.game?.isRunning() && !window.game.isPaused()) {
            window.game.pauseGame();
            pausedByRotate = true;
        } else if (!portrait && pausedByRotate) {
            window.game?.resumeGame();
            pausedByRotate = false;
        }
    }

    ['load', 'resize', 'orientationchange'].forEach(e => window.addEventListener(e, check));
    document.addEventListener('DOMContentLoaded', check);
})();

// 
// FloatingHitCandle — a trading candle that pops up on hit and drifts upward
// 

class FloatingHitCandle {
    /**
     * @param {number} x
     * @param {number} y
     * @param {'red'|'green'} color — red when SON is hit, green when RIVAL is hit
     */
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = CONFIG.floatTextLife;
        this.maxLife = CONFIG.floatTextLife;
        this.size = CONFIG.hitCandleSize;
    }

    update() {
        this.y -= CONFIG.floatTextSpeed;
        this.life--;
    }

    isExpired() { return this.life <= 0; }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        const scale = 0.9 + (alpha * 0.2);
        const size = this.size * scale;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = this.color === 'red' ? '#ef4444' : '#22c55e';
        ctx.shadowBlur = 14;
        drawTradingCandle(ctx, this.x, this.y, size, this.color, 0);
        ctx.restore();
    }
}

// 
// Game
// 

class Game {
    constructor() {
        this._canvas = canvas;
        this._ctx = ctx;

        this._input = new InputHandler();
        this._assetLoader = new AssetLoader();
        this._audioManager = new AudioManager();
        this._ui = new UIManager(this);

        // Round scoring
        this._playerWins = 0;
        this._enemyWins = 0;
        this._round = 1;

        // Game flags
        this._running = false;
        this._paused = false;
        this._gameOver = false;
        this._winner = null;     // 'player' | 'enemy' | null

        // Round intro state
        this._introActive = false;
        this._introTimer = 0;

        // Screen shake
        this._shakeX = 0;
        this._shakeY = 0;

        // Visual collections
        this._hitboxes = [];
        this._floatingTexts = [];

        // Ghost health bar (lag behind real HP visually)
        this._playerGhostHP = 100;
        this._enemyGhostHP = 100;

        this._rafId = null;
        this._lastTimestamp = null;
        this._gameOverTriggered = false;

        // Combo tracking
        this._comboCount = 0;
        this._comboTimer = 0;
        this._comboOwner = null;  // 'player' | 'enemy'

        //  Online multiplayer state 
        this._gameMode = 'solo';      // 'solo' | 'online'
        this._mp = null;              // MultiplayerManager (online only)
        this._localSlot = null;       // 1 = left (_player), 2 = right (_enemy)
        this._isHost = false;
        this._localName = '';         // this client's display name (online)
        this._opponentName = '';      // opponent's display name (online)
        this._onLocalRoundWin = null; // callback fired when the local player wins a round
        this._remoteInput = new RemoteInputHandler();
        this._playerInputSrc = this._input;   // input feeding the left fighter
        this._enemyInputSrc = null;           // input feeding the right fighter
        this._frame = 0;
        this._lastSentKeysJson = '';
        this._lastSnapshotAt = 0;
        this._mpUnsub = [];

        this._gameLoop = this._gameLoop.bind(this);

        this._preloadAssets();
        this._preloadAudio();
    }

    //  Asset loading 

    _preloadAssets() {
        const list = [];
        for (const [charKey, anims] of Object.entries(ANIMATION_CONFIG)) {
            for (const [animKey, cfg] of Object.entries(anims)) {
                for (let i = 1; i <= cfg.frameCount; i++) {
                    list.push({
                        key: `${charKey}_${animKey}${i}`,
                        url: `${cfg.path}${i}${cfg.extension}`,
                    });
                }
            }
        }
        this._assetLoader.loadImages(list).catch(err =>
            console.error('[Game] Asset load error:', err)
        );
    }

    async _preloadAudio() {
        const audioList = [
            { key: 'bgm_fight', urls: ['assets/sfx/bgm/bgm_fight.mp3', 'assets/sfx/bgm/bgm_fight.ogg'] },
            { key: 'jump', urls: ['assets/sfx/jump/sfx_jump.mp3', 'assets/sfx/jump/sfx_jump.ogg'] },
            { key: 'punch', urls: ['assets/sfx/punch/sfx_punch.mp3', 'assets/sfx/punch/sfx_punch.ogg'] },
            { key: 'hit', urls: ['assets/sfx/hit/sfx_hit.mp3', 'assets/sfx/hit/sfx_hit.ogg'] },
            { key: 'block', urls: ['assets/sfx/block/sfx_block.mp3', 'assets/sfx/block/sfx_block.ogg'] },
            { key: 'ko', urls: ['assets/sfx/ko/sfx_ko.mp3', 'assets/sfx/ko/sfx_ko.ogg'] },
        ];
        await this._audioManager.loadAudioList(audioList).catch(err =>
            console.error('[Game] Audio load error:', err)
        );
    }

    //  Fighter / AI factory 

    _buildAnimationsConfig(charKey) {
        const result = {};
        for (const [animKey, cfg] of Object.entries(ANIMATION_CONFIG[charKey])) {
            const imageKeys = [];
            for (let i = 1; i <= cfg.frameCount; i++) {
                imageKeys.push(`${charKey}_${animKey}${i}`);
            }
            result[animKey] = {
                frameCount: cfg.frameCount,
                frameDuration: cfg.frameDuration,
                loop: cfg.loop,
                imageKeys,
            };
        }
        return result;
    }

    _initGameObjects() {
        const playerAnims = this._buildAnimationsConfig('player');
        const enemyAnims = this._buildAnimationsConfig('enemy');

        const online = this._gameMode === 'online';

        const shared = {
            width: 250,
            height: 280,
            attacks: ATTACKS,
            maxHealth: 100,
            assetLoader: this._assetLoader,
            audioManager: this._audioManager,
        };

        this._player = new Fighter({
            ...shared,
            name: 'Player',
            charKey: 'player',
            x: 100,
            y: CONFIG.groundY - 280,
            animationsConfig: playerAnims,
            // Symmetric HP for PvP; asymmetric vs AI for the solo power fantasy.
            maxHealth: online ? CONFIG.pvpMaxHealth : 150,
        });

        this._enemy = new Fighter({
            ...shared,
            name: 'Enemy',
            charKey: 'enemy',
            x: CONFIG.canvasWidth - 100 - 250,
            y: CONFIG.groundY - 280,
            animationsConfig: enemyAnims,
            maxHealth: online ? CONFIG.pvpMaxHealth : 50,
            attackCooldownBonus: online ? 0 : 18,
        });

        this._enemy.facingRight = false;

        if (online) {
            // No AI in PvP. Wire each fighter to its input source by slot:
            // slot 1 controls the left fighter (_player), slot 2 the right (_enemy).
            this._enemyAI = null;
            this._remoteInput.reset();
            if (this._localSlot === 1) {
                this._playerInputSrc = this._input;        // local keyboard
                this._enemyInputSrc = this._remoteInput;   // opponent
            } else {
                this._playerInputSrc = this._remoteInput;  // opponent
                this._enemyInputSrc = this._input;         // local keyboard
            }
        } else {
            this._playerInputSrc = this._input;
            this._enemyInputSrc = null;
            this._enemyAI = new AIController(this._enemy, this._player, {
                difficulty: this._ui.getDifficulty(),
            });
            this._enemyAI.reset(); // seed _prevOpponentHealth to full HP before round starts
        }

        // Ghost HP bars
        this._playerGhostHP = this._player.health;
        this._enemyGhostHP = this._enemy.health;

        // Reset collections
        this._hitboxes = [];
        this._floatingTexts = [];

        this._gameOver = false;
        this._winner = null;
    }

    //  Public game state API 

    startGame() {
        if (this._running) return;
        this._gameMode = 'solo';
        this._mp = null;
        this._playerWins = 0;
        this._enemyWins = 0;
        this._round = 1;
        this._startRound();
    }

    isOnline() { return this._gameMode === 'online'; }

    /**
     * Start a 2-player online match.
     * @param {{ slot: 1|2, isHost: boolean, mp: import('./net/multiplayerManager.js').default, onLocalRoundWin?: () => void }} cfg
     */
    startOnlineGame({ slot, isHost, mp, onLocalRoundWin = null }) {
        if (this._running) this.stopGame();
        this._gameMode = 'online';
        this._mp = mp;
        this._localSlot = slot;
        this._isHost = isHost;
        this._localName = mp?.playerName || (slot === 1 ? 'P1' : 'P2');
        this._opponentName = mp?.opponentName || 'Opponent';
        this._onLocalRoundWin = onLocalRoundWin;
        this._frame = 0;
        this._lastSentKeysJson = '';
        this._lastSnapshotAt = 0;

        this._bindNetworkHandlers();

        this._playerWins = 0;
        this._enemyWins = 0;
        this._round = 1;
        this._startRound();
    }

    _bindNetworkHandlers() {
        // Clear any previous subscriptions (e.g. from a prior match).
        for (const off of this._mpUnsub) off?.();
        this._mpUnsub = [];
        if (!this._mp) return;

        this._mpUnsub.push(this._mp.on('remote_input', payload => {
            this._remoteInput.applyKeys(payload?.keys ?? {});
        }));

        this._mpUnsub.push(this._mp.on('opponent_name', ({ name }) => {
            if (name) this._opponentName = name;
        }));

        if (this._isHost) {
            this._mpUnsub.push(this._mp.on('rematch_request', () => {
                if (this._gameOver) this.rematch();
            }));
        } else {
            this._mpUnsub.push(this._mp.on('hit_event', p => this._applyRemoteHit(p)));
            this._mpUnsub.push(this._mp.on('state_snapshot', p => this._applySnapshot(p)));
            this._mpUnsub.push(this._mp.on('round_end', p => this._applyRoundEnd(p)));
            this._mpUnsub.push(this._mp.on('rematch', p => this._applyRematch(p)));
        }
    }

    _fighterForSlot(slot) {
        return slot === 1 ? this._player : this._enemy;
    }

    _slotForFighter(fighter) {
        return fighter === this._player ? 1 : 2;
    }

    _startRound() {
        this._initGameObjects();
        this._running = true;
        this._paused = false;
        this._introActive = true;
        this._introTimer = CONFIG.roundIntroMs;

        // Reset network relay throttles so held inputs re-sync this round.
        this._lastSentKeysJson = '';
        this._lastSnapshotAt = 0;

        // Reset per-round visual state
        this._comboCount = 0;
        this._comboTimer = 0;
        this._comboOwner = null;
        this._shakeX = 0;
        this._shakeY = 0;

        this._audioManager.resumeContext().then(() =>
            this._audioManager.playMusic('bgm_fight', { volume: 0.5, loop: true })
        );

        this._lastTimestamp = null;
        if (!this._rafId) {
            this._rafId = requestAnimationFrame(this._gameLoop);
        }
    }

    stopGame() {
        this._running = false;
        this._paused = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    pauseGame() { if (this._running) this._paused = true; }
    resumeGame() {
        if (this._running && this._paused) {
            this._paused = false;
            this._lastTimestamp = null;
        }
    }

    isRunning() { return this._running; }
    isPaused() { return this._paused; }
    isGameOver() { return this._gameOver; }

    //  Volume / difficulty pass-throughs 

    setMasterVolume(v) { this._audioManager.setMasterVolume(v); }
    setMusicVolume(v) { this._audioManager.setMusicVolume(v); }
    setSFXVolume(v) { this._audioManager.setSFXVolume(v); }
    /** Stops the fight BGM — called by UIManager when returning to the main menu. */
    stopMusic() { this._audioManager.stopMusic(); }

    setDifficulty(val) {
        this._enemyAI?.setDifficulty(val);
    }

    //  Mobile virtual input pass-through 

    onVirtualButtonDown(action) { this._input.setVirtualKeyDown(this._actionToCode(action)); }
    onVirtualButtonUp(action) { this._input.setVirtualKeyUp(this._actionToCode(action)); }

    _actionToCode(action) {
        return {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            jump: 'ArrowUp',
            attack: 'KeyJ',
            heavy: 'KeyU',
            sweep: 'KeyI',
            block: 'KeyK',
        }[action] ?? '';
    }

    //  Game loop 

    _gameLoop(timestamp) {
        if (!this._running) return;

        let dt = 0;
        if (this._lastTimestamp) {
            dt = Math.min((timestamp - this._lastTimestamp) / 1000, 0.05); // cap at 50ms
        }
        this._lastTimestamp = timestamp;

        if (!this._paused) {
            this._update(dt, timestamp);
        }

        this._draw();
        this._input.update();
        if (this._gameMode === 'online') this._remoteInput.update();

        this._rafId = requestAnimationFrame(this._gameLoop);
    }

    _update(dt, timestamp) {
        // Round intro freeze
        if (this._introActive) {
            this._introTimer -= dt * 1000;
            if (this._introTimer <= 0) this._introActive = false;
            return;
        }

        if (this._gameOver) return;

        if (this._gameMode === 'online') {
            this._updateOnline(dt, timestamp);
            return;
        }

        // Update fighters
        this._player.update(this._input);
        this._enemyAI.update();
        this._enemy.update();

        // Collect pending hitboxes
        for (const fighter of [this._player, this._enemy]) {
            if (fighter.pendingHitbox) {
                this._hitboxes.push(fighter.pendingHitbox);
                fighter.pendingHitbox = null;
            }
        }

        // Process hitboxes
        this._updateHitboxes();

        // Update visuals
        this._updateFloatingTexts();
        this._updateScreenShake();
        this._updateGhostHP(dt);
        this._updateCombo(dt);

        // Check round end
        this._checkRoundEnd();
    }

    //  Online update path 

    _updateOnline(dt, timestamp) {
        this._frame++;

        // Drive both fighters from their (local or remote) input sources.
        this._player.update(this._playerInputSrc);
        this._enemy.update(this._enemyInputSrc);

        // Collect pending hitboxes from both fighters.
        for (const fighter of [this._player, this._enemy]) {
            if (fighter.pendingHitbox) {
                this._hitboxes.push(fighter.pendingHitbox);
                fighter.pendingHitbox = null;
            }
        }

        if (this._isHost) {
            // Host is authoritative: resolve hits and broadcast results.
            this._updateHitboxes();
        } else {
            // Guest never resolves PvP collisions; it just lets hitboxes expire.
            this._expireHitboxes();
        }

        // Visuals run on both clients.
        this._updateFloatingTexts();
        this._updateScreenShake();
        this._updateGhostHP(dt);
        this._updateCombo(dt);

        // Relay local input (edge-triggered to keep traffic low).
        this._sendLocalInput();

        if (this._isHost) {
            this._maybeSendSnapshot(timestamp);
            this._checkRoundEnd();
        }
    }

    _sendLocalInput() {
        if (!this._mp) return;
        const keys = keysFromInput(this._input);
        const json = JSON.stringify(keys);
        if (json === this._lastSentKeysJson) return;
        this._lastSentKeysJson = json;
        this._mp.sendInput(this._frame, keys);
    }

    _maybeSendSnapshot(timestamp) {
        if (!this._mp) return;
        if (timestamp - this._lastSnapshotAt < CONFIG.snapshotIntervalMs) return;
        this._lastSnapshotAt = timestamp;
        this._mp.sendStateSnapshot({
            frame: this._frame,
            fighters: [
                this._fighterSnapshot(1, this._player),
                this._fighterSnapshot(2, this._enemy),
            ],
        });
    }

    _fighterSnapshot(slot, f) {
        return {
            slot,
            x: f.x, y: f.y, vx: f.vx, vy: f.vy,
            facingRight: f.facingRight,
            health: f.health,
            state: f.state,
            stunTimer: f.stunTimer,
        };
    }

    _expireHitboxes() {
        for (let i = this._hitboxes.length - 1; i >= 0; i--) {
            const hb = this._hitboxes[i];
            hb.update();
            if (hb.isExpired()) this._hitboxes.splice(i, 1);
        }
    }

    //  Guest-side network application 

    _applyRemoteHit(p) {
        if (!p) return;
        const target = this._fighterForSlot(p.targetSlot);
        target.health = p.health;
        target.vx = p.vx;
        target.vy = p.vy;
        target.stunTimer = p.stunTimer;
        target.blockHitTimer = p.blockHitTimer;
        target.flashTimer = p.flashTimer;
        target.state = p.state;

        // Visual + audio feedback (mirrors host's _updateHitboxes).
        const color = target === this._player ? 'red' : 'green';
        this._floatingTexts.push(new FloatingHitCandle(p.hurtX, p.hurtY, color));
        this._triggerShake(p.big ? CONFIG.shakeMagnitude * 1.5 : CONFIG.shakeMagnitude);

        const who = p.ownerSlot === 1 ? 'player' : 'enemy';
        if (this._comboOwner === who) this._comboCount++;
        else { this._comboCount = 1; this._comboOwner = who; }
        this._comboTimer = 90;

        if (p.state === 'ko') this._audioManager?.playSFX('ko');
        else if (p.blockHitTimer > 0) this._audioManager?.playSFX('block');
        else this._audioManager?.playSFX('hit');
    }

    _applySnapshot(p) {
        if (!p?.fighters) return;
        for (const fs of p.fighters) {
            const f = this._fighterForSlot(fs.slot);
            if (fs.slot === this._localSlot) {
                // Local fighter: trust only authoritative health (keep responsive position).
                f.health = fs.health;
            } else {
                // Remote fighter: snap to authoritative transform.
                f.x = fs.x; f.y = fs.y;
                f.vx = fs.vx; f.vy = fs.vy;
                f.facingRight = fs.facingRight;
                f.health = fs.health;
            }
        }
    }

    _applyRoundEnd(p) {
        if (!p) return;
        this._gameOver = true;
        this._winner = p.winner;
        this._playerWins = p.p1Wins;
        this._enemyWins = p.p2Wins;
        this._recordLocalRoundResult();
        this._audioManager.stopMusic();
        this._ui.showGameOverOverlay();
    }

    /** If the local player won this round, notify the account layer (online only). */
    _recordLocalRoundResult() {
        if (this._gameMode !== 'online') return;
        const localWon = (this._localSlot === 1)
            ? this._winner === 'player'
            : this._winner === 'enemy';
        if (localWon) this._onLocalRoundWin?.();
    }

    _applyRematch(p) {
        if (!p) return;
        this._playerWins = p.p1Wins;
        this._enemyWins = p.p2Wins;
        this._round = p.round;
        this._gameOver = false;
        this._gameOverTriggered = false;
        this._winner = null;
        this._ui.hideGameOverOverlay();
        this._startRound();
    }

    //  Hitbox resolution 

    _updateHitboxes() {
        for (let i = this._hitboxes.length - 1; i >= 0; i--) {
            const hb = this._hitboxes[i];
            hb.update();

            const online = this._gameMode === 'online';

            for (const target of [this._player, this._enemy]) {
                if (!hb.checkCollision(target)) continue;

                const dir = hb.owner.facingRight ? 1 : -1;
                const prevHP = target.health;

                let damage = hb.damage;
                if (!online) {
                    // Asymmetric solo balance (player is the power fantasy).
                    if (hb.owner === this._player && target === this._enemy) {
                        damage *= 1.75;
                    } else if (hb.owner === this._enemy && target === this._player) {
                        damage *= 0.4;
                    }
                }

                target.takeHit(damage, hb.knockbackX * dir, hb.knockbackY);
                hb.markHit(target);

                // Hit candle — red when SON is punched, green when RIVAL is punched
                const dmg = prevHP - target.health;
                if (dmg > 0) {
                    const hurtbox = target.getHurtboxBounds();
                    const hitX = hurtbox.x + hurtbox.width / 2;
                    const hitY = hurtbox.y + hurtbox.height * 0.4;
                    const color = target === this._player ? 'red' : 'green';
                    this._floatingTexts.push(new FloatingHitCandle(hitX, hitY, color));

                    // Screen shake proportional to damage
                    const isBigHit = hb.owner.currentAttack?.name === 'heavyPunch';
                    this._triggerShake(isBigHit ? CONFIG.shakeMagnitude * 1.5 : CONFIG.shakeMagnitude);

                    // Combo tracking
                    const who = (hb.owner === this._player) ? 'player' : 'enemy';
                    if (this._comboOwner === who) {
                        this._comboCount++;
                    } else {
                        this._comboCount = 1;
                        this._comboOwner = who;
                    }
                    this._comboTimer = 90; // reset window

                    // Host broadcasts the authoritative result to the guest.
                    if (online && this._isHost && this._mp) {
                        this._mp.sendHitEvent({
                            targetSlot: this._slotForFighter(target),
                            ownerSlot: this._slotForFighter(hb.owner),
                            health: target.health,
                            state: target.state,
                            stunTimer: target.stunTimer,
                            blockHitTimer: target.blockHitTimer,
                            flashTimer: target.flashTimer,
                            vx: target.vx,
                            vy: target.vy,
                            big: isBigHit,
                            hurtX: hitX,
                            hurtY: hitY,
                        });
                    }
                }
            }

            if (hb.isExpired()) this._hitboxes.splice(i, 1);
        }
    }

    //  Visual systems 

    _triggerShake(magnitude) {
        const angle = Math.random() * Math.PI * 2;
        this._shakeX = Math.cos(angle) * magnitude;
        this._shakeY = Math.sin(angle) * magnitude;
    }

    _updateScreenShake() {
        this._shakeX *= CONFIG.shakeDecay;
        this._shakeY *= CONFIG.shakeDecay;
        if (Math.abs(this._shakeX) < 0.1) this._shakeX = 0;
        if (Math.abs(this._shakeY) < 0.1) this._shakeY = 0;
    }

    _updateFloatingTexts() {
        for (let i = this._floatingTexts.length - 1; i >= 0; i--) {
            this._floatingTexts[i].update();
            if (this._floatingTexts[i].isExpired()) this._floatingTexts.splice(i, 1);
        }
    }

    _updateGhostHP(dt) {
        const speed = CONFIG.ghostBarSpeed;
        if (this._playerGhostHP > this._player.health) {
            this._playerGhostHP = Math.max(this._player.health, this._playerGhostHP - speed);
        }
        if (this._enemyGhostHP > this._enemy.health) {
            this._enemyGhostHP = Math.max(this._enemy.health, this._enemyGhostHP - speed);
        }
    }

    _updateCombo() {
        if (this._comboTimer > 0) {
            this._comboTimer--;
        } else {
            this._comboCount = 0;
            this._comboOwner = null;
        }
    }

    //  Round / match logic 

    _checkRoundEnd() {
        if (this._gameOver || this._gameOverTriggered) return;

        if (this._player.state === 'ko' || this._enemy.state === 'ko') {
            this._gameOverTriggered = true;
            setTimeout(() => {
                this._gameOverTriggered = false;
                this._gameOver = true;
                this._winner = this._player.state === 'ko' ? 'enemy' : 'player';

                if (this._winner === 'player') this._playerWins++;
                else this._enemyWins++;

                this._recordLocalRoundResult();

                this._audioManager.stopMusic();
                this._ui.showGameOverOverlay();

                if (this._gameMode === 'online' && this._isHost && this._mp) {
                    const matchOver = this._playerWins >= CONFIG.roundsToWin || this._enemyWins >= CONFIG.roundsToWin;
                    this._mp.sendRoundEnd({
                        winner: this._winner,
                        p1Wins: this._playerWins,
                        p2Wins: this._enemyWins,
                        matchOver,
                    });
                }
            }, 1500);
        }
    }

    rematch() {
        // In online mode only the host drives the rematch; the guest restarts
        // when it receives the broadcast (see _applyRematch).
        if (this._gameMode === 'online' && !this._isHost) return;

        this._gameOver = false;
        this._gameOverTriggered = false;
        this._winner = null;

        // Check if the match is over (someone reached roundsToWin)
        if (this._playerWins >= CONFIG.roundsToWin || this._enemyWins >= CONFIG.roundsToWin) {
            // Full rematch — reset win counts
            this._playerWins = 0;
            this._enemyWins = 0;
            this._round = 1;
        } else {
            this._round++;
        }

        if (this._gameMode === 'online' && this._isHost && this._mp) {
            this._ui.hideGameOverOverlay();
            this._mp.sendRematch({
                p1Wins: this._playerWins,
                p2Wins: this._enemyWins,
                round: this._round,
            });
        }

        this._startRound();
    }

    //  Drawing 

    _draw() {
        const ctx = this._ctx;

        ctx.save();
        ctx.translate(Math.round(this._shakeX), Math.round(this._shakeY));

        // Background
        this._drawBackground(ctx);

        // Fighters
        if (this._player) this._player.draw(ctx);
        if (this._enemy) this._enemy.draw(ctx);

        // Hitbox debug (comment out for release)
        // for (const hb of this._hitboxes) hb.drawDebug(ctx);

        // Floating texts
        for (const ft of this._floatingTexts) ft.draw(ctx);

        ctx.restore(); // end shake transform

        // HUD (not shaken)
        if (this._player && this._enemy) this._drawHUD(ctx);

        // Round intro overlay
        if (this._introActive) this._drawIntro(ctx);

        // Game over overlay
        if (this._gameOver) this._drawGameOver(ctx);

        // Combo display
        if (this._comboCount >= 2 && this._comboTimer > 0) this._drawCombo(ctx);
    }

    _drawBackground(ctx) {
        const W = CONFIG.canvasWidth;
        const H = CONFIG.canvasHeight;
        const G = CONFIG.groundY;

        // Bright arena sky
        const sky = ctx.createLinearGradient(0, 0, 0, G);
        sky.addColorStop(0, '#ffffff');
        sky.addColorStop(0.55, '#f8fafc');
        sky.addColorStop(1, '#eef2f7');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, G);

        // Soft spotlight behind fighters
        const spotlight = ctx.createRadialGradient(W * 0.5, G * 0.55, 20, W * 0.5, G * 0.55, W * 0.55);
        spotlight.addColorStop(0, 'rgba(34, 197, 94, 0.08)');
        spotlight.addColorStop(0.45, 'rgba(254, 240, 138, 0.05)');
        spotlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = spotlight;
        ctx.fillRect(0, 0, W, G);

        // Faint chart grid lines
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1;
        for (let y = 36; y < G; y += 28) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        for (let x = 0; x <= W; x += 56) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, G);
            ctx.stroke();
        }
        ctx.restore();

        // Ground plane
        const ground = ctx.createLinearGradient(0, G, 0, H);
        ground.addColorStop(0, '#e8edf3');
        ground.addColorStop(1, '#d7dee8');
        ctx.fillStyle = ground;
        ctx.fillRect(0, G, W, H - G);

        // Trading floor line
        ctx.save();
        ctx.shadowColor = 'rgba(22, 163, 74, 0.45)';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, G);
        ctx.lineTo(W, G);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, G - 1);
        ctx.lineTo(W, G - 1);
        ctx.stroke();
        ctx.restore();

        this._drawPillar(ctx, 30, G);
        this._drawPillar(ctx, W - 55, G);
        this._drawCrowd(ctx, W, G);

        // Perspective floor grid
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.lineWidth = 1;
        const rows = 5;
        for (let r = 0; r <= rows; r++) {
            const t = r / rows;
            const y = G + t * (H - G);
            const xL = W / 2 * (1 - t);
            const xR = W - xL;
            ctx.beginPath();
            ctx.moveTo(xL, y);
            ctx.lineTo(xR, y);
            ctx.stroke();
        }
        const cols = 7;
        for (let c = 0; c <= cols; c++) {
            const t = c / cols;
            ctx.beginPath();
            ctx.moveTo(W * t, G);
            ctx.lineTo(W / 2 * (1 - (1 - t * 2 < 0 ? -(t * 2 - 1) : 1 - t * 2)), H);
            ctx.stroke();
        }
        ctx.restore();

        // Clean edges behind sprite overflow
        ctx.fillStyle = '#e8edf3';
        ctx.fillRect(0, G + 1, 120, H - G - 1);
        ctx.fillRect(W - 145, G + 1, 145, H - G - 1);
    }

    _drawPillar(ctx, x, groundY) {
        const h = 160;
        ctx.save();
        const grad = ctx.createLinearGradient(x, groundY - h, x + 25, groundY);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(1, 'rgba(226, 232, 240, 0.9)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, groundY - h, 25, h);

        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.strokeStyle = 'rgba(22, 163, 74, 0.55)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, groundY - h, 25, h);
        ctx.restore();
    }

    _drawCrowd(ctx, W, G) {
        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#94a3b8';
        for (let i = 0; i < W; i += 18) {
            const h = 20 + Math.sin(i * 0.3) * 8 + Math.sin(i * 0.7 + 1) * 5;
            ctx.beginPath();
            ctx.arc(i + 9, G - h, 9, Math.PI, 0);
            ctx.fill();
        }
        ctx.restore();
    }

    //  HUD 

    _drawHUD(ctx) {
        const BAR_W = 220;
        const BAR_H = 18;
        const PAD = 20;
        const BAR_Y = PAD;

        // Player bar (left)
        this._drawHealthBar(ctx, PAD, BAR_Y, BAR_W, BAR_H, this._player.health, this._playerGhostHP, this._player.maxHealth);
        // Enemy bar (right)
        this._drawHealthBar(ctx, CONFIG.canvasWidth - BAR_W - PAD, BAR_Y, BAR_W, BAR_H, this._enemy.health, this._enemyGhostHP, this._enemy.maxHealth);

        // Name plates
        let leftLabel = 'SON';
        let rightLabel = 'RIVAL';
        if (this._gameMode === 'online') {
            // Left = slot 1, right = slot 2; the local player's name carries "(you)".
            const localTag = name => `${name} (you)`;
            if (this._localSlot === 1) {
                leftLabel = localTag(this._localName);
                rightLabel = this._opponentName || 'P2';
            } else {
                leftLabel = this._opponentName || 'P1';
                rightLabel = localTag(this._localName);
            }
        }
        ctx.save();
        ctx.font = `bold 13px Pix32, sans-serif`;
        ctx.fillStyle = '#18181b';
        ctx.textAlign = 'left';
        ctx.fillText(leftLabel, PAD, BAR_Y + BAR_H + 14);
        ctx.textAlign = 'right';
        ctx.fillText(rightLabel, CONFIG.canvasWidth - PAD, BAR_Y + BAR_H + 14);
        ctx.restore();

        // Round + score indicator (top center)
        this._drawRoundInfo(ctx);

        // Live latency (online only)
        if (this._gameMode === 'online') this._drawLatency(ctx);
    }

    _drawLatency(ctx) {
        const ms = this._mp?.latencyMs;
        const text = (ms == null) ? 'PING --' : `PING ${ms} ms`;
        let color = '#16a34a';                 // good  (<100ms)
        if (ms == null) color = '#94a3b8';     // measuring
        else if (ms >= 250) color = '#ef4444'; // poor
        else if (ms >= 100) color = '#f59e0b'; // ok

        ctx.save();
        ctx.font = `bold 12px Pix32, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(text, CONFIG.canvasWidth / 2, 76);
        ctx.restore();
    }

    _drawHealthBar(ctx, x, y, w, h, hp, ghostHp, maxHp) {
        const pct = Math.max(0, hp) / maxHp;
        const ghostPct = Math.max(0, ghostHp) / maxHp;

        // Background track
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);

        // Ghost bar (orange, lags behind real HP)
        ctx.fillStyle = 'rgba(251, 146, 60, 0.45)';
        ctx.fillRect(x, y, w * ghostPct, h);

        // Actual HP bar with gradient
        const hpW = w * pct;
        if (hpW > 0) {
            const grad = ctx.createLinearGradient(x, y, x + hpW, y);
            if (pct > 0.5) { grad.addColorStop(0, '#22c55e'); grad.addColorStop(1, '#4ade80'); }
            else if (pct > 0.25) { grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#fbbf24'); }
            else { grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#f87171'); }
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, hpW, h);
        }

        // Border
        ctx.save();
        ctx.shadowColor = pct > 0.5 ? 'rgba(34, 197, 94, 0.35)' : pct > 0.25 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    }

    _drawRoundInfo(ctx) {
        const cx = CONFIG.canvasWidth / 2;
        ctx.save();
        ctx.textAlign = 'center';

        // Round label
        ctx.font = `bold 14px Pix32, sans-serif`;
        ctx.fillStyle = '#15803d';
        ctx.fillText(`ROUND ${this._round}`, cx, 58);

        // Win pips
        const pipR = 5;
        const pipGap = 14;
        const total = CONFIG.roundsToWin;
        const rowY = 34;

        // Player pips (left of center)
        for (let i = 0; i < total; i++) {
            ctx.beginPath();
            ctx.arc(cx - 20 - i * pipGap, rowY, pipR, 0, Math.PI * 2);
            ctx.fillStyle = i < this._playerWins ? '#22c55e' : 'rgba(15, 23, 42, 0.14)';
            ctx.fill();
        }
        // Enemy pips (right of center)
        for (let i = 0; i < total; i++) {
            ctx.beginPath();
            ctx.arc(cx + 20 + i * pipGap, rowY, pipR, 0, Math.PI * 2);
            ctx.fillStyle = i < this._enemyWins ? '#ef4444' : 'rgba(15, 23, 42, 0.14)';
            ctx.fill();
        }
        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    //  Overlays 

    _drawIntro(ctx) {
        const W = CONFIG.canvasWidth;
        const H = CONFIG.canvasHeight;
        const t = 1 - this._introTimer / CONFIG.roundIntroMs;

        // Fade-in → hold → fade-out
        let alpha;
        if (t < 0.2) alpha = t / 0.2;
        else if (t < 0.7) alpha = 1;
        else alpha = (1 - t) / 0.3;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.fillRect(0, 0, W, H);

        const roundDone = t > 0.65;
        const text = roundDone ? 'GET IN THERE, SON!' : `ROUND ${this._round}`;

        ctx.font = `bold 72px Pix32, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = roundDone ? 'rgba(254, 240, 138, 0.9)' : 'rgba(15, 23, 42, 0.15)';
        ctx.shadowBlur = roundDone ? 18 : 8;
        ctx.fillStyle = roundDone ? '#ca8a04' : '#18181b';
        ctx.fillText(text, W / 2, H / 2 + 20);
        ctx.restore();
    }

    _drawGameOver(ctx) {
        const W = CONFIG.canvasWidth;
        const H = CONFIG.canvasHeight;
        const matchOver = this._playerWins >= CONFIG.roundsToWin || this._enemyWins >= CONFIG.roundsToWin;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.textAlign = 'center';

        // Result text — Are ya winning, son? theme
        let resultText;
        let subText = '';
        if (matchOver) {
            if (this._playerWins >= CONFIG.roundsToWin) {
                resultText = 'ARE YA WINNING, SON?!';
                subText = 'Yeah. You absolutely are.';
            } else {
                resultText = 'ARE YA WINNING, SON?';
                subText = '...nah. Not this time, son.';
            }
        } else if (this._winner === 'player') {
            resultText = 'ARE YA WINNING, SON?';
            subText = 'That round? Yeah you are.';
        } else {
            resultText = 'ARE YA WINNING, SON?';
            subText = 'Nah son. Not that round.';
        }

        let playerWon =
            (matchOver && this._playerWins >= CONFIG.roundsToWin) ||
            (!matchOver && this._winner === 'player');

        if (this._gameMode === 'online') {
            // "player" here means the left fighter (slot 1). Flip the framing so
            // the message is relative to whichever side the local player controls.
            const leftWon = playerWon;
            playerWon = (this._localSlot === 1) ? leftWon : !leftWon;
            if (playerWon) {
                resultText = 'ARE YA WINNING, SON?!';
                subText = matchOver ? 'You took the match, son!' : 'That round is yours, son!';
            } else {
                resultText = 'ARE YA WINNING, SON?';
                subText = matchOver ? 'Not this time, son.' : 'Shake it off — next round.';
            }
        }

        ctx.font = `bold 42px Pix32, sans-serif`;
        ctx.shadowColor = playerWon ? 'rgba(202, 138, 4, 0.45)' : 'rgba(239, 68, 68, 0.35)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = playerWon ? '#ca8a04' : '#dc2626';
        ctx.fillText(resultText, W / 2, H / 2 - 28);

        ctx.font = `20px Pix32, sans-serif`;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#3f3f46';
        ctx.fillText(subText, W / 2, H / 2 + 8);

        // Score
        ctx.font = `24px Pix32, sans-serif`;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#15803d';
        ctx.fillText(`${this._playerWins} — ${this._enemyWins}`, W / 2, H / 2 + 38);

        // Rematch hint
        ctx.font = `16px Pix32, sans-serif`;
        ctx.fillStyle = 'rgba(63, 63, 70, 0.75)';
        ctx.fillText(
            matchOver ? 'Run it back, son — press REMATCH' : 'Next round or quit, son',
            W / 2,
            H / 2 + 68
        );
        ctx.restore();
    }

    _drawCombo(ctx) {
        if (this._comboCount < 2) return;
        const W = CONFIG.canvasWidth;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `bold 28px Pix32, sans-serif`;
        ctx.shadowColor = 'rgba(202, 138, 4, 0.35)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#b45309';
        ctx.fillText(`${this._comboCount}-HIT COMBO, SON!`, W / 2, CONFIG.canvasHeight - 30);
        ctx.restore();
    }
}

// 
// Bootstrap
// 

window.addEventListener('load', () => {
    window.game = new Game();
});
