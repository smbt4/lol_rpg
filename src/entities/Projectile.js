/**
 * Zielsuchendes Geschoss (Magieball des Spielers oder Schuss eines Irrlichts).
 * Position in Kachel-Koordinaten (Kachelmitte = x + 0.5), damit Größenänderungen
 * des Fensters keine Rolle spielen.
 */
export class Projectile {
    /**
     * @param {object} opts
     * @param {number} opts.x Start-X in Kacheln
     * @param {number} opts.y Start-Y in Kacheln
     * @param {() => {x:number, y:number}} opts.getTargetPos Liefert die aktuelle Zielposition
     * @param {() => boolean} opts.isTargetAlive Ob das Ziel noch existiert
     * @param {number} opts.speed Kacheln pro Sekunde
     * @param {number} opts.damage
     * @param {string} opts.color
     * @param {'player'|'monster'} opts.owner
     * @param {object} opts.target Das Ziel-Objekt (Monster oder Spieler)
     */
    constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.getTargetPos = opts.getTargetPos;
        this.isTargetAlive = opts.isTargetAlive;
        this.speed = opts.speed;
        this.damage = opts.damage;
        this.color = opts.color;
        this.owner = opts.owner;
        this.target = opts.target;

        this.lastTargetPos = this.getTargetPos();
        this.trail = [];
        this.age = 0;
        this.maxAge = 3;      // Sekunden, danach verpufft das Geschoss
        this.hit = false;     // Ziel erreicht → Schaden anwenden
        this.done = false;    // Kann entfernt werden
    }

    update(dt) {
        this.age += dt;
        if (this.age > this.maxAge) {
            this.done = true;
            return;
        }

        const targetAlive = this.isTargetAlive();
        if (targetAlive) {
            this.lastTargetPos = this.getTargetPos();
        }

        const dx = this.lastTargetPos.x - this.x;
        const dy = this.lastTargetPos.y - this.y;
        const dist = Math.hypot(dx, dy);
        const step = this.speed * dt;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();

        if (dist <= step || dist < 0.15) {
            this.x = this.lastTargetPos.x;
            this.y = this.lastTargetPos.y;
            this.hit = targetAlive;
            this.done = true;
            return;
        }

        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
    }

    draw(ctx, camX, camY, tileSize) {
        const radius = Math.max(3, tileSize * 0.16);

        // Schweif
        this.trail.forEach((p, i) => {
            ctx.globalAlpha = (i + 1) / (this.trail.length + 1) * 0.5;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(p.x * tileSize - camX, p.y * tileSize - camY, radius * (0.4 + i * 0.08), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        const sx = this.x * tileSize - camX;
        const sy = this.y * tileSize - camY;

        // Leuchten
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 2.2);
        glow.addColorStop(0, 'rgba(255,255,255,0.9)');
        glow.addColorStop(0.35, this.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
}
