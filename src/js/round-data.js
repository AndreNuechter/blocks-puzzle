import { previewScalingFactor } from './constants.js';
import { draw2dArray, clearCanvas, colorCanvasGrey, translateCanvas } from './canvas-handling.js';
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
    gameSummary.textContent = `You got ${points} points for clearing ${clearedLinesCount} lines`;
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
        clearCanvas(currentPieceCanvas);
        draw2dArray(currentPieceCanvas, piece);
    },
    get cachedPiece() {
        return cachedPiece;
    },
    set cachedPiece(piece) {
        cachedPiece = piece;
        colorCanvasGrey(pieceCache);
        draw2dArray(pieceCache, piece, { scalingFactor: previewScalingFactor });
    },
    piecePosition: {
        get x() {
            return x;
        },
        set x(value) {
            x = value;
            translateCanvas(currentPieceCanvas, x, y);
        },
        get y() {
            return y;
        },
        set y(value) {
            y = value;
            translateCanvas(currentPieceCanvas, x, y);
        }
    },
    isGamePaused: undefined
};