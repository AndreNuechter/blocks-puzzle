import { eventNames, previewScalingFactor } from './constants.js';
import { draw2dArray, clearCanvas, colorCanvasGrey, translateCanvas } from './canvas-handling.js';
import {
    clearedLinesCountDisplay,
    currentPieceCanvas,
    gameSummaryText,
    overlay,
    pieceCacheCanvas,
    pointsDisplay
} from './dom-selections.js';
import handleScore from './highscores.js';

let points = 0;
let clearedLinesCount = 0;
let currentPiece;
let cachedPiece;
let x;
let y;

document.addEventListener(eventNames.gameStarted, () => {
    overlay.classList.remove('fresh', 'paused', 'game-over');
    overlay.classList.add('playing');
});
document.addEventListener(eventNames.gamePaused, () => {
    overlay.classList.replace('playing', 'paused');
});
document.addEventListener(eventNames.gameEnded, () => {
    overlay.classList.replace('playing', 'game-over');
    gameSummaryText.textContent = `You got ${points} points for clearing ${clearedLinesCount} lines`;
    handleScore(points, clearedLinesCount);
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
        if (piece) {
            draw2dArray(currentPieceCanvas, piece);
        }
    },
    get cachedPiece() {
        return cachedPiece;
    },
    set cachedPiece(piece) {
        cachedPiece = piece;
        colorCanvasGrey(pieceCacheCanvas);
        draw2dArray(pieceCacheCanvas, piece, { scalingFactor: previewScalingFactor });
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
    isGamePaused: undefined,
    linesAreBeingCleared: false,
};