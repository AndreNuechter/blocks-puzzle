import './js/dom-sizing.js';
import {
    currentPieceCanvasSize,
    dropOffsetX,
    dropOffsetY,
    fieldHeight,
    fieldWidth,
    initialDropDelay,
    lineClearMultipliers,
    previewLength,
    previewScalingFactor,
    stepSize
} from './js/constants.js';
import { iterate, lastItem, rotate2dArray } from './js/helper-funcs.js';
import { collidesHorizontally, collidesVertically, isColliding } from './js/collision-detection.js';
// TODO turn these into modules...a canvas should change when the associated array does
import { fieldCanvas, piecePreview, pieceCache } from './js/dom-selections.js';
import randomPiece from './js/pieces.js';
import { draw2dArray, clearCanvas } from './js/canvas-handling.js';
import roundData from './js/round-data.js';

// TODO PWA and gh page...icons, manifest, service-worker, (conditional) wake lock...
// touch input handling...
// TODO show input options on splashscreen

const field = Array.from({ length: fieldHeight }, () => new Array(fieldWidth));
const pieceQueue = new Array(previewLength).fill([]);
// TODO should all those be on roundData?
let isGamePaused;
let animationRequestId;
let lastCall;

addKeyDownHandler();

function addKeyDownHandler() {
    window.addEventListener('keydown', handleKeydown);
}

function handleKeydown({ key, ctrlKey }) {
    if (isGamePaused === undefined) {
        startGame();
    } else if (isGamePaused) {
        startAnimation();
    } else if (key === 'ArrowDown') {
        applyGravity();
    } else if (key === 'ArrowLeft') {
        translateXPiece(-stepSize);
    } else if (key === 'ArrowRight') {
        translateXPiece();
    } else if (key === 'ArrowUp') {
        rotatePiece();
    } else if (key === ' ') {
        suspendAnimation();
    } else if (ctrlKey) {
        stashPiece();
    }
}

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

function startGame() {
    field.forEach(row => row.fill(0));
    roundData.points = 0;
    roundData.clearedLinesCount = 0;
    pieceQueue.forEach((_, i) => {
        pieceQueue[i] = randomPiece();
    });
    clearCanvas(pieceCache);
    clearCanvas(fieldCanvas);
    spawnNewPiece();
    startAnimation();
}

function startAnimation() {
    isGamePaused = false;
    animationRequestId = requestAnimationFrame(gameLoop);
    document.dispatchEvent(new Event('start-game'));
}

function suspendAnimation() {
    isGamePaused = true;
    cancelAnimationFrame(animationRequestId);
    document.dispatchEvent(new Event('pause-game'));
}

function endGame() {
    suspendAnimation();
    isGamePaused = undefined;
    lastCall = undefined;
    // only allow starting a new game after keyup,
    // because the player might still hold down a key from the previous game
    window.removeEventListener('keydown', handleKeydown);
    window.addEventListener(
        'keyup',
        addKeyDownHandler,
        { once: true }
    );
    document.dispatchEvent(new Event('game-over'));
}

function translateXPiece(delta = stepSize) {
    if (!collidesHorizontally(field, roundData.currentPiece, roundData.piecePosition, delta)) {
        roundData.piecePosition.x += delta;
    }
}

function rotatePiece() {
    // TODO wallkicks
    const rotatedPiece = rotate2dArray(roundData.currentPiece);
    if (!isColliding(field, rotatedPiece, roundData.piecePosition)) {
        roundData.currentPiece = rotatedPiece;
    }
}

function applyGravity() {
    if (!collidesVertically(field, roundData.currentPiece, roundData.piecePosition, stepSize)) {
        roundData.piecePosition.y += stepSize;
    } else {
        if (roundData.piecePosition.y < 0) {
            endGame();
        } else {
            lockPiece();
            clearLines();
            spawnNewPiece();
        }
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
        clearCanvas(fieldCanvas);
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
}

function stashPiece() {
    if (!isColliding(field, roundData.cachedPiece || lastItem(pieceQueue), roundData.piecePosition)) {
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
    clearCanvas(piecePreview);
    pieceQueue.unshift(randomPiece());
    pieceQueue.forEach((upcomingPiece, i) => {
        draw2dArray(piecePreview, upcomingPiece, { x: 0, y: i * currentPieceCanvasSize }, previewScalingFactor);
    });
    return emittedPiece;
}