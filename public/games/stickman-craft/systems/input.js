export class Input {
    constructor(canvas) {
        this.keys = {};
        this.mouseDown = false;
        this.mouseRight = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this._touchLeft = false;
        this._touchRight = false;
        this._touchJump = false;
        this._touchMine = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouseDown = true;
            if (e.button === 2) this.mouseRight = true;
            e.preventDefault();
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseDown = false;
            if (e.button === 2) this.mouseRight = false;
        });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this._bindTouchButtons();
    }

    _bindTouchButtons() {
        const bind = (id, prop) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); this[prop] = true; });
            el.addEventListener('touchend', (e) => { e.preventDefault(); this[prop] = false; });
            el.addEventListener('mousedown', (e) => { e.preventDefault(); this[prop] = true; });
            el.addEventListener('mouseup', (e) => { e.preventDefault(); this[prop] = false; });
            el.addEventListener('mouseleave', () => { this[prop] = false; });
        };
        bind('touchLeft', '_touchLeft');
        bind('touchRight', '_touchRight');
        bind('touchJump', '_touchJump');
        bind('touchMine', '_touchMine');
    }

    left() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || this._touchLeft;
    }

    right() {
        return this.keys['ArrowRight'] || this.keys['KeyD'] || this._touchRight;
    }

    jumpPressed() {
        return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this._touchJump;
    }

    mine() {
        return this.mouseDown || this._touchMine;
    }

    place() {
        return this.mouseRight;
    }

    hotbarSlot() {
        for (let i = 1; i <= 5; i++) {
            if (this.keys[`Digit${i}`]) return i - 1;
        }
        return -1;
    }
}
