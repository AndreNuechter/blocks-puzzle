import { fieldHeight, fieldWidth, previewLength } from './constants.js';
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
export const pieceQueue = new Array(previewLength).fill([]);
export const field = Array.from({ length: fieldHeight }, () => new Array(fieldWidth));

export function getRandomPiece() {
    // NOTE: some variants draw a random piece from a bag of all 7 pieces wo replacement
    // this ensures a consistently solvable game...
    return pieces[randomId(pieces.length)];
}