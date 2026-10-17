export class UI {
    constructor() {
        // Wir fangen uns die HTML-Anzeige-Elemente aus der index.html
        this.hpElement = document.getElementById('ui-hp');
        this.epElement = document.getElementById('ui-ep');
        this.hpFill = document.getElementById('hp-fill');
        this.epFill = document.getElementById('ep-fill');
        this.hpContainer = document.getElementById('hp-bar-container');
        this.epContainer = document.getElementById('ep-bar-container');
    }

    updateHP(current, max) {
        if (this.hpElement) {
            this.hpElement.textContent = current + "/" + max;
        }
        if (this.hpFill) {
            this.hpFill.style.width = Math.max(0, current / max * 100) + '%';
        }
    }

    updateEP(current, max) {
        if (this.epElement) {
            this.epElement.textContent = current + "/" + max;
        }
        if (this.epFill) {
            this.epFill.style.width = Math.max(0, current / max * 100) + '%';
        }
    }

    // Laut Game Design erscheinen die Balken erst, wenn sie relevant werden
    showHP() {
        if (this.hpContainer) this.hpContainer.style.display = 'block';
    }

    showEP() {
        if (this.epContainer) this.epContainer.style.display = 'block';
    }
}
