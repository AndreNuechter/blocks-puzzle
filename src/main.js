import './js/dom-sizing.js';
import {
    currentPieceCanvasSize,
    dropOffsetX,
    dropOffsetY,
    cellSize,
    fieldHeight,
    fieldWidth,
    initialDropDelay,
    lineClearMultipliers,
    previewLength,
    previewScalingFactor,
    stepSize
} from './js/constants.js';
import { iterate, rotate2dArray } from './js/helper-funcs.js';
import { collisionHorizontally, collisionVertically } from './js/collision-detection.js';
import { fieldCanvas, currentPieceCanvas, piecePreview } from './js/dom-selections.js';
import randomPiece, { colors } from './js/pieces.js';
import roundData from './js/round-data.js';

// TODO PWA and gh page...icons, manifest, service-worker, (conditional) wake lock...
// touch input handling...
// TODO handle device orientation (initial state and changes)
// TODO show input options on splashscreen

const field = Array.from({ length: fieldHeight }, () => new Array(fieldWidth));
const pieceQueue = new Array(previewLength).fill([]);
let currentPiece;
let isGamePaused;
let animationRequestId;
let lastCall;

addKeyDownHandler();

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

function addKeyDownHandler() {
    window.addEventListener('keydown', handleKeydown);
}

function handleKeydown({ key }) {
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
    }
}

function startGame() {
    field.forEach(row => row.fill(0));
    roundData.points = 0;
    roundData.clearedLinesCount = 0;
    pieceQueue.forEach((_, i) => {
        pieceQueue[i] = randomPiece();
    });
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

function applyGravity() {
    if (!collisionVertically(field, currentPiece, roundData.piecePosition, stepSize)) {
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
    iterate(currentPiece, (y, x, cell) => {
        field[roundData.piecePosition.y + y][roundData.piecePosition.x + x] = cell;
    });
    draw2dArray(fieldCanvas, currentPiece, roundData.piecePosition);
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
        // TODO output name of awarded actions
        roundData.points += lineClearMultipliers[cleared] * (Math.floor(roundData.clearedLinesCount * 0.1) + 1);
        roundData.clearedLinesCount += cleared;
    }
}

function clearCanvas(ctx) {
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function spawnNewPiece() {
    Object.assign(roundData.piecePosition, { x: dropOffsetX, y: dropOffsetY });
    setCurrentPiece(progressPieceQueue());
}


function setCurrentPiece(piece) {
    currentPiece = piece;
    currentPieceCanvas.clearRect(0, 0, currentPieceCanvas.canvas.width, currentPieceCanvas.canvas.height);
    draw2dArray(currentPieceCanvas, piece);
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

function getColor(piece) {
    // due to the rotation system used, we know one of the two cells is filled
    return colors[piece[1][1] || piece[2][2]];
}

function draw2dArray(ctx, array, offsets = { x: 0, y: 0 }, scalingFactor = 1, variableColors = false) {
    const size = cellSize * scalingFactor;
    if (!variableColors) ctx.fillStyle = getColor(array);
    iterate(array, (i, j, cell) => {
        // we add a 0.5 offset to get crisp lines
        const x = (j + offsets.x) * size + 0.5;
        const y = (i + offsets.y) * size + 0.5;

        if (variableColors) ctx.fillStyle = colors[cell];

        ctx.fillRect(x, y, size, size);
        ctx.strokeRect(x, y, size, size);
    });
}

function translateXPiece(delta = stepSize) {
    if (!collisionHorizontally(field, currentPiece, roundData.piecePosition, delta)) {
        roundData.piecePosition.x += delta;
    }
}

function rotatePiece() {
    // TODO wallkicks
    const rotatedPiece = rotate2dArray(currentPiece, currentPiece.length);
    if (!isColliding(rotatedPiece)) {
        setCurrentPiece(rotatedPiece);
    }
}

function isColliding(piece) {
    return collisionHorizontally(field, piece, roundData.piecePosition, 0)
        || collisionVertically(field, piece, roundData.piecePosition, 0);
}