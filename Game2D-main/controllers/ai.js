import { CONFIG } from '../configs/config.js';

/**
 * AIController — finite-state machine brain for the enemy fighter.
 *
 * AI States
 * 
 *  approach   — close the gap until preferred attack range is reached
 *  pressure   — in range; attacks and follows up on hits
 *  defensive  — opponent is attacking nearby; block or jump back
 *  retreat    — temporarily back away to reset spacing
 *  punish     — opponent just finished a whiffed attack; go in hard
 *
 * Difficulty levels control:
 *  • reactionDelay  — frames the AI waits before reacting to a threat
 *  • mistakeChance  — probability per frame to "forget" the optimal action
 *  • aggressionMult — scales attack frequency
 */
export default class AIController {
    /**
     * @param {import('./fighter.js').default} fighter     — the AI's fighter
     * @param {import('./fighter.js').default} opponent    — the player
     * @param {{ difficulty?: 'easy'|'normal'|'hard' }} [opts]
     */
    constructor(fighter, opponent, opts = {}) {
        this.fighter = fighter;
        this.opponent = opponent;

        // Will be set by setDifficulty()
        this.preferredRange = 90;
        this.blockProbability = 0.5;
        this.retreatProbability = 0.01;
        this.jumpProbability = 0.005;
        this.reactionDelay = 12;
        this.mistakeChance = 0.25;
        this.aggressionMult = 0.75;
        this.comboWindow = 12;
        this._difficultyLevel = 'easy';

        // Internal state
        this._aiState = 'approach';
        this._stateTimer = 0;      // frames in current AI state
        this._reactionTimer = 0;      // counts down before AI acts on a threat
        this._comboTimer = 0;      // frames left to attempt a combo follow-up
        this._retreatTimer = 0;      // frames left in retreat
        this._blockDuration = 20;
        this._walkSpeedMult = 0.55;

        // Track whether we landed the last attack
        this._prevOpponentHealth = opponent.health;

        this.setDifficulty(opts.difficulty ?? 'easy');
    }

    //  Difficulty 

    setDifficulty(level) {
        this._difficultyLevel = level;
        switch (level) {
            case 'easy':
                this.preferredRange = 60;
                this.blockProbability = 0.04;
                this.retreatProbability = 0.06;
                this.jumpProbability = 0.003;
                this.reactionDelay = 45;
                this.mistakeChance = 0.68;
                this.aggressionMult = 0.18;
                this.comboWindow = 0;
                this._blockDuration = 6;
                this._walkSpeedMult = 0.55;
                break;
            case 'normal':
                this.preferredRange = 90;
                this.blockProbability = 0.15;
                this.retreatProbability = 0.03;
                this.jumpProbability = 0.006;
                this.reactionDelay = 30;
                this.mistakeChance = 0.5;
                this.aggressionMult = 0.35;
                this.comboWindow = 4;
                this._blockDuration = 10;
                this._walkSpeedMult = 0.75;
                break;
            case 'hard':
                this.preferredRange = 100;
                this.blockProbability = 0.35;
                this.retreatProbability = 0.015;
                this.jumpProbability = 0.008;
                this.reactionDelay = 16;
                this.mistakeChance = 0.25;
                this.aggressionMult = 0.7;
                this.comboWindow = 12;
                this._blockDuration = 14;
                this._walkSpeedMult = 0.95;
                break;
        }
    }

    /**
     * Resets transient AI state for a new round.
     * Must be called whenever the opponent fighter is recreated.
     */
    reset() {
        this._aiState       = 'approach';
        this._stateTimer    = 0;
        this._reactionTimer = 0;
        this._comboTimer    = 0;
        this._retreatTimer  = 0;
        // Sync to current opponent HP so we don't fire a spurious combo on frame 1
        this._prevOpponentHealth = this.opponent.health;
    }

    //  Main update (called once per frame) 

    update() {
        const f = this.fighter;
        const p = this.opponent;

        // Dead or mid-animation — let physics play out
        if (f.state === 'ko') return;
        if (['attack_startup', 'attack_active', 'attack_recovery'].includes(f.state)) return;
        if (f.state === 'hitstun' && f.stunTimer > 0) return;
        if (f.state === 'jump_rise' || f.state === 'jump_fall') return;
        if (f.state === 'block' && f.aiBlockTimer > 0) return;

        // Tick internal timers
        this._stateTimer++;
        if (this._reactionTimer > 0) this._reactionTimer--;
        if (this._comboTimer > 0) this._comboTimer--;
        if (this._retreatTimer > 0) this._retreatTimer--;

        // Detect if we just landed a hit (opponent HP dropped)
        const currentOpponentHP = p.health;
        if (currentOpponentHP < this._prevOpponentHealth) {
            this._comboTimer = this.comboWindow;
        }
        this._prevOpponentHealth = currentOpponentHP;

        // Inject difficulty-based mistakes
        if (Math.random() < this.mistakeChance) return;

        const dx = p.x - f.x;
        const absDx = Math.abs(dx);

        // Panic mode disabled on easy — opponent stays passive even when low HP
        const panicking = this._difficultyLevel !== 'easy' && f.health / f.maxHealth < 0.3;

        //  Choose AI state 

        // Highest priority: opponent is attacking right next to us → defend (rare on easy)
        const opponentAttacking = ['attack_startup', 'attack_active'].includes(p.state);
        if (opponentAttacking && absDx < this.preferredRange + 20 && !panicking) {
            this._transitionTo('defensive');
        }
        // Opponent whiffed — almost never punish on easy
        else if (p.state === 'attack_recovery' && absDx < this.preferredRange + 30) {
            const punishRoll =
                this._difficultyLevel === 'easy' ? 0.05 :
                this._difficultyLevel === 'normal' ? 0.25 : 0.7;
            if (Math.random() < punishRoll) {
                this._transitionTo('punish');
            } else {
                this._transitionTo('approach');
            }
        }
        // Combo follow-ups disabled on easy
        else if (this._comboTimer > 0 && absDx <= this.preferredRange && this._difficultyLevel !== 'easy') {
            this._transitionTo('pressure');
        }
        // In range → pressure
        else if (absDx <= this.preferredRange) {
            this._transitionTo('pressure');
        }
        // Too far → approach (or maybe jump in)
        else {
            if (!panicking && this._retreatTimer > 0) {
                this._transitionTo('retreat');
            } else {
                this._transitionTo('approach');
            }
        }

        //  Execute current AI state 

        switch (this._aiState) {
            case 'approach': this._doApproach(f, p, dx, absDx); break;
            case 'pressure': this._doPressure(f, p, absDx); break;
            case 'defensive': this._doDefensive(f, p); break;
            case 'retreat': this._doRetreat(f, p, dx); break;
            case 'punish': this._doPunish(f, p); break;
        }

        // Always face the opponent
        if (f.state !== 'block') {
            f.facingRight = dx > 0;
        }
    }

