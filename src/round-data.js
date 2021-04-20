import { cellSize } from './constants.js';
import { overlay, pointsDisplay, clearedLinesCountDisplay, gameSummary, currentPieceCanvas } from './dom-selections.js';

let points = 0;
let clearedLinesCount = 0;
let x;
let y;

document.addEventListener('start-game', () => {
    overlay.classList.remove('fresh', 'paused', 'game-over');
    overlay.classList.add('playing');
});

document.addEventListener('pause-game', () => {
    overlay.classList.replace('playing', 'paused');
});

document.addEventListener('game-over', () => {
    gameSummary.textContent = `${points} points via ${clearedLinesCount} cleared lines`;
    overlay.classList.replace('paused', 'game-over');
});

export default {
    get points() {
        return points;
    },
    set points(value) {
        points = value;
        pointsDisplay.textContent = value;
    },
    get clearedLinesCount() {
        return clearedLinesCount;
    },
    set clearedLinesCount(value) {
        clearedLinesCount = value;
        clearedLinesCountDisplay.textContent = value;
    },
    piecePosition: {
        get x() {
            return x;
        },
        set x(value) {
            x = value;
            translatePiece();
        },
        get y() {
            return y;
        },
        set y(value) {
            y = value;
            translatePiece();
        }
    }
};

function translatePiece() {
    // TODO why do we need to subtract 3 from x for proper placement?
    currentPieceCanvas.canvas.style.transform = `translate(calc(${(x - 3) * cellSize}px), ${y * cellSize}px)`;
}