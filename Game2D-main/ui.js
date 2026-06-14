/**
 * UIManager — manages all HTML overlay screens, settings persistence,
 * mobile controls, wallet gating, and button sound effects.
 *
 * Works in concert with Game (passed as a reference) but does NOT
 * reach into game internals beyond the documented public API:
 *   game.startGame()   game.stopGame()    game.rematch()
 *   game.pauseGame()   game.resumeGame()  game.isRunning()   game.isPaused()
 *   game.setMasterVolume() / setMusicVolume() / setSFXVolume()
 *   game.setDifficulty()
 *   game.onVirtualButtonDown() / onVirtualButtonUp()
 */
import WalletManager from './utils/walletManager.js';
import { SON_TOKEN } from './configs/config.js';

export default class UIManager {
    constructor(game) {
        this._game = game;

        //  Screen elements 
        this._menuScreen = document.getElementById('menuScreen');
        this._settingsScreen = document.getElementById('settingsScreen');
        this._instructionsScreen = document.getElementById('instructionsScreen');
        this._pauseOverlay = document.getElementById('pauseOverlay');
        this._gameOverOverlay = document.getElementById('gameOverOverlay');
        this._mobileControls = document.getElementById('mobileControls');
        this._pauseButton = document.getElementById('pauseButton');
        this._sonTag = document.getElementById('sonTag');

        //  Menu buttons 
        this._startButton = document.getElementById('startButton');
        this._settingsButton = document.getElementById('settingsButton');
        this._instructionsButton = document.getElementById('instructionsButton');

        //  Wallet 
        this._wallet = new WalletManager();
        this._connectWalletButton = document.getElementById('connectWalletButton');
        this._disconnectWalletButton = document.getElementById('disconnectWalletButton');
        this._walletConnected = document.getElementById('walletConnected');
        this._walletAddress = document.getElementById('walletAddress');
        this._walletHint = document.getElementById('walletHint');
        this._walletBuyLink = document.getElementById('walletBuyLink');

        //  Settings 
        this._settingsBackButton = document.getElementById('settingsBackButton');
        this._masterVolumeRange = document.getElementById('masterVolumeRange');
        this._musicVolumeRange = document.getElementById('musicVolumeRange');
        this._sfxVolumeRange = document.getElementById('sfxVolumeRange');
        this._muteToggle = document.getElementById('muteToggle');
        this._touchToggle = document.getElementById('touchToggle');
        this._difficultySelect = document.getElementById('difficultySelect');

        //  Instructions 
        this._instructionsBackButton = document.getElementById('instructionsBackButton');

        //  Pause overlay 
        this._resumeButton = document.getElementById('resumeButton');
        this._pauseSettingsButton = document.getElementById('pauseSettingsButton');
        this._quitButton = document.getElementById('quitButton');

        //  Game-over overlay 
        this._rematchButton = document.getElementById('rematchButton');
        this._quitToMenuButton = document.getElementById('quitToMenuButton');

        //  Mobile touch buttons 
        this._btnLeft = document.getElementById('btnLeft');
        this._btnRight = document.getElementById('btnRight');
        this._btnJump = document.getElementById('btnJump');
        this._btnAttack = document.getElementById('btnAttack');
        this._btnHeavy = document.getElementById('btnHeavy');
        this._btnSweep = document.getElementById('btnSweep');
        this._btnBlock = document.getElementById('btnBlock');

        //  SFX / BGM (outside AudioManager — for menu screens) 
        this._hoverSfx = new Audio('./assets/hover.mp3');
        this._splashBgm = new Audio('./assets/main.mp3');
        this._splashBgm.loop = true;

        // Track first user gesture (required for audio autoplay)
        this._userInteracted = false;

        // Track which screen opened Settings (so Back returns correctly)
        this._settingsParent = null;

        this._loadSettings();
        this._bindEvents();
        this._initWallet();
        this._updateMobileControlsVisibility();

        window.addEventListener('resize', () => this._updateMobileControlsVisibility());
    }

    //  Public API 

    /** Returns the currently selected difficulty string. */
    getDifficulty() {
        return this._difficultySelect?.value ?? 'easy';
    }

    showMainMenu() {
        this._hideAllScreens();
        this._show(this._menuScreen);
        this._refreshWalletState();
        this._updateHUDVisibility();
        this._updateMobileControlsVisibility();
        this._game.stopMusic();   // stop fight BGM when returning to menu
        this._splashBgm.currentTime = 0;
        this._splashBgm.play().catch(() => { });
    }

