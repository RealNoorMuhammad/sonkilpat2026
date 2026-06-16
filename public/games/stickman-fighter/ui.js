/**
 * UIManager — manages all HTML overlay screens, settings persistence,
 * mobile controls, and button sound effects.
 *
 * Works in concert with Game (passed as a reference) but does NOT
 * reach into game internals beyond the documented public API:
 *   game.startGame()   game.stopGame()    game.rematch()
 *   game.pauseGame()   game.resumeGame()  game.isRunning()   game.isPaused()
 *   game.setMasterVolume() / setMusicVolume() / setSFXVolume()
 *   game.setDifficulty()
 *   game.onVirtualButtonDown() / onVirtualButtonUp()
 */
import VirtualJoystick from './utils/virtualJoystick.js';
import MultiplayerManager from './net/multiplayerManager.js';
import { connectPhantom, shortAddress, isMobile, waitForPhantomProvider } from './net/phantomWallet.js';
import { buildConnectDeeplink, readConnectResponseFromUrl, clearConnectResponseFromUrl } from './net/phantomDeeplink.js';
import { getPlayerByAddress, registerPlayer, getLeaderboard, incrementRoundWins } from './net/playerStore.js';

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

        //  Multiplayer screens 
        this._multiplayerScreen = document.getElementById('multiplayerScreen');
        this._createRoomScreen = document.getElementById('createRoomScreen');
        this._joinRoomScreen = document.getElementById('joinRoomScreen');
        this._disconnectOverlay = document.getElementById('disconnectOverlay');
        this._nameRegisterScreen = document.getElementById('nameRegisterScreen');
        this._leaderboardScreen = document.getElementById('leaderboardScreen');

        //  Menu buttons 
        this._startButton = document.getElementById('startButton');
        this._multiplayerButton = document.getElementById('multiplayerButton');
        this._leaderboardButton = document.getElementById('leaderboardButton');
        this._settingsButton = document.getElementById('settingsButton');
        this._instructionsButton = document.getElementById('instructionsButton');

        //  Wallet + account controls 
        this._walletStatus = document.getElementById('walletStatus');
        this._connectWalletButton = document.getElementById('connectWalletButton');
        this._openPhantomLink = document.getElementById('openPhantomLink');
        this._registerNameInput = document.getElementById('registerNameInput');
        this._registerError = document.getElementById('registerError');
        this._registerStatus = document.getElementById('registerStatus');
        this._registerConfirmButton = document.getElementById('registerConfirmButton');
        this._registerBackButton = document.getElementById('registerBackButton');
        this._leaderboardList = document.getElementById('leaderboardList');
        this._leaderboardBackButton = document.getElementById('leaderboardBackButton');

        //  Multiplayer controls 
        this._createRoomButton = document.getElementById('createRoomButton');
        this._joinRoomButton = document.getElementById('joinRoomButton');
        this._multiplayerBackButton = document.getElementById('multiplayerBackButton');
        this._roomCodeDisplay = document.getElementById('roomCodeDisplay');
        this._copyCodeButton = document.getElementById('copyCodeButton');
        this._createRoomStatus = document.getElementById('createRoomStatus');
        this._createRoomBackButton = document.getElementById('createRoomBackButton');
        this._roomCodeInput = document.getElementById('roomCodeInput');
        this._confirmJoinButton = document.getElementById('confirmJoinButton');
        this._joinRoomBackButton = document.getElementById('joinRoomBackButton');
        this._joinRoomError = document.getElementById('joinRoomError');
        this._joinRoomStatus = document.getElementById('joinRoomStatus');
        this._disconnectMessage = document.getElementById('disconnectMessage');
        this._disconnectBackButton = document.getElementById('disconnectBackButton');
        this._difficultySetting = document.getElementById('difficultySetting');

        //  Multiplayer state 
        this._mp = null;            // MultiplayerManager instance (lazy)
        this._mpStarting = false;   // guard against double game-start

        //  Account state 
        this._wallet = null;        // { address, name, round_wins } once connected + registered
        this._pendingAddress = null; // connected wallet awaiting name registration

        //  Settings 
        this._settingsBackButton = document.getElementById('settingsBackButton');
        this._masterVolumeRange = document.getElementById('masterVolumeRange');
        this._musicVolumeRange = document.getElementById('musicVolumeRange');
        this._sfxVolumeRange = document.getElementById('sfxVolumeRange');
        this._muteToggle = document.getElementById('muteToggle');
        this._touchToggle = document.getElementById('touchToggle');
        this._difficultySelect = document.getElementById('difficultySelect');

        //  Instructions / About tabs 
        this._instructionsBackButton = document.getElementById('instructionsBackButton');
        this._aboutTabs = document.querySelectorAll('#instructionsScreen .about-tab');
        this._aboutPanels = document.querySelectorAll('#instructionsScreen .about-tab-panel');
        this._activeAboutTab = 'overview';

        //  Pause overlay 
        this._resumeButton = document.getElementById('resumeButton');
        this._pauseSettingsButton = document.getElementById('pauseSettingsButton');
        this._quitButton = document.getElementById('quitButton');

        //  Game-over overlay 
        this._rematchButton = document.getElementById('rematchButton');
        this._quitToMenuButton = document.getElementById('quitToMenuButton');

        //  Mobile touch buttons 
        this._moveJoystick = document.getElementById('moveJoystick');
        this._joystickKnob = this._moveJoystick?.querySelector('.joystick__knob');
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
        this._initJoystick();
        this._updateMobileControlsVisibility();
        this._checkPhantomRedirect();   // handle a returning Phantom connect deeplink

        window.addEventListener('resize', () => this._updateMobileControlsVisibility());
    }

    //  Public API 

    /** Returns the currently selected difficulty string. */
    getDifficulty() {
        return this._difficultySelect?.value ?? 'easy';
    }

    showMainMenu() {
        this._teardownMultiplayer();
        this._resetWalletGate();   // require a fresh wallet connection next time
        this._hideAllScreens();
        this._show(this._menuScreen);
        this._updateHUDVisibility();
        this._updateMobileControlsVisibility();
        this._game.stopMusic();   // stop fight BGM when returning to menu
        this._splashBgm.currentTime = 0;
        this._splashBgm.play().catch(() => { });
    }

    showGameOverOverlay() {
        if (this._rematchButton) {
            this._rematchButton.textContent = 'Run It Back';
            this._rematchButton.disabled = false;
        }
        this._show(this._gameOverOverlay);
        this._updateHUDVisibility();
        this._updateMobileControlsVisibility();
    }

    hideGameOverOverlay() {
        this._hide(this._gameOverOverlay);
    }

    //  Multiplayer flow 

    _ensureMp() {
        if (!this._mp) this._mp = new MultiplayerManager();
        return this._mp;
    }

    //  Wallet + account flow 

    /** Reset the multiplayer screen to its "connect your wallet" state. */
    _resetWalletGate() {
        this._wallet = null;
        this._pendingAddress = null;
        if (this._walletStatus) {
            this._walletStatus.textContent = 'Checking for Phantom wallet…';
            this._walletStatus.classList.remove('wallet-status--connected');
        }
        if (this._connectWalletButton) this._connectWalletButton.textContent = 'Connect Phantom';
        this._show(this._connectWalletButton);
        this._hide(this._openPhantomLink);
        this._setOnlineButtonsEnabled(false);
        this._refreshWalletAvailability();
    }

    /** Detect Phantom and tailor the button/status for desktop vs mobile. */
    async _refreshWalletAvailability() {
        const provider = await waitForPhantomProvider(1500);
        // Bail if the user connected or navigated away while we waited.
        if (this._wallet || !this._walletStatus) return;

        if (provider) {
            // Phantom is injected (desktop extension or Phantom's in-app browser).
            this._walletStatus.textContent = 'Wallet not connected.';
            this._show(this._connectWalletButton);
            this._hide(this._openPhantomLink);
            if (this._connectWalletButton) this._connectWalletButton.textContent = 'Connect Phantom';
        } else if (isMobile()) {
            // No injected provider on a normal mobile browser. Use the connect
            // deeplink so the user STAYS in this browser (Chrome/Safari) — Phantom
            // opens only to approve, then redirects back here. Deeplinks must be a
            // REAL user tap on a link (a JS redirect gets ignored), so use an anchor.
            this._walletStatus.textContent = 'Tap to approve in Phantom, then you\u2019ll come right back here.';
            this._hide(this._connectWalletButton);
            if (this._openPhantomLink) {
                this._openPhantomLink.textContent = 'Connect Phantom';
                this._openPhantomLink.setAttribute('target', '_top');
                this._openPhantomLink.href = buildConnectDeeplink();
                this._show(this._openPhantomLink);
            }
        } else {
            this._walletStatus.innerHTML =
                'Phantom extension not found. '
                + '<a href="https://phantom.app/download" target="_blank" rel="noopener">Get Phantom</a>, then reload.';
            this._show(this._connectWalletButton);
            this._hide(this._openPhantomLink);
        }
    }

    _setOnlineButtonsEnabled(enabled) {
        if (this._createRoomButton) this._createRoomButton.disabled = !enabled;
        if (this._joinRoomButton) this._joinRoomButton.disabled = !enabled;
    }

    async _onConnectWallet() {
        if (!this._walletStatus) return;
        this._walletStatus.textContent = 'Connecting wallet…';
        this._walletStatus.classList.remove('wallet-status--connected');
        this._setOnlineButtonsEnabled(false);
        try {
            const address = await connectPhantom();
            await this._handleConnectedAddress(address);
        } catch (err) {
            this._walletStatus.textContent = (err && err.message) || 'Could not connect wallet.';
        }
    }

    /** Shared path once we have a wallet address (injected provider or deeplink). */
    async _handleConnectedAddress(address) {
        const profile = await getPlayerByAddress(address);
        if (profile) {
            this._wallet = profile;
            this._applyWalletConnected();
        } else {
            // New wallet — ask the player to pick a unique name.
            this._pendingAddress = address;
            this._hideAllScreens();
            this._hide(this._registerError);
            this._hide(this._registerStatus);
            if (this._registerNameInput) this._registerNameInput.value = '';
            this._show(this._nameRegisterScreen);
            this._registerNameInput?.focus();
        }
    }

    /**
     * On load, handle a Phantom connect-deeplink redirect (mobile). Phantom
     * returns to this page in the SAME browser with an encrypted payload in the
     * URL; we decrypt it to get the wallet address and continue the flow.
     */
    async _checkPhantomRedirect() {
        const res = readConnectResponseFromUrl();
        if (!res) return;
        clearConnectResponseFromUrl();

        this._splashBgm?.pause();
        this._hideAllScreens();
        this._show(this._multiplayerScreen);
        this._show(this._connectWalletButton);
        this._hide(this._openPhantomLink);
        this._wallet = null;
        this._pendingAddress = null;

        if (res.error) {
            if (this._walletStatus) this._walletStatus.textContent = res.error;
            this._setOnlineButtonsEnabled(false);
            return;
        }
        if (this._walletStatus) this._walletStatus.textContent = 'Wallet connected. Loading profile…';
        try {
            await this._handleConnectedAddress(res.address);
        } catch (err) {
            if (this._walletStatus) this._walletStatus.textContent = (err && err.message) || 'Could not load profile.';
        }
    }

    _applyWalletConnected() {
        if (!this._wallet) return;
        const { name, address, round_wins } = this._wallet;
        if (this._walletStatus) {
            this._walletStatus.textContent =
                `Connected as ${name} · ${shortAddress(address)} · Wins: ${round_wins ?? 0}`;
            this._walletStatus.classList.add('wallet-status--connected');
        }
        if (this._connectWalletButton) this._connectWalletButton.textContent = 'Reconnect Wallet';
        this._setOnlineButtonsEnabled(true);
    }

    async _onConfirmRegister() {
        const name = (this._registerNameInput?.value || '').trim();
        this._hide(this._registerError);
        if (name.length < 2) {
            this._showRegisterError('Name must be at least 2 characters.');
            return;
        }
        if (!this._pendingAddress) {
            this._showRegisterError('Wallet disconnected. Go back and reconnect.');
            return;
        }
        this._show(this._registerStatus);
        this._registerStatus.textContent = 'Saving…';
        try {
            const profile = await registerPlayer(this._pendingAddress, name);
            this._wallet = profile;
            this._pendingAddress = null;
            this._hide(this._registerStatus);
            this._hideAllScreens();
            this._show(this._multiplayerScreen);
            this._applyWalletConnected();
        } catch (err) {
            this._hide(this._registerStatus);
            this._showRegisterError((err && err.message) || 'Could not save your name.');
        }
    }

    _showRegisterError(message) {
        if (!this._registerError) return;
        this._registerError.textContent = message;
        this._show(this._registerError);
    }

    /** Increment the connected player's round-win total (local + backend). */
    _recordRoundWin() {
        if (!this._wallet?.address) return;
        this._wallet.round_wins = (this._wallet.round_wins ?? 0) + 1;
        incrementRoundWins(this._wallet.address, 1);
    }

    //  Leaderboard 

    async _openLeaderboard() {
        this._hideAllScreens();
        this._show(this._leaderboardScreen);
        if (this._leaderboardList) {
            this._leaderboardList.innerHTML = '<li class="leaderboard-empty">Loading…</li>';
        }
        const rows = await getLeaderboard(20);
        this._renderLeaderboard(rows);
    }

    _renderLeaderboard(rows) {
        if (!this._leaderboardList) return;
        if (!rows.length) {
            this._leaderboardList.innerHTML =
                '<li class="leaderboard-empty">No fighters yet. Be the first, son!</li>';
            return;
        }
        const myAddress = this._wallet?.address;
        this._leaderboardList.innerHTML = rows.map((row, i) => {
            const me = row.address && row.address === myAddress ? ' leaderboard-row--me' : '';
            const name = this._escapeHtml(row.name || 'Anon');
            return `<li class="leaderboard-row${me}">`
                + `<span class="leaderboard-rank">${i + 1}</span>`
                + `<span class="leaderboard-name">${name}</span>`
                + `<span class="leaderboard-wins">${row.round_wins ?? 0}</span>`
                + `</li>`;
        }).join('');
    }

    _escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    //  About screen tabs 

    _bindAboutTabs() {
        this._aboutTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this._switchAboutTab(tab.dataset.tab);
            });
        });
    }

    _resetAboutTab() {
        this._switchAboutTab('overview');
    }

    _switchAboutTab(tabId) {
        if (!tabId) return;
        this._activeAboutTab = tabId;

        this._aboutTabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.classList.toggle('about-tab--active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        this._aboutPanels.forEach(panel => {
            const isActive = panel.dataset.tab === tabId;
            panel.classList.toggle('hidden', !isActive);
            panel.hidden = !isActive;
        });
    }

    _setupMpHandlers() {
        const mp = this._mp;
        if (!mp) return;
        mp.on('ready', () => this._startOnlineMatch());
        mp.on('opponent_left', () => this._onOpponentLeft());
        mp.on('opponent_name', ({ name }) => this._onOpponentName(name));
        mp.on('error', ({ message }) => this._showJoinError(message || 'Connection error.'));
    }

    async _onCreateRoom() {
        if (!this._wallet) return;
        const playerName = this._wallet.name;
        const mp = this._ensureMp();
        this._setupMpHandlers();
        this._hideAllScreens();
        this._show(this._createRoomScreen);
        this._roomCodeDisplay.textContent = '······';
        this._createRoomStatus.textContent = 'Creating room…';
        try {
            const { roomCode } = await mp.createRoom(playerName);
            this._roomCodeDisplay.textContent = roomCode;
            this._createRoomStatus.textContent = 'Waiting for opponent to join…';
        } catch (err) {
            this._createRoomStatus.textContent = (err && err.message) || 'Could not create room.';
        }
    }

    async _onConfirmJoin() {
        if (!this._wallet) return;
        const playerName = this._wallet.name;
        const code = (this._roomCodeInput?.value || '').trim().toUpperCase();
        this._hide(this._joinRoomError);
        const mp = this._ensureMp();
        this._setupMpHandlers();
        this._show(this._joinRoomStatus);
        this._joinRoomStatus.textContent = 'Connecting…';
        try {
            await mp.joinRoom(code, playerName);
            this._joinRoomStatus.textContent = 'Connected. Starting…';
        } catch (err) {
            this._hide(this._joinRoomStatus);
            this._showJoinError((err && err.message) || 'Could not join room.');
        }
    }

    _onCopyCode() {
        const code = this._roomCodeDisplay?.textContent || '';
        if (!code || code.startsWith('·')) return;
        navigator.clipboard?.writeText(code).then(
            () => { this._copyCodeButton.textContent = 'Copied!'; setTimeout(() => { this._copyCodeButton.textContent = 'Copy Code'; }, 1500); },
            () => { /* clipboard blocked — ignore */ },
        );
    }

    /** Reflect the opponent's name on whichever lobby screen is showing. */
    _onOpponentName(name) {
        if (!name) return;
        if (this._isVisible(this._createRoomScreen)) {
            this._createRoomStatus.textContent = `${name} joined! Starting…`;
        } else if (this._isVisible(this._joinRoomScreen)) {
            this._joinRoomStatus.textContent = `Joining ${name}'s room…`;
        }
    }

    _showJoinError(message) {
        if (!this._joinRoomError) return;
        this._joinRoomError.textContent = message;
        this._show(this._joinRoomError);
    }

    _startOnlineMatch() {
        if (this._mpStarting || !this._mp) return;
        this._mpStarting = true;
        this._splashBgm.pause();
        this._splashBgm.currentTime = 0;
        this._hideAllScreens();
        this._setDifficultyVisible(false);
        this._game.startOnlineGame({
            slot: this._mp.slot,
            isHost: this._mp.isHost,
            mp: this._mp,
            onLocalRoundWin: () => this._recordRoundWin(),
        });
        this._updateHUDVisibility();
        this._updateMobileControlsVisibility();
    }

    _onOpponentLeft() {
        this._game.pauseGame?.();
        this._hideAllScreens();
        this._disconnectMessage.textContent = 'Your opponent disconnected.';
        this._show(this._disconnectOverlay);
    }

    async _onCancelRoom() {
        await this._teardownMultiplayer();
        this._hideAllScreens();
        this._show(this._multiplayerScreen);
    }

    async _teardownMultiplayer() {
        this._mpStarting = false;
        this._setDifficultyVisible(true);
        if (this._mp) {
            const mp = this._mp;
            this._mp = null;
            await mp.leaveRoom();
        }
    }

    _setDifficultyVisible(visible) {
        if (!this._difficultySetting) return;
        this._difficultySetting.style.display = visible ? '' : 'none';
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

        //  Main menu 
        this._startButton?.addEventListener('click', () => {
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
                this._resetAboutTab();
                this._show(this._instructionsScreen);
            }
        });

        this._bindAboutTabs();

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

        //  Multiplayer 
        this._multiplayerButton?.addEventListener('click', () => {
            if (this._game.isRunning()) return;
            this._splashBgm.pause();
            this._hideAllScreens();
            this._resetWalletGate();   // must (re)connect a wallet to play
            this._show(this._multiplayerScreen);
        });

        this._multiplayerBackButton?.addEventListener('click', () => {
            this._hideAllScreens();
            this.showMainMenu();
        });

        //  Wallet + account 
        this._connectWalletButton?.addEventListener('click', () => this._onConnectWallet());
        this._registerConfirmButton?.addEventListener('click', () => this._onConfirmRegister());
        this._registerNameInput?.addEventListener('keydown', e => {
            if (e.code === 'Enter') { e.preventDefault(); this._onConfirmRegister(); }
        });
        this._registerBackButton?.addEventListener('click', () => {
            this._pendingAddress = null;
            this._hideAllScreens();
            this._resetWalletGate();
            this._show(this._multiplayerScreen);
        });

        //  Leaderboard 
        this._leaderboardButton?.addEventListener('click', () => {
            if (this._game.isRunning()) return;
            this._splashBgm.pause();
            this._openLeaderboard();
        });
        this._leaderboardBackButton?.addEventListener('click', () => {
            this._hideAllScreens();
            this.showMainMenu();
        });

        this._createRoomButton?.addEventListener('click', () => this._onCreateRoom());
        this._createRoomBackButton?.addEventListener('click', () => this._onCancelRoom());
        this._copyCodeButton?.addEventListener('click', () => this._onCopyCode());

        this._joinRoomButton?.addEventListener('click', () => {
            this._hideAllScreens();
            this._show(this._joinRoomScreen);
            this._hide(this._joinRoomError);
            this._hide(this._joinRoomStatus);
            this._roomCodeInput.value = '';
            this._roomCodeInput.focus();
        });

        this._roomCodeInput?.addEventListener('input', () => {
            this._roomCodeInput.value = this._roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
        this._roomCodeInput?.addEventListener('keydown', e => {
            if (e.code === 'Enter') { e.preventDefault(); this._onConfirmJoin(); }
        });

        this._confirmJoinButton?.addEventListener('click', () => this._onConfirmJoin());
        this._joinRoomBackButton?.addEventListener('click', () => this._onCancelRoom());
        this._disconnectBackButton?.addEventListener('click', () => {
            this._hide(this._disconnectOverlay);
            this._teardownMultiplayer();
            this._game.stopGame();
            this.showMainMenu();
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
            if (this._game.isOnline?.()) {
                // Host drives the rematch; guest asks and waits for the host.
                if (this._mp && !this._mp.isHost) {
                    this._mp.requestRematch();
                    this._rematchButton.textContent = 'Waiting for host…';
                    this._rematchButton.disabled = true;
                    return;
                }
                this._game.rematch();
                return;
            }
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
        this._bindTouchButton(this._btnAttack, 'attack');
        this._bindTouchButton(this._btnHeavy, 'heavy');
        this._bindTouchButton(this._btnSweep, 'sweep');
        this._bindTouchButton(this._btnBlock, 'block');
    }

    _initJoystick() {
        const base = this._moveJoystick?.querySelector('.joystick__base');
        if (!this._moveJoystick || !this._joystickKnob || !base) return;

        this._joystick = new VirtualJoystick(
            base,
            this._joystickKnob,
            (action, pressed) => {
                if (pressed) this._game.onVirtualButtonDown(action);
                else this._game.onVirtualButtonUp(action);
            },
        );
    }

    _bindTouchButton(elem, action) {
        if (!elem) return;
        const down = () => {
            elem.classList.add('touch-button--pressed');
            this._game.onVirtualButtonDown(action);
        };
        const up = () => {
            elem.classList.remove('touch-button--pressed');
            this._game.onVirtualButtonUp(action);
        };
        elem.addEventListener('touchstart', e => { e.preventDefault(); down(); }, { passive: false });
        elem.addEventListener('touchend', e => { e.preventDefault(); up(); }, { passive: false });
        elem.addEventListener('touchcancel', e => { e.preventDefault(); up(); }, { passive: false });
        elem.addEventListener('mousedown', e => { e.preventDefault(); down(); });
        elem.addEventListener('mouseup', e => { e.preventDefault(); up(); });
        elem.addEventListener('mouseleave', e => { e.preventDefault(); up(); });
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
            this._multiplayerScreen,
            this._createRoomScreen,
            this._joinRoomScreen,
            this._disconnectOverlay,
            this._nameRegisterScreen,
            this._leaderboardScreen,
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
        if (canShow) {
            this._joystick?.refresh();
        } else {
            this._joystick?.reset();
        }
    }
}
