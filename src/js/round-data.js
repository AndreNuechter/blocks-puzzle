import { cellSize, previewScalingFactor } from './constants.js';
import { draw2dArray, clearCanvas } from './canvas-handling.js';
import {
    clearedLinesCountDisplay,
    currentPieceCanvas,
    gameSummary,
    overlay,
    pieceCache,
    pointsDisplay
} from './dom-selections.js';

let points = 0;
let clearedLinesCount = 0;
let currentPiece;
let cachedPiece;
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
    get currentPiece() {
        return currentPiece;
    },
    set currentPiece(piece) {
        currentPiece = piece;
        currentPieceCanvas.clearRect(0, 0, currentPieceCanvas.canvas.width, currentPieceCanvas.canvas.height);
        draw2dArray(currentPieceCanvas, piece);
    },
    get cachedPiece() {
        return cachedPiece;
    },
    set cachedPiece(piece) {
        cachedPiece = piece;
        clearCanvas(pieceCache);
        draw2dArray(pieceCache, piece, undefined, previewScalingFactor);
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
    currentPieceCanvas.canvas.style.transform = `translate(calc(${x * cellSize}px), ${y * cellSize}px)`;
}