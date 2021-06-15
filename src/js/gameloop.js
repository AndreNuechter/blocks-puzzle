import {
    currentPieceCanvasSize,
    initialDropDelay,
    dropOffsetX,
    dropOffsetY,
    lineClearMultipliers,
    previewScalingFactor,
    stepSize
} from './constants.js';
import { iterate, lastItem, rotate2dArray } from './helper-funcs.js';
import { collidesHorizontally, collidesVertically, isColliding } from './collision-detection.js';
// TODO turn these into modules...a canvas should change when the associated array does
import { field, pieceQueue, getRandomPiece } from './game-objects.js';
import { fieldCanvas, pieceCache, piecePreview } from './dom-selections.js';
import { colorCanvasGrey, draw2dArray } from './canvas-handling.js';
import roundData from './round-data.js';

let animationRequestId;
let lastCall;

function gameLoop(timestamp) {
    if (lastCall === undefined) {
        lastCall = timestamp;
    }

    animationRequestId = requestAnimationFrame(gameLoop);

    // initially pieces fall at 1 row/sec; after about 300 line-clears at 1 row/frame
    if ((timestamp - lastCall) >= (initialDropDelay - 3.33 * roundData.clearedLinesCount)) {
        lastCall = timestamp;
        applyGravity();
    }
}

export function startGame() {
    field.forEach(row => row.fill(0));
    roundData.points = 0;
    roundData.clearedLinesCount = 0;
    pieceQueue.forEach((_, i) => {
        pieceQueue[i] = getRandomPiece();
    });
    colorCanvasGrey(pieceCache);
    colorCanvasGrey(fieldCanvas);
    spawnNewPiece();
    startAnimation();
}

export function startAnimation() {
    roundData.isGamePaused = false;
    animationRequestId = requestAnimationFrame(gameLoop);
    document.dispatchEvent(new Event('start-game'));
}

export function suspendAnimation() {
    roundData.isGamePaused = true;
    cancelAnimationFrame(animationRequestId);
    document.dispatchEvent(new Event('pause-game'));
}

export function endGame() {
    suspendAnimation();
    roundData.isGamePaused = undefined;
    lastCall = undefined;
    document.dispatchEvent(new Event('game-over'));
}

export function translateXPiece(delta) {
    if (!collidesHorizontally(field, roundData.currentPiece, roundData.piecePosition, delta)) {
        roundData.piecePosition.x += delta;
    }
}

export function rotatePiece() {
    // TODO wallkicks
    const rotatedPiece = rotate2dArray(roundData.currentPiece);
    // FIXME throws when done early and rotation is outside field
    if (!isColliding(field, rotatedPiece, roundData.piecePosition)) {
        roundData.currentPiece = rotatedPiece;
    }
}

export function applyGravity() {
    if (!collidesVertically(field, roundData.currentPiece, roundData.piecePosition, stepSize)) {
        roundData.piecePosition.y += stepSize;
    } else {
        lockPiece();
        clearLines();
        spawnNewPiece();
    }
}

function lockPiece() {
    iterate(roundData.currentPiece, (y, x, cell) => {
        field[roundData.piecePosition.y + y][roundData.piecePosition.x + x] = cell;
    });
    draw2dArray(fieldCanvas, roundData.currentPiece, roundData.piecePosition);
}

function clearLines() {
    // TODO animate line-clearing
    let cleared = 0;
    field.forEach((row, y) => {
        if (row.some(cell => cell === 0)) return;
        row.fill(0);
        cleared += 1;
        field.unshift(...field.splice(y, 1));
    });
    if (cleared > 0) {
        colorCanvasGrey(fieldCanvas);
        draw2dArray(fieldCanvas, field, undefined, undefined, true);
        // TODO give bonus points for eg harddrops, t-spins and combos...
        // TODO output name of rewarded actions + given points
        roundData.points += lineClearMultipliers[cleared] * (Math.floor(roundData.clearedLinesCount * 0.1) + 1);
        roundData.clearedLinesCount += cleared;
    }
}

function spawnNewPiece() {
    Object.assign(roundData.piecePosition, { x: dropOffsetX, y: dropOffsetY });
    roundData.currentPiece = progressPieceQueue();
    if (isColliding(field, roundData.currentPiece, roundData.piecePosition)) {
        endGame();
    }
}

export function stashPiece() {
    if (!isColliding(
        field,
        roundData.cachedPiece || lastItem(pieceQueue),
        roundData.piecePosition
    )) {
        if (roundData.cachedPiece) {
            [roundData.currentPiece, roundData.cachedPiece] = [roundData.cachedPiece, roundData.currentPiece];
        } else {
            roundData.cachedPiece = roundData.currentPiece;
            roundData.currentPiece = progressPieceQueue();
        }
    }
}

function progressPieceQueue() {
    const emittedPiece = pieceQueue.pop();
    colorCanvasGrey(piecePreview);
    pieceQueue.unshift(getRandomPiece());
    pieceQueue.forEach((upcomingPiece, i) => {
        draw2dArray(
            piecePreview,
            upcomingPiece,
            { x: 0, y: i * currentPieceCanvasSize },
            previewScalingFactor
        );
    });
    return emittedPiece;
}