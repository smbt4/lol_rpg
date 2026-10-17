# Entities

Verwaltet die im Spiel vorhandenen Spielfiguren und zukünftig weitere bewegliche oder interaktive Lebewesen.

Zeilen: 66, Imports: 0, Attribute: 6, Funktionen: 2


# Entity.js

Aktuell leer. Vorgesehen als mögliche gemeinsame Basisklasse für Spielfiguren und andere Entities.

Zeilen: 0, Imports: 0, Attribute: 0, Funktionen: 0


# Monster.js (Klasse)

Ein Monster mit eigenem Typ (Schleim, Goblin, Fledermaus, Irrlicht; Werte in `constants.monsterTypes`). Wandert im Ruhezustand zufällig um seinen Spawnpunkt. Kommt der Spieler näher als `aggroRange`, wechselt es in den Verfolgungsmodus: Nahkampf-Monster laufen auf den Spieler zu und greifen an, sobald sie direkt neben ihm stehen; das Irrlicht schießt aus der Distanz. Wird ein Monster getroffen, verfolgt es den Spieler ebenfalls. Position und visuelle Position in Kacheln.

## Konstruktor

`constructor(type, x, y)` → `void`

## Funktionen

- `takeDamage(amount, now)` → `void`
- `update(now, world)` → `void` (world = Game-Instanz)
- `draw(ctx, camX, camY, tileSize, now)` → `void`


# Projectile.js (Klasse)

Zielsuchendes Geschoss: Magieball des Spielers oder Schuss eines Irrlichts. Fliegt in Kachel-Koordinaten auf die aktuelle Position seines Ziels zu und setzt `hit`, wenn es ankommt.

## Funktionen

- `update(dt)` → `void`
- `draw(ctx, camX, camY, tileSize)` → `void`


# FloatingText.js (Klasse)

Kurz aufsteigender Text für Schadenszahlen, EP-Gewinne, Level-ups und das „!“ beim Entdecken des Spielers.

## Funktionen

- `update(dt)` → `void`
- `draw(ctx, camX, camY, tileSize)` → `void`


# Player.js (Klasse)

Repräsentiert den Spieler. Verwaltet seine Grid-Position, die visuelle Position für flüssige Bewegung sowie das Laden und Zeichnen seines Sprites.

Zeilen: 66, Imports: 0, Attribute: 6, Funktionen: 2

## Konstruktor

`constructor(startX, startY)` → `void`

## Attribute

`x`, `y`, `visualX`, `visualY`, `isLoaded`, `sprite`

## Funktionen

- `interpolate(targetPixelX, targetPixelY, lerpSpeed)` → `void`
- `draw(ctx, camX, camY, tileSize)` → `void`