import { CONFIG } from './configs/config.js';
import { World } from './world/world.js';
import { Player } from './entities/player.js';
import { Camera } from './systems/camera.js';
import { Input } from './systems/input.js';
import { Renderer } from './systems/renderer.js';
import {
    MiningSystem,
    Inventory,
    spawnParticles,
    updateParticles,
} from './systems/mining.js';
import { HotbarUI } from './ui/hotbar.js';
import { SoundFX } from './utils/sound.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

class Game {
    constructor() {
        this._running = false;
        this._paused = false;
        this._state = 'menu';

        this.world = null;
        this.player = null;
        this.camera = new Camera();
        this.input = new Input(canvas);
        this.renderer = new Renderer();
        this.mining = new MiningSystem();
        this.inventory = new Inventory();
        this.particles = [];
        this.sound = new SoundFX();

        this.hotbar = new HotbarUI(document.getElementById('hotbar'));
        this.hotbar.onSelect = (slot) => this.inventory.selectSlot(slot);

        this._bindUI();
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _bindUI() {
        document.getElementById('startButton').addEventListener('click', () => {
            this.sound.resume();
            this.start();
        });
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeButton').addEventListener('click', () => this.togglePause());
        document.getElementById('menuButton').addEventListener('click', () => this.toMenu());
    }

    _resize() {
        const container = document.getElementById('gameContainer');
        const aspect = CONFIG.canvasWidth / CONFIG.canvasHeight;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w / h > aspect) {
            canvas.style.width = `${h * aspect}px`;
            canvas.style.height = `${h}px`;
        } else {
            canvas.style.width = `${w}px`;
            canvas.style.height = `${w / aspect}px`;
        }
    }

    _showScreen(id) {
        document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
        if (id) document.getElementById(id)?.classList.remove('hidden');
    }

    start() {
        this.world = new World();
        const ts = CONFIG.tileSize;
        const spawnX = Math.floor(CONFIG.worldWidth / 2) * ts;
        const surfaceY = this.world.surfaceY(Math.floor(CONFIG.worldWidth / 2));
        const spawnY = surfaceY * ts - CONFIG.playerHeight - 2;

        this.player = new Player(spawnX, spawnY);
        this.camera.x = spawnX - CONFIG.canvasWidth / 2;
        this.camera.y = spawnY - CONFIG.canvasHeight / 2;
        this.particles = [];
        this.mining.reset();
        this.inventory = new Inventory();
        this.hotbar.onSelect = (slot) => this.inventory.selectSlot(slot);

        this._state = 'playing';
        this._paused = false;
        this._running = true;

        this._showScreen(null);
        document.getElementById('pauseButton').classList.remove('hidden');
        document.getElementById('hotbar').classList.remove('hidden');
        document.getElementById('touchControls').classList.remove('hidden');
        document.getElementById('hudHint').classList.remove('hidden');

        if (!this._rafId) {
            this._lastTs = performance.now();
            this._gameLoop = this._gameLoop.bind(this);
            this._rafId = requestAnimationFrame(this._gameLoop);
        }
    }

    toMenu() {
        this._paused = false;
        this._state = 'menu';
        this._showScreen('menuScreen');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('pauseButton').classList.add('hidden');
        document.getElementById('hotbar').classList.add('hidden');
        document.getElementById('touchControls').classList.add('hidden');
        document.getElementById('hudHint').classList.add('hidden');
    }

    togglePause() {
        if (this._state !== 'playing') return;
        this._paused = !this._paused;
        document.getElementById('pauseScreen').classList.toggle('hidden', !this._paused);
    }

    _update() {
        if (this._state !== 'playing' || this._paused) return;

        const slot = this.input.hotbarSlot();
        if (slot >= 0) this.inventory.selectSlot(slot);

        this.player.update(this.input, this.world);
        if (this.player.jumpedThisFrame) this.sound.playJump();

        const worldW = this.world.width * CONFIG.tileSize;
        const worldH = this.world.height * CONFIG.tileSize;
        this.camera.follow(this.player.centerX, this.player.centerY, worldW, worldH);

        const broken = this.mining.update(
            this.input, this.player, this.world, this.camera, this.inventory
        );
        if (broken) {
            spawnParticles(this.particles, broken.tx, broken.ty, broken.blockId);
            this.sound.playBreak();
        }

        const placed = this.mining.tryPlace(
            this.input,
            this.player,
            this.world,
            this.camera,
            this.inventory,
            this.inventory.getSelectedBlock()
        );
        if (placed) this.sound.playPlace();

        updateParticles(this.particles);
        this.hotbar.update(this.inventory);
    }

    _draw() {
        ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        if (this._state === 'playing' && this.world && this.player) {
            this.renderer.draw(
                ctx,
                this.world,
                this.camera,
                this.player,
                this.mining,
                this.particles
            );
        }
    }

    _gameLoop(ts) {
        if (!this._running) return;
        this._update();
        this._draw();
        this._rafId = requestAnimationFrame(this._gameLoop);
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});
