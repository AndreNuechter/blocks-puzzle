import { randomId } from './helper-funcs.js';

const pieces = Object.values({
    line: [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    s: [[0, 2, 2], [2, 2, 0], [0, 0, 0]],
    z: [[3, 3, 0], [0, 3, 3], [0, 0, 0]],
    l: [[0, 4, 0], [0, 4, 0], [0, 4, 4]],
    r: [[0, 5, 5], [0, 5, 0], [0, 5, 0]],
    o: [[6, 6], [6, 6]],
    t: [[0, 7, 0], [7, 7, 7], [0, 0, 0]]
});

export const colors = [
    null,
    'yellow',
    'blue',
    'red',
    'green',
    'purple',
    'brown',
    'orange',
    'beige'
];

export default function randomPiece() {
    return pieces[randomId(pieces.length)];
}

export function getColor(piece) {
    // due to the rotation system used, we know one of the two cells is filled
    return colors[piece[1][1] || piece[2][2]];
}