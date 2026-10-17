import { constants } from '../core/constants.js';

// 8x8-Pixel-Sprites im selben Stil wie der Spieler
const SPRITES = {
    slime: `
        <rect x="2" y="3" width="4" height="1" fill="#4ade80"/>
        <rect x="1" y="4" width="6" height="3" fill="#22c55e"/>
        <rect x="0" y="6" width="8" height="1" fill="#16a34a"/>
        <rect x="2" y="4" width="1" height="1" fill="#bbf7d0"/>
        <rect x="2" y="5" width="1" height="1" fill="#000"/>
        <rect x="5" y="5" width="1" height="1" fill="#000"/>`,
    goblin: `
        <rect x="2" y="1" width="4" height="3" fill="#65a30d"/>
        <rect x="1" y="2" width="1" height="1" fill="#65a30d"/>
        <rect x="6" y="2" width="1" height="1" fill="#65a30d"/>
        <rect x="3" y="2" width="1" height="1" fill="#dc2626"/>
        <rect x="5" y="2" width="1" height="1" fill="#dc2626"/>
        <rect x="2" y="4" width="4" height="2" fill="#78350f"/>
        <rect x="1" y="4" width="1" height="2" fill="#65a30d"/>
        <rect x="6" y="4" width="1" height="2" fill="#65a30d"/>
        <rect x="7" y="2" width="1" height="4" fill="#a16207"/>
        <rect x="2" y="6" width="1" height="2" fill="#3f3f46"/>
        <rect x="5" y="6" width="1" height="2" fill="#3f3f46"/>`,
    bat: `
        <rect x="0" y="2" width="3" height="1" fill="#5b21b6"/>
        <rect x="1" y="3" width="2" height="1" fill="#5b21b6"/>
        <rect x="5" y="2" width="3" height="1" fill="#5b21b6"/>
        <rect x="5" y="3" width="2" height="1" fill="#5b21b6"/>
        <rect x="3" y="2" width="2" height="3" fill="#7c3aed"/>
        <rect x="3" y="1" width="1" height="1" fill="#7c3aed"/>
        <rect x="4" y="1" width="1" height="1" fill="#7c3aed"/>
        <rect x="3" y="3" width="1" height="1" fill="#facc15"/>
        <rect x="4" y="3" width="1" height="1" fill="#facc15"/>`,
    wisp: `
        <rect x="2" y="2" width="4" height="4" fill="#38bdf8"/>
        <rect x="3" y="1" width="2" height="1" fill="#38bdf8"/>
        <rect x="1" y="3" width="1" height="2" fill="#38bdf8"/>
        <rect x="6" y="3" width="1" height="2" fill="#38bdf8"/>
        <rect x="3" y="6" width="2" height="1" fill="#7dd3fc"/>
        <rect x="3" y="3" width="2" height="2" fill="#e0f2fe"/>
        <rect x="3" y="3" width="1" height="1" fill="#0c4a6e"/>
        <rect x="4" y="3" width="1" height="1" fill="#0c4a6e"/>`
};

