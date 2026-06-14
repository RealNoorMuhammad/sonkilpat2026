import { CONFIG } from '../configs/config.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    follow(targetX, targetY, worldWidthPx, worldHeightPx) {
        const viewW = CONFIG.canvasWidth;
        const viewH = CONFIG.canvasHeight;

        const idealX = targetX - viewW / 2;
        const idealY = targetY - viewH / 2;

        this.x += (idealX - this.x) * 0.12;
        this.y += (idealY - this.y) * 0.12;

        this.x = Math.max(0, Math.min(worldWidthPx - viewW, this.x));
        this.y = Math.max(0, Math.min(worldHeightPx - viewH, this.y));
    }

    worldToScreen(wx, wy) {
        return { x: wx - this.x, y: wy - this.y };
    }

    screenToWorld(sx, sy) {
        return { x: sx + this.x, y: sy + this.y };
    }
}
