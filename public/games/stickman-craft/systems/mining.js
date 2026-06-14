import { CONFIG } from '../configs/config.js';
import { BLOCK, BLOCK_DEFS, getHardness, HOTBAR_BLOCKS } from '../world/blockTypes.js';

export class MiningSystem {
    constructor() {
        this.target = null;
        this.progress = 0;
        this._lastTargetKey = null;
    }

    reset() {
        this.target = null;
        this.progress = 0;
        this._lastTargetKey = null;
    }

    /** Returns { broken: bool, blockId: number } if a block was broken. */
    update(input, player, world, camera, inventory) {
        const ts = CONFIG.tileSize;
        const reach = CONFIG.reachTiles * ts;

        let wx, wy;
        if (input.mine() && !input.place()) {
            if (input._touchMine && !input.mouseDown) {
                wx = player.facingRight ? player.centerX + ts : player.centerX - ts;
                wy = player.centerY;
            } else {
                const worldPos = camera.screenToWorld(input.mouseX, input.mouseY);
                wx = worldPos.x;
                wy = worldPos.y;
            }
        } else {
            this.reset();
            return null;
        }

        const tx = Math.floor(wx / ts);
        const ty = Math.floor(wy / ts);
        const dist = Math.hypot(tx * ts + ts / 2 - player.centerX, ty * ts + ts / 2 - player.centerY);

        if (dist > reach) {
            this.reset();
            return null;
        }

        const blockId = world.getTile(tx, ty);
        if (blockId === BLOCK.AIR) {
            this.reset();
            return null;
        }

        const key = `${tx},${ty}`;
        if (key !== this._lastTargetKey) {
            this._lastTargetKey = key;
            this.progress = 0;
        }

        this.target = { tx, ty, blockId };
        const hardness = getHardness(blockId);
        this.progress += 0.02 / hardness;

        if (this.progress >= 1) {
            world.setTile(tx, ty, BLOCK.AIR);
            inventory.add(blockId, 1);
            const result = { broken: true, blockId, tx, ty };
            this.reset();
            return result;
        }

        return null;
    }

    tryPlace(input, player, world, camera, inventory, selectedBlock) {
        if (!input.place()) return false;

        const ts = CONFIG.tileSize;
        const reach = CONFIG.placeReach * ts;
        const worldPos = camera.screenToWorld(input.mouseX, input.mouseY);
        const tx = Math.floor(worldPos.x / ts);
        const ty = Math.floor(worldPos.y / ts);
        const dist = Math.hypot(tx * ts + ts / 2 - player.centerX, ty * ts + ts / 2 - player.centerY);

        if (dist > reach) return false;
        if (world.getTile(tx, ty) !== BLOCK.AIR) return false;
        if (!inventory.has(selectedBlock)) return false;

        // Don't place inside player
        const px1 = Math.floor(player.x / ts);
        const px2 = Math.floor((player.x + player.width) / ts);
        const py1 = Math.floor(player.y / ts);
        const py2 = Math.floor((player.y + player.height) / ts);
        if (tx >= px1 && tx <= px2 && ty >= py1 && ty <= py2) return false;

        // Must be adjacent to a solid block
        const neighbors = [
            [tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1],
        ];
        const hasNeighbor = neighbors.some(([nx, ny]) => world.isSolid(nx, ny));
        if (!hasNeighbor) return false;

        world.setTile(tx, ty, selectedBlock);
        inventory.remove(selectedBlock, 1);
        return true;
    }
}

export class Inventory {
    constructor() {
        this.counts = {};
        for (const id of HOTBAR_BLOCKS) {
            this.counts[id] = id === BLOCK.DIRT ? 8 : 0;
        }
        this.selectedSlot = 0;
    }

    add(blockId, amount) {
        if (this.counts[blockId] === undefined) return;
        this.counts[blockId] += amount;
    }

    remove(blockId, amount) {
        if ((this.counts[blockId] || 0) < amount) return false;
        this.counts[blockId] -= amount;
        return true;
    }

    has(blockId) {
        return (this.counts[blockId] || 0) > 0;
    }

    getSelectedBlock() {
        return HOTBAR_BLOCKS[this.selectedSlot];
    }

    selectSlot(slot) {
        if (slot >= 0 && slot < HOTBAR_BLOCKS.length) {
            this.selectedSlot = slot;
        }
    }
}

export function spawnParticles(particles, tx, ty, blockId) {
    const def = BLOCK_DEFS[blockId];
    const ts = CONFIG.tileSize;
    const cx = tx * ts + ts / 2;
    const cy = ty * ts + ts / 2;
    const color = def?.top || '#888';

    for (let i = 0; i < 6; i++) {
        particles.push({
            x: cx + (Math.random() - 0.5) * ts,
            y: cy + (Math.random() - 0.5) * ts,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 4 - 1,
            size: 2 + Math.random() * 3,
            color,
            life: 30 + Math.random() * 20,
            maxLife: 50,
        });
    }
}

export function updateParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}
