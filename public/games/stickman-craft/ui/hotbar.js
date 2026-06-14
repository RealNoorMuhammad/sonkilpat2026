import { BLOCK_DEFS, HOTBAR_BLOCKS } from '../world/blockTypes.js';

export class HotbarUI {
    constructor(root) {
        this.root = root;
        this.slots = [];
        this._build();
    }

    _build() {
        this.root.innerHTML = '';
        HOTBAR_BLOCKS.forEach((blockId, i) => {
            const slot = document.createElement('button');
            slot.className = 'hotbar-slot';
            slot.dataset.slot = i;
            slot.innerHTML = `
                <span class="hotbar-slot__preview" data-block="${blockId}"></span>
                <span class="hotbar-slot__key">${i + 1}</span>
                <span class="hotbar-slot__count">0</span>
            `;
            slot.addEventListener('click', () => {
                this.onSelect?.(i);
            });
            this.root.appendChild(slot);
            this.slots.push(slot);
        });
    }

    update(inventory) {
        HOTBAR_BLOCKS.forEach((blockId, i) => {
            const slot = this.slots[i];
            const def = BLOCK_DEFS[blockId];
            const preview = slot.querySelector('.hotbar-slot__preview');
            preview.style.background = def?.top || '#888';
            slot.querySelector('.hotbar-slot__count').textContent = inventory.counts[blockId] || 0;
            slot.classList.toggle('hotbar-slot--active', i === inventory.selectedSlot);
        });
    }
}
