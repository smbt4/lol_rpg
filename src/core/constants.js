export const constants = {
    player: {
        startX: 15,
        startY: 15
    },

    // Magieball des Spielers (Tap / Klick / Leertaste)
    magic: {
        range: 7,          // Reichweite in Kacheln für die automatische Zielsuche
        cooldown: 350,     // ms zwischen zwei Schüssen
        speed: 9,          // Kacheln pro Sekunde
        minDamage: 2,
        maxDamage: 3,
        color: '#a855f7'
    },

    // Allgemeine Monster-Einstellungen
    monsters: {
        tilesPerMonster: 120,   // Kartenfläche pro Monster (bestimmt die Anzahl)
        minCount: 4,
        maxCount: 40,
        safeRadius: 8,          // So nah am Spieler spawnt nie ein Monster
        respawnDelay: 8000,     // ms bis ein besiegtes Monster ersetzt wird
        leashRange: 4,          // So weit wandern Monster im Ruhezustand von ihrem Spawnpunkt weg
        loseAggroFactor: 2      // Verfolgung endet ab aggroRange * Faktor
    },

    // Monstertypen. weight = relative Spawn-Häufigkeit.
    monsterTypes: {
        slime: {
            name: 'Schleim',
            hp: 10,
            moveDelay: 750,
            aggroRange: 4,
            attack: 'melee',
            damage: 1,
            attackCooldown: 1200,
            ep: 3,
            weight: 4
        },
        goblin: {
            name: 'Goblin',
            hp: 12,
            moveDelay: 450,
            aggroRange: 6,
            attack: 'melee',
            damage: 2,
            attackCooldown: 1000,
            ep: 6,
            weight: 2
        },
        bat: {
            name: 'Fledermaus',
            hp: 6,
            moveDelay: 280,
            aggroRange: 7,
            attack: 'melee',
            damage: 1,
            attackCooldown: 700,
            ep: 4,
            weight: 2
        },
        wisp: {
            name: 'Irrlicht',
            hp: 8,
            moveDelay: 650,
            aggroRange: 7,
            attack: 'ranged',
            attackRange: 5,
            projectileSpeed: 5,
            projectileColor: '#38bdf8',
            damage: 1,
            attackCooldown: 1800,
            ep: 5,
            weight: 1
        }
    }
}
