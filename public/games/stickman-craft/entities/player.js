import { CONFIG } from '../configs/config.js';

export class Player {
    constructor(spawnX, spawnY) {
        this.x = spawnX;
        this.y = spawnY;
        this.vx = 0;
        this.vy = 0;
        this.width = CONFIG.playerWidth;
        this.height = CONFIG.playerHeight;
        this.onGround = false;
        this.facingRight = true;
        this.walkPhase = 0;
        this.mining = false;
        this.mineSwing = 0;
        this._jumpHeld = false;
        this.jumpedThisFrame = false;
    }

    get centerX() {
        return this.x + this.width / 2;
    }

    get centerY() {
        return this.y + this.height / 2;
    }

    get feetX() {
        return this.centerX;
    }

    get feetY() {
        return this.y + this.height;
    }

    update(input, world) {
        this.jumpedThisFrame = false;
        let move = 0;
        if (input.left()) move -= 1;
        if (input.right()) move += 1;

        this.vx = move * CONFIG.walkSpeed;
        if (move !== 0) {
            this.facingRight = move > 0;
            this.walkPhase += 0.18;
        }

        if (input.jumpPressed()) {
            if (this.onGround && !this._jumpHeld) {
                this.vy = CONFIG.jumpVelocity;
                this.onGround = false;
                this.jumpedThisFrame = true;
            }
            this._jumpHeld = true;
        } else {
            this._jumpHeld = false;
        }

        this.vy = Math.min(CONFIG.maxFallSpeed, this.vy + CONFIG.gravity);

        const result = world.resolveCollision(
            this.x, this.y, this.width, this.height, this.vx, this.vy
        );
        this.x = result.x;
        this.y = result.y;
        this.onGround = result.onGround;
        if (result.onGround && this.vy > 0) this.vy = 0;

        this.mining = input.mine();
        if (this.mining) {
            this.mineSwing += 0.25;
        } else {
            this.mineSwing *= 0.8;
        }
    }

    draw(ctx, camX, camY) {
        const sx = this.x - camX;
        const sy = this.y - camY;
        const cx = sx + this.width / 2;
        const headY = sy + 6;
        const bodyTop = sy + 12;
        const bodyBot = sy + 22;
        const dir = this.facingRight ? 1 : -1;

        const legSwing = Math.sin(this.walkPhase) * 8;
        const armSwing = Math.sin(this.walkPhase) * 6;
        const mineAngle = this.mining ? Math.sin(this.mineSwing) * 0.8 : 0;

        ctx.save();
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Head
        ctx.beginPath();
        ctx.arc(cx, headY, 5, 0, Math.PI * 2);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(cx, bodyTop);
        ctx.lineTo(cx, bodyBot);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(cx, bodyBot);
        ctx.lineTo(cx - legSwing * dir * 0.5, sy + this.height);
        ctx.moveTo(cx, bodyBot);
        ctx.lineTo(cx + legSwing * dir * 0.5, sy + this.height);
        ctx.stroke();

        // Arms
        const armLen = 10;
        const leftAngle = (-0.4 + armSwing * 0.04 - mineAngle) * dir;
        const rightAngle = (0.5 - armSwing * 0.04 + mineAngle * 1.5) * dir;

        ctx.beginPath();
        ctx.moveTo(cx, bodyTop + 2);
        ctx.lineTo(cx + Math.cos(leftAngle) * armLen, bodyTop + 2 + Math.sin(leftAngle) * armLen);
        ctx.moveTo(cx, bodyTop + 2);
        ctx.lineTo(cx + Math.cos(rightAngle) * armLen, bodyTop + 2 + Math.sin(rightAngle) * armLen);
        ctx.stroke();

        ctx.restore();
    }
}