// Bilder werden einmal pro Typ geladen und von allen Monstern geteilt
const images = {};
function getImage(type) {
    if (!images[type]) {
        const img = new Image();
        img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="40" height="40" shape-rendering="crispEdges">${SPRITES[type]}</svg>`
        );
        images[type] = img;
    }
    return images[type];
}

/**
 * Ein Monster, das frei umherwandert und den Spieler verfolgt/angreift,
 * sobald er in die Nähe kommt.
 * Position (x, y) in Kacheln; visualX/visualY ebenfalls in Kacheln (für flüssige Bewegung).
 */
export class Monster {
    constructor(type, x, y) {
        const stats = constants.monsterTypes[type];

        this.type = type;
        this.stats = stats;
        this.name = stats.name;

        this.x = x;
        this.y = y;
        this.homeX = x;
        this.homeY = y;
        this.visualX = x;
        this.visualY = y;

        this.maxHP = stats.hp;
        this.hp = stats.hp;

        this.state = 'idle';          // 'idle' = umherwandern, 'chase' = Spieler verfolgen
        this.nextMoveAt = 0;
        this.nextAttackAt = 0;
        this.hitUntil = 0;            // Treffer-Effekt
        this.attackAnimUntil = 0;     // kleiner Ausfallschritt beim Angriff
        this.attackDirX = 0;
        this.attackDirY = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.dead = false;

        this.image = getImage(type);
    }

    get centerX() { return this.visualX + 0.5; }
    get centerY() { return this.visualY + 0.5; }

    /** Wird vom Spieler angegriffen → wird sofort aggressiv */
    takeDamage(amount, now) {
        this.hp -= amount;
        this.hitUntil = now + 150;
        this.state = 'chase';
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
    }

    /**
     * @param {number} now Zeitstempel in ms
     * @param {object} world Game-Instanz (isFree, damagePlayer, spawnMonsterProjectile, addText, player)
     */
    update(now, world) {
        // Flüssige Darstellung
        this.visualX += (this.x - this.visualX) * 0.2;
        this.visualY += (this.y - this.visualY) * 0.2;

        if (this.dead) return;

        const player = world.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const s = this.stats;

        // Zustandswechsel
        if (this.state === 'idle' && dist <= s.aggroRange) {
            this.state = 'chase';
            world.addText(this.x + 0.5, this.y, '!', '#facc15', 600);
            // kurze Reaktionszeit, bevor es losgeht
            this.nextMoveAt = Math.max(this.nextMoveAt, now + 250);
        } else if (this.state === 'chase' && dist > s.aggroRange * constants.monsters.loseAggroFactor) {
            this.state = 'idle';
            this.homeX = this.x;
            this.homeY = this.y;
        }

        if (this.state === 'chase') {
            this.updateChase(now, world, dx, dy, dist);
        } else {
            this.updateWander(now, world);
        }
    }

    updateChase(now, world, dx, dy, dist) {
        const s = this.stats;
        const adjacent = Math.abs(dx) + Math.abs(dy) === 1;

        if (s.attack === 'melee' && adjacent) {
            if (now >= this.nextAttackAt) {
                this.nextAttackAt = now + s.attackCooldown;
                this.attackAnimUntil = now + 150;
                this.attackDirX = dx;
                this.attackDirY = dy;
                world.damagePlayer(s.damage, this);
            }
            return;
        }

        if (s.attack === 'ranged' && dist <= s.attackRange) {
            if (now >= this.nextAttackAt) {
                this.nextAttackAt = now + s.attackCooldown;
                world.spawnMonsterProjectile(this);
            }
            return;
        }

        if (now >= this.nextMoveAt) {
            this.nextMoveAt = now + s.moveDelay;
            this.stepToward(world, dx, dy);
        }
    }

    updateWander(now, world) {
        if (now < this.nextMoveAt) return;
        this.nextMoveAt = now + 800 + Math.random() * 1700;

        // Manchmal einfach stehen bleiben
        if (Math.random() < 0.3) return;

        const leash = constants.monsters.leashRange;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const [mx, my] = dirs[Math.floor(Math.random() * dirs.length)];
        const nx = this.x + mx;
        const ny = this.y + my;

        if (Math.abs(nx - this.homeX) > leash || Math.abs(ny - this.homeY) > leash) return;
        if (world.isFree(nx, ny)) {
            this.x = nx;
            this.y = ny;
        }
    }

    /** Einfache Verfolgung: zuerst entlang der längeren Achse, sonst ausweichen */
    stepToward(world, dx, dy) {
        const sx = Math.sign(dx);
        const sy = Math.sign(dy);
        const candidates = Math.abs(dx) >= Math.abs(dy)
            ? [[sx, 0], [0, sy]]
            : [[0, sy], [sx, 0]];

        // Seitliche Ausweichschritte, falls der direkte Weg blockiert ist
        if (sx === 0) candidates.push([1, 0], [-1, 0]);
        if (sy === 0) candidates.push([0, 1], [0, -1]);

        for (const [mx, my] of candidates) {
            if (mx === 0 && my === 0) continue;
            const nx = this.x + mx;
            const ny = this.y + my;
            if (world.isFree(nx, ny)) {
                this.x = nx;
                this.y = ny;
                return;
            }
        }
    }

    draw(ctx, camX, camY, tileSize, now) {
        let offX = 0;
        let offY = 0;

        // Ausfallschritt beim Angriff
        if (now < this.attackAnimUntil) {
            offX = this.attackDirX * tileSize * 0.25;
            offY = this.attackDirY * tileSize * 0.25;
        }

        // Treffer-Wackeln
        const isHit = now < this.hitUntil;
        if (isHit) offX += (Math.random() - 0.5) * tileSize * 0.15;

        // Leichtes Schweben/Hüpfen
        const bobSpeed = this.type === 'bat' ? 0.012 : 0.005;
        const bob = Math.sin(now * bobSpeed + this.bobOffset) * tileSize * 0.04;

        const screenX = Math.floor(this.visualX * tileSize) - camX + offX;
        const screenY = Math.floor(this.visualY * tileSize) - camY + offY + bob;

        if (isHit) ctx.globalAlpha = 0.5;

        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        } else {
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(screenX + 6, screenY + 6, tileSize - 12, tileSize - 12);
        }
        ctx.globalAlpha = 1;

        // Lebensbalken, sobald das Monster verletzt ist
        if (this.hp < this.maxHP) {
            const barW = tileSize * 0.8;
            const barH = Math.max(3, Math.round(tileSize * 0.08));
            const bx = screenX + (tileSize - barW) / 2;
            const by = screenY - barH - 1;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(bx, by, barW * (this.hp / this.maxHP), barH);
        }
    }
}
