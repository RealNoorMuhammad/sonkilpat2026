/**
 * Draw a trading candlestick centered at (x, y).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size — total height in px
 * @param {'red'|'green'} color
 * @param {number} [angle=0] — rotation in radians
 */
export function drawTradingCandle(ctx, x, y, size, color, angle = 0) {
    const bodyH = size * 0.42;
    const bodyW = size * 0.3;
    const wickW = Math.max(2, size * 0.07);
    const wickTop = size * 0.28;
    const wickBot = size * 0.3;

    const fill = color === 'green' ? '#22c55e' : '#ef4444';
    const stroke = color === 'green' ? '#15803d' : '#b91c1c';

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Wick
    ctx.strokeStyle = fill;
    ctx.lineWidth = wickW;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(0, size * 0.5);
    ctx.stroke();

    // Body — green sits higher (bullish), red sits lower (bearish)
    const bodyY = color === 'green' ? -bodyH * 0.55 : -bodyH * 0.15;
    ctx.fillStyle = fill;
    ctx.fillRect(-bodyW / 2, bodyY, bodyW, bodyH);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(-bodyW / 2, bodyY, bodyW, bodyH);

    ctx.restore();
}
