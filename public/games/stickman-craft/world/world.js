import { CONFIG } from '../configs/config.js';
import { BLOCK, isSolid } from './blockTypes.js';

export class World {
    constructor() {
        this.width = CONFIG.worldWidth;
        this.height = CONFIG.worldHeight;
        this.tiles = new Uint8Array(this.width * this.height);
        this.generate();
    }

    _idx(x, y) {
        return y * this.width + x;
    }

    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getTile(x, y) {
        if (!this.inBounds(x, y)) return BLOCK.AIR;
        return this.tiles[this._idx(x, y)];
    }

    setTile(x, y, id) {
        if (!this.inBounds(x, y)) return false;
        this.tiles[this._idx(x, y)] = id;
        return true;
    }

    isSolid(x, y) {
        return isSolid(this.getTile(x, y));
    }

    /** Surface height at column x (lowest air above solid). */
    surfaceY(x) {
        for (let y = 0; y < this.height; y++) {
            if (this.isSolid(x, y)) return y;
        }
        return this.height - 1;
    }

    generate() {
        const heights = [];
        for (let x = 0; x < this.width; x++) {
            const n =
                Math.sin(x * 0.08) * 3 +
                Math.sin(x * 0.23 + 1.7) * 2 +
                Math.sin(x * 0.05 + 0.4) * 4;
            const base = Math.floor(this.height * 0.55);
            heights[x] = Math.max(8, Math.min(this.height - 6, base + Math.round(n)));
        }

        for (let x = 0; x < this.width; x++) {
            const surface = heights[x];
            for (let y = 0; y < this.height; y++) {
                if (y < surface) {
                    this.setTile(x, y, BLOCK.AIR);
                } else if (y === surface) {
                    this.setTile(x, y, BLOCK.GRASS);
                } else if (y < surface + 4) {
                    this.setTile(x, y, BLOCK.DIRT);
                } else {
                    this.setTile(x, y, BLOCK.STONE);
                }
            }
        }

        // Trees
        for (let x = 4; x < this.width - 4; x++) {
            if (Math.random() > 0.94) {
                const surface = heights[x];
                const trunkH = 3 + Math.floor(Math.random() * 3);
                for (let t = 1; t <= trunkH; t++) {
                    const ty = surface - t;
                    if (ty >= 0) this.setTile(x, ty, BLOCK.WOOD);
                }
                const top = surface - trunkH;
                for (let lx = -2; lx <= 2; lx++) {
                    for (let ly = -2; ly <= 1; ly++) {
                        if (Math.abs(lx) + Math.abs(ly) > 3) continue;
                        if (lx === 0 && ly >= 0) continue;
                        const tx = x + lx;
                        const ty = top + ly;
                        if (this.getTile(tx, ty) === BLOCK.AIR) {
                            this.setTile(tx, ty, BLOCK.LEAVES);
                        }
                    }
                }
            }
        }
    }

    /** AABB vs tiles — returns adjusted position. */
    resolveCollision(x, y, w, h, vx, vy) {
        let nx = x + vx;
        let ny = y + vy;
        let onGround = false;

        const tile = CONFIG.tileSize;

        // Horizontal
        if (vx !== 0) {
            const left = Math.floor(nx / tile);
            const right = Math.floor((nx + w - 0.01) / tile);
            const top = Math.floor(y / tile);
            const bottom = Math.floor((y + h - 0.01) / tile);

            if (vx > 0) {
                for (let ty = top; ty <= bottom; ty++) {
                    if (this.isSolid(right, ty)) {
                        nx = right * tile - w;
                        break;
                    }
                }
            } else {
                for (let ty = top; ty <= bottom; ty++) {
                    if (this.isSolid(left, ty)) {
                        nx = (left + 1) * tile;
                        break;
                    }
                }
            }
        }

        // Vertical
        if (vy !== 0) {
            const left = Math.floor(nx / tile);
            const right = Math.floor((nx + w - 0.01) / tile);
            const top = Math.floor(ny / tile);
            const bottom = Math.floor((ny + h - 0.01) / tile);

            if (vy > 0) {
                for (let tx = left; tx <= right; tx++) {
                    if (this.isSolid(tx, bottom)) {
                        ny = bottom * tile - h;
                        onGround = true;
                        break;
                    }
                }
            } else {
                for (let tx = left; tx <= right; tx++) {
                    if (this.isSolid(tx, top)) {
                        ny = (top + 1) * tile;
                        break;
                    }
                }
            }
        }

        // Ground check when not moving vertically
        if (vy === 0) {
            const left = Math.floor(nx / tile);
            const right = Math.floor((nx + w - 0.01) / tile);
            const bottom = Math.floor((ny + h + 0.5) / tile);
            for (let tx = left; tx <= right; tx++) {
                if (this.isSolid(tx, bottom)) {
                    onGround = true;
                    break;
                }
            }
        }

        return { x: nx, y: ny, onGround };
    }
}
