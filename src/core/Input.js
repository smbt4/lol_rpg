export class Input {
    constructor() {
        this.keys = {};

        // Virtuelle Achsen für die Touch-Steuerung
        this.virtualDpad = { up: false, down: false, left: false, right: false };

        // Touch-Tracking-Variablen
        this.touchId = null;
        this.startX = 0;
        this.startY = 0;
        this.threshold = 20; // Mindestabstand in Pixeln, ab dem eine Bewegung als Schritt zählt

        // DOM-Elemente für den visuellen Joystick
        this.joyBase = document.getElementById('joystick-base');
        this.joyKnob = document.getElementById('joystick-knob');

        this.initKeyboard();
        this.initTouch();

        this.onInteraction = null;
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (e.key === 'Control' || e.key === ' ') {
                if (typeof this.onTap === 'function') this.onTap();
            }

            if (typeof this.onInteraction === 'function') {
                this.onInteraction();
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.onTap();
            }
        });
    }

    initTouch() {
        // Steuerung für das D-Pad (Bewegung)
        this.moveTouchId = null;
        this.touchTimer = null;
        this.isHoldMode = false;

        // Lausche auf JEDEN neuen Touch auf dem Bildschirm
        window.addEventListener('touchstart', (e) => {


            // Wir gehen alle neu hinzugekommenen Touch-Punkte durch
            for (const touch of e.changedTouches) {

                // UI-Buttons (wie Fullscreen) ignorieren
                if (touch.target.closest('#ui-layer') && ['BUTTON', 'A'].includes(touch.target.tagName)) continue;

                e.preventDefault();

                // FALL 1: Es läuft noch keine Bewegung, das ist der Primär-Touch fürs D-Pad
                if (this.moveTouchId === null) {
                    this.moveTouchId = touch.identifier;
                    this.startX = touch.clientX;
                    this.startY = touch.clientY;
                    this.isHoldMode = false;

                    // Timer für Hold-Erkennung starten
                    this.touchTimer = setTimeout(() => {
                        this.isHoldMode = true;
                        this.showJoystick(this.startX, this.startY);
                    }, 150);
                }
                // FALL 2: Der Spieler läuft bereits (moveTouchId besetzt) und tapt mit einem ZWEITEN Finger
                else {
                    // Ein Multitouch-Angriff während des Laufens!
                    this.handleTapAction(touch.clientX, touch.clientY);
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.moveTouchId === null) return;
            e.preventDefault();

            // Suche gezielt nach dem Touch-Point, der für die Bewegung zuständig ist
            const moveTouch = Array.from(e.touches).find(t => t.identifier === this.moveTouchId);
            if (!moveTouch) return;

            const dx = moveTouch.clientX - this.startX;
            const dy = moveTouch.clientY - this.startY;

            // Schnelles Wischen aktiviert sofort das D-Pad
            if (!this.isHoldMode && (Math.abs(dx) > this.threshold || Math.abs(dy) > this.threshold)) {
                clearTimeout(this.touchTimer);
                this.isHoldMode = true;
                this.showJoystick(this.startX, this.startY);
            }

            if (this.isHoldMode) {
                const angle = Math.atan2(dy, dx);
                const distance = Math.min(Math.hypot(dx, dy), 40);

                if (this.joyKnob) {
                    const knobX = Math.cos(angle) * distance;
                    const knobY = Math.sin(angle) * distance;
                    this.joyKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
                }

                this.virtualDpad.up = dy < -this.threshold;
                this.virtualDpad.down = dy > this.threshold;
                this.virtualDpad.left = dx < -this.threshold;
                this.virtualDpad.right = dx > this.threshold;
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {


            if (typeof this.onInteraction === 'function') {
                this.onInteraction();
            }


            // Wir prüfen, welche Finger gerade vom Bildschirm abgehoben wurden
            for (const touch of e.changedTouches) {

                // Wenn der Bewegungs-Finger abgehoben wurde, stoppe das D-Pad
                if (touch.identifier === this.moveTouchId) {
                    clearTimeout(this.touchTimer);

                    // Wenn er sich bis zum Loslassen nicht in den Hold-Modus bewegt hat, war es ein Solo-Tap
                    if (!this.isHoldMode) {
                        this.handleTapAction(this.startX, this.startY);
                    }

                    // Bewegung zurücksetzen
                    this.moveTouchId = null;
                    this.virtualDpad.up = false;
                    this.virtualDpad.down = false;
                    this.virtualDpad.left = false;
                    this.virtualDpad.right = false;

                    if (this.joyBase) this.joyBase.style.display = 'none';
                    if (this.joyKnob) this.joyKnob.style.transform = 'translate(-50%, -50%)';
                }
                // Hinweis: Zweit-Taps (Angriffe im Laufen) haben ihr Event bereits im 'touchstart' gefeuert
            }
        });
    }


    /**
     * Hilfsmethode zum Einblenden und Platzieren des Steuerkreuzes
     */
    showJoystick(x, y) {
        if (this.joyBase) {
            this.joyBase.style.left = `${x}px`;
            this.joyBase.style.top = `${y}px`;
            this.joyBase.style.display = 'block';
        }
    }

    /**
     * Wird gefeuert, wenn der Spieler nur kurz auf den Screen getappt hat
     */
    handleTapAction(screenX, screenY) {
        if (typeof this.onTap === 'function') {
            this.onTap();
        }

    }


    /**
     * Prüft, ob eine Taste gedrückt ist ODER das virtuelle D-Pad in diese Richtung zeigt.
     */
    isPressed(direction) {
        if (direction === 'up') return this.keys['ArrowUp'] || this.keys['w'] || this.virtualDpad.up;
        if (direction === 'down') return this.keys['ArrowDown'] || this.keys['s'] || this.virtualDpad.down;
        if (direction === 'left') return this.keys['ArrowLeft'] || this.keys['a'] || this.virtualDpad.left;
        if (direction === 'right') return this.keys['ArrowRight'] || this.keys['d'] || this.virtualDpad.right;

        return !!this.keys[direction];
    }
}