    //  State transitions 

    _transitionTo(newState) {
        if (this._aiState !== newState) {
            this._aiState = newState;
            this._stateTimer = 0;
        }
    }

    //  AI state behaviours 

    _doApproach(f, p, dx, absDx) {
        const speed = CONFIG.walkSpeed * (this._walkSpeedMult ?? 1);
        // Occasionally jump forward to vary approach
        if (Math.random() < this.jumpProbability && f.onGround) {
            f.vx = dx > 0 ? speed : -speed;
            f.enterState('jump_rise');
            return;
        }
        // Walk toward opponent
        if (dx > 0) {
            f.facingRight = true;
            f.vx = speed;
        } else {
            f.facingRight = false;
            f.vx = -speed;
        }
        f.enterState('walk');
    }

    _doPressure(f, p, absDx) {
        if (f.attackCooldown > 0) {
            // Stand still while cooling down
            f.enterState('idle');
            f.vx = 0;
            return;
        }

        // Hesitate often before attacking
        const hesitateChance = this._difficultyLevel === 'easy' ? 0.62 :
            this._difficultyLevel === 'normal' ? 0.4 : 0.15;
        if (Math.random() < hesitateChance) {
            f.enterState('idle');
            f.vx = 0;
            return;
        }

        // Select attack based on situation
        const attack = this._choosePressureAttack(f, absDx);
        if (attack) {
            f.startAttack(attack);
        } else {
            f.enterState('idle');
            f.vx = 0;
        }
    }

    _doDefensive(f, p) {
        if (this._reactionTimer > 0) return; // haven't reacted yet

        // Randomly decide: block or jump back
        if (Math.random() < this.blockProbability && f.onGround) {
            f.enterState('block');
            f.aiBlockTimer = this._blockDuration;
        } else {
            // Jump back
            const away = f.facingRight ? -1 : 1;
            f.vx = away * CONFIG.walkSpeed;
            if (f.onGround) f.enterState('jump_rise');
            this._retreatTimer = 30;
        }
        // Set reaction delay for next defensive action
        this._reactionTimer = this.reactionDelay;
    }

    _doRetreat(f, p, dx) {
        if (this._retreatTimer <= 0) return;
        const speed = CONFIG.walkSpeed * (this._walkSpeedMult ?? 1);
        f.facingRight = dx > 0;
        f.vx = dx > 0 ? -speed : speed;
        f.enterState('walk');
    }

    _doPunish(f, p) {
        if (f.attackCooldown > 0) {
            f.enterState('idle');
            return;
        }
        // Easy mode only uses weak attacks for punishes
        const punishMove = this._difficultyLevel === 'easy'
            ? this._aiAttacks(f).find(a => a.name === 'lightPunch')
            : this._aiAttacks(f).find(a => a.name === 'heavyPunch');
        if (punishMove) f.startAttack(punishMove.name);
    }

    //  Attack selection 

    /** Returns attacks the AI is allowed to use. */
    _aiAttacks(f) {
        return f.attacks.filter(a => a.allowAI !== false);
    }

    /**
     * Picks a pressure attack.
     * Heavy punch used as a punish/mix-up at ~30% chance;
     * sweep kick when opponent is standing still (not jumping).
     */
    _choosePressureAttack(f, absDx) {
        const viable = this._aiAttacks(f);
        if (viable.length === 0) return null;

        // Easy AI only throws light punches — no heavy or sweep mix-ups
        if (this._difficultyLevel === 'easy') {
            return viable.find(a => a.name === 'lightPunch')?.name ?? viable[0].name;
        }

        const isOpponentGrounded = this.opponent.onGround;
        const roll = Math.random() * this.aggressionMult;

        const heavy = viable.find(a => a.name === 'heavyPunch');
        const heavyChance = this._difficultyLevel === 'normal' ? 0.06 : 0.18;
        if (heavy && roll < heavyChance && isOpponentGrounded) return heavy.name;

        const sweep = viable.find(a => a.name === 'sweepKick');
        const sweepChance = this._difficultyLevel === 'normal' ? 0.1 : 0.25;
        if (sweep && roll < sweepChance && isOpponentGrounded) return sweep.name;

        const light = viable.find(a => a.name === 'lightPunch');
        return light?.name ?? viable[0].name;
    }
}