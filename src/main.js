import {
    currentPieceCanvasSize,
    dropOffsetX,
    dropOffsetY,
    cellSize,
    fieldHeight,
    fieldWidth,
    initialDropDelay,
    lineClearMultipliers,
    stepSize
} from './constants.js';
import { iterate, rotate2dArray } from './helper-funcs.js';
import { collisionHorizontally, collisionVertically } from './collision-detection.js';
import { fieldCanvas, currentPieceCanvas } from './dom-selections.js';
import randomPiece, { colors } from './pieces.js';
import roundData from './round-data.js';

// +1 to account for outlines
Object.assign(fieldCanvas.canvas, {
    width: fieldWidth * cellSize + 1,
    height: fieldHeight * cellSize + 1
});
Object.assign(currentPieceCanvas.canvas, {
    width: currentPieceCanvasSize * cellSize + 1,
    height: currentPieceCanvasSize * cellSize + 1
});

// TODO try deno vsc extension for linting/formatting and bundling
// TODO PWA...icons, manifest, service-worker, mobile input handling...
// TODO preview next piece(s)
// TODO show input options on splashscreen

const field = Array.from({ length: fieldHeight }, () => new Array(fieldWidth));
let currentPiece;
let isGamePaused;
let animationRequestId;
let lastCall;

window.addEventListener('keydown', handleKeydown);

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

function handleKeydown({ key }) {
    if (isGamePaused === undefined) {
        // FIXME only allow starting a new game after a delay,
        // because the player might still hold down a key from the previous game
        // currentPiece is only undefined if we're just starting...
        // lastCall could also be usefull here...
        startGame();
    } else if (isGamePaused) {
        // FIXME due to transition on overlay, current piece has moved before it becomes visible
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
    clearCanvas();
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
    const cb = drawPiece(fieldCanvas, roundData.piecePosition);
    iterate(currentPiece, (y, x, cell) => {
        field[roundData.piecePosition.y + y][roundData.piecePosition.x + x] = cell;
        cb(y, x);
    });
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
        const cb = drawPiece(fieldCanvas);
        clearCanvas();
        iterate(field, (y, x, cell) => {
            fieldCanvas.fillStyle = colors[cell];
            cb(y, x);
        });
        // TODO give bonus points for eg harddrops, t-spins and combos...
        roundData.points += lineClearMultipliers[cleared] * (Math.floor(roundData.clearedLinesCount * 0.1) + 1);
        roundData.clearedLinesCount += cleared;
    }
}

function clearCanvas() {
    fieldCanvas.fillStyle = 'lightgrey';
    // +1 to account for the the 0.5 offset on pieces
    fieldCanvas.fillRect(0, 0, fieldWidth * cellSize + 1, fieldHeight * cellSize + 1);
}

function spawnNewPiece() {
    Object.assign(roundData.piecePosition, { x: dropOffsetX, y: dropOffsetY });
    currentPiece = randomPiece();
    const fillColor = colors[currentPiece[0].find((v) => v !== 0)];
    fieldCanvas.fillStyle = fillColor;
    currentPieceCanvas.fillStyle = fillColor;
    currentPieceCanvas.clearRect(0, 0, currentPieceCanvas.canvas.width, currentPieceCanvas.canvas.height);
    iterate(currentPiece, drawPiece(currentPieceCanvas));
}

function drawPiece(ctx, offsets = { x: 0, y: 0 }) {
    return (i, j) => {
        // we add a 0.5 offset to get crisp lines
        const x = (j + offsets.x) * cellSize + 0.5;
        const y = (i + offsets.y) * cellSize + 0.5;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeRect(x, y, cellSize, cellSize);
    };
}

function translateXPiece(delta = stepSize) {
    if (!collisionHorizontally(field, currentPiece, roundData.piecePosition, delta)) {
        roundData.piecePosition.x += delta;
    }
}

function rotatePiece() {
    // TODO wallkicks
    const rotatedPiece = rotate2dArray(currentPiece, currentPiece.length);
    if (!(
        collisionHorizontally(field, rotatedPiece, roundData.piecePosition, 0)
        || collisionVertically(field, rotatedPiece, roundData.piecePosition, 0)
    )) {
        currentPiece = rotatedPiece;
        currentPieceCanvas.clearRect(0, 0, currentPieceCanvas.canvas.width, currentPieceCanvas.canvas.height);
        iterate(currentPiece, drawPiece(currentPieceCanvas));
    }
}