export const BLOCK = Object.freeze({
    AIR:    0,
    GRASS:  1,
    DIRT:   2,
    STONE:  3,
    WOOD:   4,
    LEAVES: 5,
});

export const BLOCK_DEFS = Object.freeze({
    [BLOCK.AIR]: {
        solid: false,
        name: 'Air',
        hardness: 0,
    },
    [BLOCK.GRASS]: {
        solid: true,
        name: 'Grass',
        hardness: 0.35,
        top: '#5B8C3E',
        side: '#8B6914',
        shadow: '#4A7032',
    },
    [BLOCK.DIRT]: {
        solid: true,
        name: 'Dirt',
        hardness: 0.3,
        top: '#8B6914',
        side: '#6B4F10',
        shadow: '#5A4010',
    },
    [BLOCK.STONE]: {
        solid: true,
        name: 'Stone',
        hardness: 0.8,
        top: '#8A8A8A',
        side: '#6E6E6E',
        shadow: '#555555',
    },
    [BLOCK.WOOD]: {
        solid: true,
        name: 'Wood',
        hardness: 0.5,
        top: '#8B5A2B',
        side: '#6B4423',
        shadow: '#4A3018',
    },
    [BLOCK.LEAVES]: {
        solid: true,
        name: 'Leaves',
        hardness: 0.2,
        top: '#3D8B37',
        side: '#2E6B2A',
        shadow: '#1F4A1C',
    },
});

/** Hotbar block order (mineable / placeable). */
export const HOTBAR_BLOCKS = [
    BLOCK.GRASS,
    BLOCK.DIRT,
    BLOCK.STONE,
    BLOCK.WOOD,
    BLOCK.LEAVES,
];

export function isSolid(id) {
    return BLOCK_DEFS[id]?.solid === true;
}

export function getHardness(id) {
    return BLOCK_DEFS[id]?.hardness ?? 1;
}
