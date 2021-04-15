import randomPiece, { colors } from './pieces.js';
import {
    dropOffsetX,
    dropOffsetY,
    cellSize,
    fieldHeight,
    fieldWidth,
    lineClearMultiplier,
    stepSize
} from './constants.js';
import { iterate, rotate2dArray } from './helper-funcs.js';
import { collisionHorizontally, collisionVertically } from './collision-detection.js';

// TODO try deno vsc extension for linting/formatting and bundling
// TODO PWA...icons, manifest, service-worker, mobile input handling...
// TODO preview next piece

const pointsDisplay = document.getElementById('points-display');
const levelDisplay = document.getElementById('level-display');
const overlay = document.getElementById('overlay');
const mainCanvas = document.getElementById('main-canvas').getContext('2d', { alpha: false });
const sideCanvas = document.getElementById('helper-canvas').getContext('2d');
const field = Array.from({ length: fieldHeight }, () => new Array(fieldWidth));
// TODO getter and setter to do collisionDetection and enforce bounds + module?!
const piecePosition = {};
let currentPiece;
// TODO getter/setter to tie assignment to DOM-updates?! (same for lvl/clearedLines)
let points = 0;
let clearedLines = 0;
let initialDropDelay = 1000;
let animationRequestId;
let lastCall;

window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('keydown', startGame, { once: true });
}, { once: true });

function startGame() {
    field.forEach(row => row.fill(0));
    points = 0;
    clearedLines = 0;
    overlay.style.opacity = 0;
    pointsDisplay.textContent = 0;
    levelDisplay.textContent = 0;
    clearCanvas();
    spawnPiece();
    window.addEventListener('keydown', handleKeydown);
    animationRequestId = requestAnimationFrame(gameLoop);
}

function endGame() {
    cancelAnimationFrame(animationRequestId);
    window.removeEventListener('keydown', handleKeydown);
    overlay.firstElementChild.style.display = 'block';
    overlay.style.opacity = 1;
    // add the ability to start new game after a delay,
    // because the player might still hold down a key
    setTimeout(() => window.addEventListener('keydown', startGame, { once: true }), 1000);
}

function gameLoop(timestamp) {
    if (lastCall === undefined) {
        lastCall = timestamp;
    }

    animationRequestId = requestAnimationFrame(gameLoop);

    // pieces should fall at 1 row/frame after about 300 line-clears
    if ((timestamp - lastCall) >= (initialDropDelay - 3.33 * clearedLines)) {
        lastCall = timestamp;
        applyGravity();
    }
}

function applyGravity() {
    if (!collisionVertically(field, currentPiece, piecePosition, stepSize)) {
        piecePosition.y += stepSize;
        positionPiece();
    } else {
        if (piecePosition.y < 0) {
            endGame();
            return;
        }
        lockPiece();
        clearLines();
        spawnPiece();
    }
}

function lockPiece() {
    const cb1 = drawPiece(mainCanvas, piecePosition);
    iterate(currentPiece, (y, x, cell) => {
        field[piecePosition.y + y][piecePosition.x + x] = cell;
        cb1(y, x);
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
        const currentLvl = Math.floor(clearedLines * 0.1);
        const cb2 = drawPiece(mainCanvas);
        clearCanvas();
        iterate(field, (y, x, cell) => {
            mainCanvas.fillStyle = colors[cell];
            cb2(y, x);
        });
        // TODO bonus points for eg t-spins and combos...
        points += lineClearMultiplier[cleared] * (currentLvl + 1);
        pointsDisplay.textContent = points;
        levelDisplay.textContent = currentLvl;
        clearedLines += cleared;
    }
}

function handleKeydown({ key }) {
    // TODO pause on space
    let mutated = false;

    if (key === 'ArrowDown') {
        mutated = true;
        applyGravity();
    } else if (key === 'ArrowLeft') {
        mutated = true;
        translateX(-stepSize);
    } else if (key === 'ArrowRight') {
        mutated = true;
        translateX();
    } else if (key === 'ArrowUp') {
        rotatePiece();
    }

    if (mutated) {
        positionPiece();
    }
}

function clearCanvas() {
    mainCanvas.fillStyle = 'lightgrey';
    // +1 to width to account for the the 0.5 offset on pieces
    mainCanvas.fillRect(0, 0, fieldWidth * cellSize + 1, fieldHeight * cellSize);
}

function spawnPiece() {
    Object.assign(piecePosition, { x: dropOffsetX, y: dropOffsetY });
    currentPiece = randomPiece();
    const fillColor = colors[currentPiece[0].find((v) => v !== 0)];
    mainCanvas.fillStyle = fillColor;
    sideCanvas.fillStyle = fillColor;
    sideCanvas.clearRect(0, 0, sideCanvas.canvas.width, sideCanvas.canvas.height);
    iterate(currentPiece, drawPiece(sideCanvas));
    positionPiece();
}

function positionPiece() {
    sideCanvas.canvas.style.left = `${piecePosition.x * cellSize}px`;
    sideCanvas.canvas.style.top = `${piecePosition.y * cellSize}px`;
};

function drawPiece(ctx, offsets = { x: 0, y: 0 }) {
    return (i, j) => {
        // we add a 0.5 offset to get crisp lines
        const x = (j + offsets.x) * cellSize + 0.5;
        const y = (i + offsets.y) * cellSize + 0.5;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeRect(x, y, cellSize, cellSize);
    };
}

function translateX(delta = stepSize) {
    if (!collisionHorizontally(field, currentPiece, piecePosition, delta)) {
        piecePosition.x += delta;
    }
}

function rotatePiece() {
    // TODO wallkicks
    const rotatedPiece = rotate2dArray(currentPiece, currentPiece.length);
    if (!(
        collisionHorizontally(field, rotatedPiece, piecePosition, 0)
        || collisionVertically(field, rotatedPiece, piecePosition, 0)
    )) {
        currentPiece = rotatedPiece;
        sideCanvas.clearRect(0, 0, sideCanvas.canvas.width, sideCanvas.canvas.height);
        iterate(currentPiece, drawPiece(sideCanvas));
    }
}