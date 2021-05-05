import { fieldHeight, fieldWidth } from './constants.js';

export function collidesVertically(field, piece, piecePosition, distance) {
    return piece.some((row, y) => {
        const idOfNextRow = y + piecePosition.y + distance;
        // row is all padding
        if (row.every(cell => cell === 0)) return false;
        // reached bottom
        if (idOfNextRow >= fieldHeight) return true;
        // look for non-empty field-cell under non-empty piece-cell
        return row.some((cell, x) => cell !== 0 && field[idOfNextRow][x + piecePosition.x] !== 0);
    });
}

export function collidesHorizontally(field, piece, piecePosition, distance) {
    return piece.some((row, y) => {
        const idOfCurrentRow = y + piecePosition.y;
        return row.some((cell, x) => {
            const idOfNextCell = x + piecePosition.x + distance;
            // reached side
            if (idOfNextCell >= fieldWidth && piece.some(row => row[x] !== 0)) return true;
            // look for non-empty field-cell next to non-empty piece-cell
            return cell !== 0 && field[idOfCurrentRow][idOfNextCell] !== 0;
        });
    });
}

export function isColliding(field, piece, piecePosition) {
    return collidesHorizontally(field, piece, piecePosition, 0)
        || collidesVertically(field, piece, piecePosition, 0);
}