    showGameOverOverlay() {
        this._show(this._gameOverOverlay);
        this._updateHUDVisibility();
        this._updateMobileControlsVisibility();
    }

    hideGameOverOverlay() {
        this._hide(this._gameOverOverlay);
    }

    //  Settings helpers 

    _showSettings(parent) {
        this._settingsParent = parent;
        if (parent === 'pause' && this._game.isRunning() && !this._game.isPaused()) {
            this._game.pauseGame();
        }
        this._hideAllScreens();
        this._show(this._settingsScreen);
    }

    _onSettingsBack() {
        this._hide(this._settingsScreen);
        if (this._settingsParent === 'menu') this._show(this._menuScreen);
        if (this._settingsParent === 'pause') this._show(this._pauseOverlay);
        this._settingsParent = null;
    }

    //  Event binding 

    _bindEvents() {
        // First-gesture listener for audio
        document.addEventListener('click', () => {
            if (this._userInteracted) return;
            this._userInteracted = true;
            if (!this._menuScreen?.classList.contains('hidden')) {
                this._splashBgm.play().catch(() => { });
            }
        }, { once: false });

        // Hover sound on all buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (!this._userInteracted) return;
                this._hoverSfx.currentTime = 0;
                this._hoverSfx.play().catch(() => { });
            });
        });

        //  Wallet 
        this._connectWalletButton?.addEventListener('click', () => this._onConnectWallet());
        this._disconnectWalletButton?.addEventListener('click', () => this._onDisconnectWallet());

        //  Main menu 
        this._startButton?.addEventListener('click', () => {
            if (!this._wallet.canPlay) return;
            this._splashBgm.pause();
            this._splashBgm.currentTime = 0;
            this._hideAllScreens();
            this._game.startGame();
            this._updateHUDVisibility();
            this._updateMobileControlsVisibility();
        });

        this._settingsButton?.addEventListener('click', () => {
            if (!this._game.isRunning()) this._showSettings('menu');
        });

        this._instructionsButton?.addEventListener('click', () => {
            if (!this._game.isRunning()) {
                this._hideAllScreens();
                this._show(this._instructionsScreen);
            }
        });

        //  Settings 
        this._settingsBackButton?.addEventListener('click', () => this._onSettingsBack());

        this._masterVolumeRange?.addEventListener('input', () => { this._applyVolumes(); this._saveSettings(); });
        this._musicVolumeRange?.addEventListener('input', () => { this._applyVolumes(); this._saveSettings(); });
        this._sfxVolumeRange?.addEventListener('input', () => { this._applyVolumes(); this._saveSettings(); });
        this._muteToggle?.addEventListener('change', () => { this._applyVolumes(); this._saveSettings(); });
        this._touchToggle?.addEventListener('change', () => { this._saveSettings(); this._updateMobileControlsVisibility(); });
        this._difficultySelect?.addEventListener('change', () => {
            this._game.setDifficulty(this._difficultySelect.value);
            this._saveSettings();
        });

        // Splash BGM volume follows master
        this._masterVolumeRange?.addEventListener('input', () => {
            this._splashBgm.volume = parseFloat(this._masterVolumeRange.value);
        });
        this._muteToggle?.addEventListener('change', () => {
            this._splashBgm.muted = this._muteToggle.checked;
        });

        //  Instructions 
        this._instructionsBackButton?.addEventListener('click', () => {
            this._hideAllScreens();
            this._show(this._menuScreen);
        });

        //  Pause overlay 
        this._pauseButton?.addEventListener('click', () => {
            if (this._game.isRunning() && !this._game.isPaused()) {
                this._show(this._pauseOverlay);
                this._game.pauseGame();
                this._updateMobileControlsVisibility();
            }
        });

        this._resumeButton?.addEventListener('click', () => {
            this._hide(this._pauseOverlay);
            this._game.resumeGame();
            this._updateMobileControlsVisibility();
        });

        this._pauseSettingsButton?.addEventListener('click', () => {
            if (this._game.isRunning() && this._game.isPaused()) {
                this._showSettings('pause');
            }
        });

        this._quitButton?.addEventListener('click', () => {
            this._hide(this._pauseOverlay);
            this._game.stopGame();
            this.showMainMenu();
        });

        //  Game-over overlay 
        this._rematchButton?.addEventListener('click', () => {
            this.hideGameOverOverlay();
            this._game.rematch();
            this._updateHUDVisibility();
            this._updateMobileControlsVisibility();
        });

        this._quitToMenuButton?.addEventListener('click', () => {
            this.hideGameOverOverlay();
            this._game.stopGame();
            this.showMainMenu();
        });

        //  Keyboard shortcuts 
        window.addEventListener('keydown', e => {
            if (e.code !== 'Escape') return;

            if (this._isVisible(this._settingsScreen)) {
                this._onSettingsBack();
            } else if (this._isVisible(this._instructionsScreen)) {
                this._hideAllScreens();
                this._show(this._menuScreen);
            } else if (this._game.isRunning() && !this._game.isPaused()) {
                this._show(this._pauseOverlay);
                this._game.pauseGame();
                this._updateMobileControlsVisibility();
            } else if (this._game.isRunning() && this._game.isPaused() && this._isVisible(this._pauseOverlay)) {
                this._hide(this._pauseOverlay);
                this._game.resumeGame();
                this._updateMobileControlsVisibility();
            }
        });

        //  Mobile touch buttons 
        this._bindTouchButton(this._btnLeft, 'left');
        this._bindTouchButton(this._btnRight, 'right');
        this._bindTouchButton(this._btnJump, 'jump');
        this._bindTouchButton(this._btnAttack, 'attack');
        this._bindTouchButton(this._btnHeavy, 'heavy');
        this._bindTouchButton(this._btnSweep, 'sweep');
        this._bindTouchButton(this._btnBlock, 'block');
    }

    _bindTouchButton(elem, action) {
        if (!elem) return;
        const down = () => this._game.onVirtualButtonDown(action);
        const up = () => this._game.onVirtualButtonUp(action);
        elem.addEventListener('touchstart', e => { e.preventDefault(); down(); }, { passive: false });
        elem.addEventListener('touchend', e => { e.preventDefault(); up(); }, { passive: false });
        elem.addEventListener('mousedown', e => { e.preventDefault(); down(); });
        elem.addEventListener('mouseup', e => { e.preventDefault(); up(); });
        elem.addEventListener('mouseleave', e => { e.preventDefault(); up(); });
    }

    //  Wallet 

    async _refreshWalletState() {
        this._wallet.syncFromProvider();
        if (this._wallet.isConnected) {
            await this._wallet.checkBalance();
        }
        this._updateWalletUI();
    }

    async _initWallet() {
        this._wallet.onChange(() => this._updateWalletUI());

        window.addEventListener('focus', () => {
            this._refreshWalletState();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            this._refreshWalletState();
        });

        await this._wallet.tryAutoConnect();
        await this._refreshWalletState();
    }

    async _onConnectWallet() {
        if (this._wallet.isConnected || this._wallet.isConnecting) return;

        const btn = this._connectWalletButton;
        const prevLabel = btn?.textContent ?? 'Connect Phantom';
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Connecting…';
        }

        try {
            await this._wallet.connect();
        } catch (err) {
            if (err?.message && !err.message.includes('Opening Phantom')) {
                console.warn('[Wallet]', err.message);
            }
        } finally {
            this._wallet.syncFromProvider();
            if (btn) {
                btn.disabled = false;
                btn.textContent = prevLabel;
            }
            this._updateWalletUI();
        }
    }

    async _onDisconnectWallet() {
        await this._wallet.disconnect();
        this._updateWalletUI();
    }

    _updateWalletUI() {
        if (!this._wallet.isConnected) {
            this._wallet.syncFromProvider();
        }

        const connected = this._wallet.isConnected;
        const checking = this._wallet.isCheckingBalance;
        const canPlay = this._wallet.canPlay;

        if (connected) {
            this._hide(this._connectWalletButton);
            this._show(this._walletConnected);
            if (this._walletAddress) {
                this._walletAddress.textContent = this._wallet.displayAddress;
                this._walletAddress.title = this._wallet.address ?? '';
            }

            if (this._walletHint) {
                this._walletHint.classList.remove('hidden');

                if (checking) {
                    this._walletHint.textContent = 'Checking $SON balance…';
                    this._walletHint.classList.remove('wallet-hint--error');
                } else if (canPlay) {
                    this._walletHint.classList.add('hidden');
                } else if (this._wallet.lastError) {
                    this._walletHint.textContent = this._wallet.lastError;
                    this._walletHint.classList.add('wallet-hint--error');
                } else {
                    this._walletHint.textContent = `You need at least ${SON_TOKEN.minBalance} $SON to play. Balance: ${this._wallet.sonBalance.toLocaleString()}.`;
                    this._walletHint.classList.add('wallet-hint--error');
                }
            }

            if (this._walletBuyLink) {
                const showBuy = connected && !checking && !canPlay && !this._wallet.lastError;
                showBuy ? this._show(this._walletBuyLink) : this._hide(this._walletBuyLink);
            }
        } else {
            this._show(this._connectWalletButton);
            this._hide(this._walletConnected);
            this._hide(this._walletBuyLink);

            if (this._walletHint) {
                this._walletHint.classList.remove('hidden');
                const err = this._wallet.lastError;
                this._walletHint.textContent = err
                    ? err
                    : 'Connect your Phantom wallet to play.';
                this._walletHint.classList.toggle('wallet-hint--error', !!err);
            }
        }

        if (this._startButton) {
            this._startButton.disabled = !canPlay;
            if (canPlay) {
                this._startButton.title = '';
            } else if (connected && !checking) {
                this._startButton.title = `Hold at least ${SON_TOKEN.minBalance} $SON to play`;
            } else {
                this._startButton.title = 'Connect your Phantom wallet first';
            }
        }
    }

    //  Settings persistence 

    _saveSettings() {
        const s = {
            masterVolume: parseFloat(this._masterVolumeRange?.value ?? 0.5),
            musicVolume: parseFloat(this._musicVolumeRange?.value ?? 0.5),
            sfxVolume: parseFloat(this._sfxVolumeRange?.value ?? 0.5),
            muted: this._muteToggle?.checked ?? false,
            touchToggle: this._touchToggle?.value ?? 'auto',
            difficulty: this._difficultySelect?.value ?? 'easy',
        };
        localStorage.setItem('stickmanSettings', JSON.stringify(s));
    }

    _loadSettings() {
        let s = {};
        try { s = JSON.parse(localStorage.getItem('stickmanSettings') ?? '{}'); } catch { /* ignore */ }

        if (this._masterVolumeRange) this._masterVolumeRange.value = s.masterVolume ?? 0.5;
        if (this._musicVolumeRange) this._musicVolumeRange.value = s.musicVolume ?? 0.5;
        if (this._sfxVolumeRange) this._sfxVolumeRange.value = s.sfxVolume ?? 0.5;
        if (this._muteToggle) this._muteToggle.checked = s.muted ?? false;
        if (this._touchToggle) this._touchToggle.value = s.touchToggle ?? 'auto';
        if (this._difficultySelect) this._difficultySelect.value = s.difficulty ?? 'easy';

        this._splashBgm.volume = parseFloat(this._masterVolumeRange?.value ?? 0.5);
        this._applyVolumes();
    }

    _applyVolumes() {
        const muted = this._muteToggle?.checked ?? false;
        const masterVol = parseFloat(this._masterVolumeRange?.value ?? 0.5);
        const musicVol = parseFloat(this._musicVolumeRange?.value ?? 0.5);
        const sfxVol = parseFloat(this._sfxVolumeRange?.value ?? 0.5);

        if (muted) {
            this._game.setMasterVolume(0);
        } else {
            this._game.setMasterVolume(masterVol);
            this._game.setMusicVolume(musicVol);
            this._game.setSFXVolume(sfxVol);
        }
    }

    //  Visibility helpers 

    _show(el) { el?.classList.remove('hidden'); }
    _hide(el) { el?.classList.add('hidden'); }
    _isVisible(el) { return el && !el.classList.contains('hidden'); }

    _hideAllScreens() {
        [
            this._menuScreen,
            this._settingsScreen,
            this._instructionsScreen,
            this._pauseOverlay,
            this._gameOverOverlay,
        ].forEach(el => this._hide(el));
    }

    _updateHUDVisibility() {
        const inGame = this._game.isRunning() && !this._game.isPaused() && !this._game.isGameOver();
        if (inGame) {
            this._show(this._pauseButton);
            this._show(this._sonTag);
        } else {
            this._hide(this._pauseButton);
            this._hide(this._sonTag);
        }
    }

    _updateMobileControlsVisibility() {
        const mode = this._touchToggle?.value ?? 'auto';
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const wantShow = mode === 'on' || (mode === 'auto' && isTouch);
        const canShow = wantShow
            && this._game.isRunning()
            && !this._game.isPaused()
            && !this._game.isGameOver()
            && !this._isVisible(this._settingsScreen)
            && !this._isVisible(this._instructionsScreen)
            && !this._isVisible(this._pauseOverlay)
            && !this._isVisible(this._gameOverOverlay);

        canShow ? this._show(this._mobileControls) : this._hide(this._mobileControls);
    }
}
