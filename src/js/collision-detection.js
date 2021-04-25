import { fieldHeight, fieldWidth } from './constants.js';

export function collisionVertically(field, piece, piecePosition, distance) {
    // FIXME upper part of piece (that starts outside) may go beyond fieldboundary causing instant loss
    return piece.some((row, y) => {
        const idOfNextRow = y + piecePosition.y + distance;
        // there cant be a piece outside the field
        if (idOfNextRow < 0) return false;
        // row is all padding
        if (row.every(cell => cell === 0)) return false;
        // reached bottom
        if (idOfNextRow >= fieldHeight) return true;
        // look for non-empty field-cell under non-empty piece-cell
        return row.some((cell, x) => cell !== 0 && field[idOfNextRow][x + piecePosition.x] !== 0);
    });
}

export function collisionHorizontally(field, piece, piecePosition, distance) {
    return piece.some((row, y) => {
        const idOfCurrentRow = y + piecePosition.y;
        // piece hasnt yet completely entered the field
        if (idOfCurrentRow < 0) return false;
        return row.some((cell, x) => {
            const idOfNextCell = x + piecePosition.x + distance;
            // reached side
            if (idOfNextCell >= fieldWidth && piece.some(row => row[x] !== 0)) return true;
            // look for non-empty field-cell next to non-empty piece-cell
            return cell !== 0 && field[idOfCurrentRow][idOfNextCell] !== 0;
        });
    });
}