/**
 * Kurz aufsteigender Text (Schadenszahlen, "+5 EP", "!" usw.).
 * Position in Kachel-Koordinaten.
 */
export class FloatingText {
    constructor(x, y, text, color = '#fff', duration = 900) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.duration = duration;
        this.age = 0;
        this.done = false;
    }

    update(dt) {
        this.age += dt * 1000;
        this.y -= dt * 0.8;
        if (this.age >= this.duration) this.done = true;
    }

    draw(ctx, camX, camY, tileSize) {
        const alpha = 1 - this.age / this.duration;
        const fontSize = Math.max(12, Math.round(tileSize * 0.4));

        ctx.globalAlpha = Math.max(0, alpha);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = this.color;

        const sx = this.x * tileSize - camX;
        const sy = this.y * tileSize - camY;
        ctx.strokeText(this.text, sx, sy);
        ctx.fillText(this.text, sx, sy);
        ctx.globalAlpha = 1;
    }
}
