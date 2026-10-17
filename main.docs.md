# Projektstruktur

Das Projekt ist ein modulares Vanilla-JavaScript-RPG. Der Quellcode ist unter `src` organisiert und nach Verantwortungsbereichen aufgeteilt.

## Struktur

### assets/

- **assets/**: Enthält die grafischen und Audio-Ressourcen des Spiels.

### core/

- **Engine.js**: Aktuell nicht näher dokumentiert.
- **Game.js**: Zentrale Steuerung des Spiels, Game Loop und Zusammenspiel der Spielsysteme.
- **Input.js**: Verarbeitung von Tastatur- und Touch-Eingaben.
- **Sound.js**: Verwaltung von Soundeffekten und Hintergrundmusik.
- **Storage.js**: Aktuell nicht näher dokumentiert.
- **UI.js**: Verwaltung der Anzeige von Spielerwerten im HTML-UI.
- **constants.js**: Zentrale Konstanten und Konfigurationen des Spiels.

### entities/

- **Entity.js**: Aktuell leer; vorgesehen als mögliche gemeinsame Basisklasse für Entities.
- **Monster.js**: Monster, die umherwandern und den Spieler in der Nähe verfolgen und angreifen.
- **Projectile.js**: Zielsuchende Geschosse (Magieball des Spielers, Schüsse der Irrlichter).
- **FloatingText.js**: Aufsteigende Texte für Schaden, EP und Level-ups.
- **Player.js**: Repräsentiert den Spieler und verwaltet dessen Position und Darstellung.

### world/

- **Camera.js**: Verwaltet den sichtbaren Ausschnitt der Spielwelt und folgt dem Spieler.
- **Map.js**: Erzeugt und verwaltet Terrain, Weltobjekte, Häuser, Kollisionen und Darstellung der Spielkarte.
- **textures.js**: Stellt die grafischen Texturen für Terrain und Weltobjekte bereit.

### Root

- **index.html**: Grundlegende HTML-Struktur des Spiels.
- **style.css**: Globale Gestaltung und Layout des Spiels.
- **main.js**: Einstiegspunkt und Initialisierung des Spiels.


# index.html

Stellt die grundlegende HTML-Struktur des Spiels bereit. Enthält Canvas, UI-Layer, Joystick, Vollbild-Button und Statusanzeigen.

Zeilen: 67, Imports: 1, Attribute: 0, Funktionen: 0

# style.css

Definiert das Layout und die Darstellung des Spiels sowie des UI-Layers, der Statusbalken und des virtuellen Joysticks.

Zeilen: 84, Imports: 0, Attribute: 0, Funktionen: 0

# main.js

Initialisiert das Spiel, richtet die dynamische Canvas-Größe ein und verwaltet den Vollbildmodus.

Zeilen: 84, Imports: 1, Attribute: 0, Funktionen: 4

## Imports

`Game`

## Funktionen

- `handleFullScreenBtn()` → `void`
- `onFullscreenChange()` → `void`
- `resizeGame()` → `void`
- `DOMContentLoaded` → `void`