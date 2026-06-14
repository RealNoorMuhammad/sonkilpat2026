/**
 * VirtualJoystick — touch/pointer stick for left, right, and jump.
 * Maps to the same virtual key actions as the old separate buttons.
 */
export default class VirtualJoystick {
    constructor(baseEl, knobEl, onChange) {
        if (!baseEl || !knobEl) {
            throw new Error('VirtualJoystick requires base and knob elements.');
        }

        this._base = baseEl;
        this._knob = knobEl;
        this._root = baseEl.closest('.joystick') ?? baseEl.parentElement ?? baseEl;
        this._onChange = onChange;
        this._active = false;
        this._pointerId = null;
        this._state = { left: false, right: false, jump: false };
        this._deadzone = 0.28;
        this._maxRadius = 50;

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onResize = () => this.refresh();

        this._base.addEventListener('pointerdown', this._onPointerDown);
        this._base.addEventListener('pointermove', this._onPointerMove);
        this._base.addEventListener('pointerup', this._onPointerUp);
        this._base.addEventListener('pointercancel', this._onPointerUp);

        window.addEventListener('resize', this._onResize);
        this.refresh();
    }

    /** Re-measure after the control becomes visible or the layout changes. */
    refresh() {
        const rect = this._base.getBoundingClientRect();
        const measured = Math.min(rect.width, rect.height) * 0.38;
        this._maxRadius = measured > 0 ? measured : 50;
    }

    reset() {
        if (this._pointerId != null) {
            try {
                if (this._base.hasPointerCapture?.(this._pointerId)) {
                    this._base.releasePointerCapture(this._pointerId);
                }
            } catch {
                // Ignore capture release errors on some browsers.
            }
        }

        this._active = false;
        this._pointerId = null;
        this._root.classList.remove('joystick--active');
        this._setKnobPosition(0, 0);
        this._applyDirections({ left: false, right: false, jump: false });
    }

    _onPointerDown(e) {
        e.preventDefault();
        this.refresh();

        this._active = true;
        this._pointerId = e.pointerId;
        this._root.classList.add('joystick--active');

        try {
            this._base.setPointerCapture(e.pointerId);
        } catch {
            // setPointerCapture can fail if the element is not connected.
        }

        this._handlePointer(e);
    }

    _onPointerMove(e) {
        if (!this._active || e.pointerId !== this._pointerId) return;
        e.preventDefault();
        this._handlePointer(e);
    }

    _onPointerUp(e) {
        if (this._pointerId != null && e.pointerId !== this._pointerId) return;
        e.preventDefault();
        this.reset();
    }

    _handlePointer(e) {
        if (this._maxRadius <= 0) this.refresh();
        const radius = this._maxRadius > 0 ? this._maxRadius : 50;

        const rect = this._base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        let dx = e.clientX - cx;
        let dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist > radius) {
            const scale = radius / dist;
            dx *= scale;
            dy *= scale;
        }

        const nx = dx / radius;
        const ny = dy / radius;

        this._setKnobPosition(dx, dy);
        this._applyDirections(this._computeDirections(nx, ny));
    }

    _computeDirections(nx, ny) {
        const dz = this._deadzone;

        if (Math.hypot(nx, ny) < dz) {
            return { left: false, right: false, jump: false };
        }

        if (ny < -dz && Math.abs(ny) >= Math.abs(nx)) {
            return { left: false, right: false, jump: true };
        }

        return {
            left: nx < -dz,
            right: nx > dz,
            jump: false,
        };
    }

    _setKnobPosition(x, y) {
        this._knob.style.transform = `translate(${x}px, ${y}px)`;
    }

    _applyDirections(next) {
        for (const dir of ['left', 'right', 'jump']) {
            if (this._state[dir] === next[dir]) continue;
            this._onChange(dir, next[dir]);
            this._state[dir] = next[dir];
        }
    }
}
