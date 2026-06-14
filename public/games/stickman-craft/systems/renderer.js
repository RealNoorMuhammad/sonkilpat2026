import { CONFIG } from '../configs/config.js';
import { BLOCK, BLOCK_DEFS } from '../world/blockTypes.js';

export class Renderer {
    draw(ctx, world, camera, player, mining, particles) {
        this._drawSky(ctx);
        this._drawClouds(ctx, camera);

        const ts = CONFIG.tileSize;
        const startCol = Math.max(0, Math.floor(camera.x / ts));
        const endCol = Math.min(world.width, Math.ceil((camera.x + CONFIG.canvasWidth) / ts));
        const startRow = Math.max(0, Math.floor(camera.y / ts));
        const endRow = Math.min(world.height, Math.ceil((camera.y + CONFIG.canvasHeight) / ts));

        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const id = world.getTile(x, y);
                if (id === BLOCK.AIR) continue;
                this._drawBlock(ctx, x * ts - camera.x, y * ts - camera.y, id);
            }
        }

        player.draw(ctx, camera.x, camera.y);

        if (mining.target && mining.progress > 0) {
            this._drawBreakOverlay(ctx, mining, camera);
        }

        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size);
            ctx.globalAlpha = 1;
        }
    }

    _drawSky(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.canvasHeight);
        grad.addColorStop(0, CONFIG.skyTop);
        grad.addColorStop(1, CONFIG.skyBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    }

    _drawClouds(ctx, camera) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        const clouds = [
            { x: 120, y: 60, w: 70, h: 22 },
            { x: 380, y: 40, w: 90, h: 26 },
            { x: 620, y: 75, w: 60, h: 20 },
            { x: 880, y: 50, w: 80, h: 24 },
        ];
        for (const c of clouds) {
            const px = ((c.x - camera.x * 0.3) % (CONFIG.canvasWidth + 200)) - 100;
            ctx.beginPath();
            ctx.ellipse(px, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawBlock(ctx, x, y, id) {
        const def = BLOCK_DEFS[id];
        if (!def) return;
        const ts = CONFIG.tileSize;

        // Side / body
        ctx.fillStyle = def.side;
        ctx.fillRect(x, y, ts, ts);

        // Top face (grass-style split for grass block)
        if (id === BLOCK.GRASS) {
            ctx.fillStyle = def.top;
            ctx.fillRect(x, y, ts, ts * 0.35);
            ctx.fillStyle = def.side;
            ctx.fillRect(x, y + ts * 0.35, ts, ts * 0.65);
        } else {
            ctx.fillStyle = def.top;
            ctx.fillRect(x, y, ts, ts * 0.4);
        }

        // Highlight + shadow for pseudo-3D
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x, y, ts, 1);
        ctx.fillRect(x, y, 1, ts);
        ctx.fillStyle = def.shadow;
        ctx.fillRect(x, y + ts - 1, ts, 1);
        ctx.fillRect(x + ts - 1, y, 1, ts);
    }

    _drawBreakOverlay(ctx, mining, camera) {
        const ts = CONFIG.tileSize;
        const x = mining.target.tx * ts - camera.x;
        const y = mining.target.ty * ts - camera.y;
        const crack = mining.progress;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5 + crack * 0.5;

        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + ts * crack, y + ts * 0.5);
        ctx.lineTo(x + ts * 0.3, y + ts * crack);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + ts - 2, y + ts - 2);
        ctx.lineTo(x + ts * (1 - crack), y + ts * 0.6);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }
}
