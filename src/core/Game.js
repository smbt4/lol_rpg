import { Input } from './Input.js';
import { Map } from '../world/Map.js';
import { Camera } from '../world/Camera.js';
import { Sound } from './Sound.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { Projectile } from '../entities/Projectile.js';
import { FloatingText } from '../entities/FloatingText.js';
import { UI } from './UI.js';
import { constants } from './constants.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Systeme initialisieren
        this.input = new Input();
        this.map = new Map();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.sound = new Sound();
        this.ui = new UI();

        this.player = new Player(constants.player.startX, constants.player.startY);

        this.input.onInteraction = () => {
            this.sound.startMusic();
        };

        // 3. NEU: Dem Spieler Werte geben
        this.player.currentHP = 25;
        this.player.maxHP = 25
        this.player.currentEP = 1;
        this.player.maxEP = 50;
        this.player.level = 1;
        this.player.hitUntil = 0;

        this.lerpSpeed = 0.2;
        this.lastMoveTime = 0;
        this.moveCooldown = 200;

        // Monster, Geschosse und schwebende Texte
        this.monsters = [];
        this.projectiles = [];
        this.texts = [];
        this.now = 0;
        this.lastFrameTime = null;
        this.nextCastAt = 0;
        this.pendingRespawns = [];
        this.monsterTarget = this.calcMonsterCount();
        this.spawnInitialMonsters();

        // Einmalig das UI beim Start mit den echten Werten füttern
        this.ui.updateHP(this.player.currentHP, this.player.maxHP);
        this.ui.updateEP(this.player.currentEP, this.player.maxEP);

        this.input.onTap = () => {
            this.handleTap();
        };
    }

    handleResize(newWidth, newHeight) {
        if (!this.map || !this.camera) return;

        const gewuenschteKachelnBreite = newWidth > newHeight ? 30 : 10;
        const dynamischeTileSize = Math.ceil(newWidth / gewuenschteKachelnBreite);
        this.map.tileSize = dynamischeTileSize;
        this.tileSize = dynamischeTileSize;
        this.camera.width = newWidth;
        this.camera.height = newHeight;
        this.draw();
    }

    start() {
        const loop = (timestamp) => {
            this.update(timestamp);
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update(timestamp) {
        // Zeitdifferenz (begrenzt, damit nach Tab-Wechsel nichts "springt")
        const dt = this.lastFrameTime === null ? 0 : Math.min(timestamp - this.lastFrameTime, 50) / 1000;
        this.lastFrameTime = timestamp;
        this.now = timestamp;

        if (timestamp - this.lastMoveTime > this.moveCooldown) {
            let dx = 0;
            let dy = 0;

            if (this.input.isPressed('up')) dy = -1;
            if (this.input.isPressed('down')) dy = 1;
            if (this.input.isPressed('left')) dx = -1;
            if (this.input.isPressed('right')) dx = 1;

            if (dx !== 0 || dy !== 0) {

                if (dx === 1) this.player.facingDirection = 'right';
                if (dx === -1) this.player.facingDirection = 'left';
                if (dy === 1) this.player.facingDirection = 'down';
                if (dy === -1) this.player.facingDirection = 'up';

                const nextX = this.player.x + dx;
                const nextY = this.player.y + dy;

                if (this.map.isWalkable(nextX, nextY) && !this.getMonsterAt(nextX, nextY)) {
                    this.player.x = nextX;
                    this.player.y = nextY;
                    this.lastMoveTime = timestamp;
                    this.sound.playStep();
                }
            }
        }

        const targetPixelX = this.player.x * this.map.tileSize;
        const targetPixelY = this.player.y * this.map.tileSize;
        this.player.interpolate(targetPixelX, targetPixelY, this.lerpSpeed);

        const playerCenterX = this.player.visualX + this.map.tileSize / 2;
        const playerCenterY = this.player.visualY + this.map.tileSize / 2;
        this.camera.x = playerCenterX - this.camera.width / 2;
        this.camera.y = playerCenterY - this.camera.height / 2;

        this.updateMonsters(timestamp);
        this.updateProjectiles(dt);

        for (const text of this.texts) text.update(dt);
        this.texts = this.texts.filter(t => !t.done);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.map.draw(this.ctx, this.camera);
        const camX = Math.floor(this.camera.x);
        const camY = Math.floor(this.camera.y);
        const ts = this.map.tileSize;

        // Nur sichtbare Monster zeichnen
        const minX = camX / ts - 1;
        const minY = camY / ts - 1;
        const maxX = (camX + this.camera.width) / ts + 1;
        const maxY = (camY + this.camera.height) / ts + 1;
        for (const monster of this.monsters) {
            if (monster.visualX < minX || monster.visualX > maxX || monster.visualY < minY || monster.visualY > maxY) continue;
            monster.draw(this.ctx, camX, camY, ts, this.now);
        }

        // Spieler blinkt kurz, wenn er getroffen wurde
        if (this.now < this.player.hitUntil) this.ctx.globalAlpha = 0.5;
        this.player.draw(this.ctx, camX, camY, ts);
        this.ctx.globalAlpha = 1;

        for (const projectile of this.projectiles) projectile.draw(this.ctx, camX, camY, ts);
        for (const text of this.texts) text.draw(this.ctx, camX, camY, ts);
    }

    // =========================================================
    // ANGRIFF DES SPIELERS
    // =========================================================

    /** Tap / Klick / Taste: Magieball aufs nächste Monster, sonst normaler Schlag */
    handleTap() {
        const target = this.findNearestMonster(constants.magic.range);

        if (target) {
            this.castMagic(target);
        } else {
            this.sound.playHit();
            this.attack();
        }
    }

    castMagic(target) {
        if (this.now < this.nextCastAt) return;
        this.nextCastAt = this.now + constants.magic.cooldown;

        const m = constants.magic;
        const damage = m.minDamage + Math.floor(Math.random() * (m.maxDamage - m.minDamage + 1));
        const start = this.getPlayerCenter();

        this.projectiles.push(new Projectile({
            x: start.x,
            y: start.y,
            target,
            getTargetPos: () => ({ x: target.centerX, y: target.centerY }),
            isTargetAlive: () => !target.dead,
            speed: m.speed,
            damage,
            color: m.color,
            owner: 'player'
        }));
    }

    findNearestMonster(range) {
        let best = null;
        let bestDist = Infinity;
        for (const monster of this.monsters) {
            if (monster.dead) continue;
            const dist = Math.hypot(monster.x - this.player.x, monster.y - this.player.y);
            if (dist <= range && dist < bestDist) {
                best = monster;
                bestDist = dist;
            }
        }
        return best;
    }

    attack() {
        let targetX = this.player.x;
        let targetY = this.player.y;

        if (this.player.facingDirection === 'up') targetY--;
        if (this.player.facingDirection === 'down') targetY++;
        if (this.player.facingDirection === 'left') targetX--;
        if (this.player.facingDirection === 'right') targetX++;

        const target = this.map.getObjectAt(targetX, targetY);

        if (target && target.hp !== undefined) {
            target.hp--;

            if (target.hp <= 0) {
                this.map.removeObject(target);
            }
        }
    }

    // =========================================================
    // MONSTER
    // =========================================================

    calcMonsterCount() {
        const c = constants.monsters;
        const count = Math.round((this.map.width * this.map.height) / c.tilesPerMonster);
        return Math.max(c.minCount, Math.min(c.maxCount, count));
    }

    spawnInitialMonsters() {
        for (let i = 0; i < this.monsterTarget; i++) {
            this.spawnMonster(constants.monsters.safeRadius);
        }
    }

    pickMonsterType() {
        const types = Object.entries(constants.monsterTypes);
        const total = types.reduce((sum, [, t]) => sum + t.weight, 0);
        let roll = Math.random() * total;
        for (const [key, t] of types) {
            roll -= t.weight;
            if (roll < 0) return key;
        }
        return types[0][0];
    }

    /** Sucht eine freie Kachel mit Mindestabstand zum Spieler und setzt dort ein Monster hin */
    spawnMonster(minDistance) {
        for (let attempt = 0; attempt < 60; attempt++) {
            const x = 1 + Math.floor(Math.random() * (this.map.width - 2));
            const y = 1 + Math.floor(Math.random() * (this.map.height - 2));
            if (Math.hypot(x - this.player.x, y - this.player.y) < minDistance) continue;
            if (!this.isFree(x, y)) continue;

            const monster = new Monster(this.pickMonsterType(), x, y);
            // Wandern zeitlich versetzt starten
            monster.nextMoveAt = this.now + Math.random() * 2000;
            this.monsters.push(monster);
            return monster;
        }
        return null;
    }

    getMonsterAt(x, y) {
        return this.monsters.find(m => !m.dead && m.x === x && m.y === y) ?? null;
    }

    /** Begehbar und weder Spieler noch Monster stehen dort */
    isFree(x, y) {
        if (!this.map.isWalkable(x, y)) return false;
        if (this.player.x === x && this.player.y === y) return false;
        return !this.getMonsterAt(x, y);
    }

    updateMonsters(now) {
        for (const monster of this.monsters) {
            monster.update(now, this);
        }

        // Besiegte Monster nach einer Weile ersetzen (abseits vom Spieler)
        this.pendingRespawns = this.pendingRespawns.filter(time => {
            if (now < time) return true;
            if (this.monsters.length < this.monsterTarget) {
                this.spawnMonster(constants.monsters.safeRadius + 2);
            }
            return false;
        });
    }

    killMonster(monster) {
        this.monsters = this.monsters.filter(m => m !== monster);
        this.addText(monster.x + 0.5, monster.y, `+${monster.stats.ep} EP`, '#facc15', 1100);
        this.gainEP(monster.stats.ep);
        this.pendingRespawns.push(this.now + constants.monsters.respawnDelay);
    }

    spawnMonsterProjectile(monster) {
        const player = this.player;
        this.projectiles.push(new Projectile({
            x: monster.centerX,
            y: monster.centerY,
            target: player,
            getTargetPos: () => this.getPlayerCenter(),
            isTargetAlive: () => player.currentHP > 0,
            speed: monster.stats.projectileSpeed,
            damage: monster.stats.damage,
            color: monster.stats.projectileColor,
            owner: 'monster'
        }));
    }

    updateProjectiles(dt) {
        for (const projectile of this.projectiles) {
            projectile.update(dt);
            if (!projectile.hit) continue;

            if (projectile.owner === 'player') {
                const monster = projectile.target;
                if (monster.dead) continue;
                monster.takeDamage(projectile.damage, this.now);
                this.sound.playHit();
                this.addText(monster.x + 0.5, monster.y + 0.2, `-${projectile.damage}`, '#ffffff');
                if (monster.dead) this.killMonster(monster);
            } else {
                this.damagePlayer(projectile.damage);
            }
        }
        this.projectiles = this.projectiles.filter(p => !p.done);
    }

    // =========================================================
    // SPIELER-WERTE
    // =========================================================

    getPlayerCenter() {
        const ts = this.map.tileSize;
        return {
            x: this.player.visualX / ts + 0.5,
            y: this.player.visualY / ts + 0.5
        };
    }

    damagePlayer(amount) {
        const p = this.player;
        p.currentHP = Math.max(0, p.currentHP - amount);
        p.hitUntil = this.now + 200;

        const c = this.getPlayerCenter();
        this.addText(c.x, c.y - 0.3, `-${amount}`, '#f87171');

        this.ui.showHP();
        this.ui.updateHP(p.currentHP, p.maxHP);

        if (p.currentHP <= 0) this.playerDefeated();
    }

    /** Spieler wird am Startpunkt wiederbelebt, Monster verlieren das Interesse */
    playerDefeated() {
        const p = this.player;
        p.x = constants.player.startX;
        p.y = constants.player.startY;
        p.currentHP = p.maxHP;
        this.ui.updateHP(p.currentHP, p.maxHP);

        this.projectiles = this.projectiles.filter(pr => pr.owner === 'player');
        for (const monster of this.monsters) {
            monster.state = 'idle';
            // Monster, die den Startpunkt blockieren, wegschicken
            if (Math.hypot(monster.x - p.x, monster.y - p.y) < 2) {
                monster.dead = true;
                this.pendingRespawns.push(this.now + constants.monsters.respawnDelay);
            }
        }
        this.monsters = this.monsters.filter(m => !m.dead);

        this.addText(p.x + 0.5, p.y, 'Besiegt!', '#f87171', 1500);
    }

    gainEP(amount) {
        const p = this.player;
        p.currentEP += amount;

        while (p.currentEP >= p.maxEP) {
            p.currentEP -= p.maxEP;
            p.level++;
            p.maxEP = Math.round(p.maxEP * 1.5);
            p.maxHP += 5;
            p.currentHP = p.maxHP;
            this.ui.updateHP(p.currentHP, p.maxHP);
            this.addText(p.x + 0.5, p.y - 0.5, `Level ${p.level}!`, '#4ade80', 1500);
        }

        this.ui.showEP();
        this.ui.updateEP(p.currentEP, p.maxEP);
    }

    addText(x, y, text, color, duration) {
        this.texts.push(new FloatingText(x, y, text, color, duration));
    }
}
