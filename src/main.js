import randomPiece, { colors } from './pieces.js';
import {
    dropOffsetX,
    dropOffsetY,
    cellSize,
    fieldHeight,
    fieldWidth,
    stepSize
} from './constants.js';
import { iterate, rotate2dArray } from './helper-funcs.js';
import collisionDetection from './collision-detection.js';

const debug = document.getElementById('debug');

const mainCanvas = document.getElementById('main-canvas').getContext('2d', { alpha: false });
const sideCanvas = document.getElementById('helper-canvas').getContext('2d');
const field = Array.from({ length: fieldHeight }, () => new Array(fieldWidth).fill(0));
const { collisionHorizontally, collisionVertically } = collisionDetection(field);

const piecePosition = {};
let currentPiece;

mainCanvas.fillStyle = 'lightgrey';
// +1 to width to account for the the 0.5 offset on pieces
mainCanvas.fillRect(0, 0, fieldWidth * cellSize + 1, fieldHeight * cellSize);
spawnPiece();
debugOutput();

window.onkeydown = ({ key }) => {
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
        mutated = true;
        rotatePiece();
    }

    if (mutated) {
        positionPiece();
        debugOutput();
    }
};

function spawnPiece() {
    Object.assign(piecePosition, { x: dropOffsetX, y: dropOffsetY });
    currentPiece = randomPiece();
    sideCanvas.clearRect(0, 0, sideCanvas.canvas.width, sideCanvas.canvas.height);
    sideCanvas.fillStyle = colors[currentPiece[0].find((v) => v !== 0)];
    iterate(currentPiece, drawPiece(sideCanvas));
    positionPiece();
}

function positionPiece() {
    sideCanvas.canvas.style.left = `${piecePosition.x * cellSize}px`;
    sideCanvas.canvas.style.top = `${piecePosition.y * cellSize}px`;
};

// TODO do this in an interval
function applyGravity() {
    if (!collisionVertically(currentPiece, piecePosition, stepSize)) {
        piecePosition.y += stepSize;
    } else {
        // integrate piece into field and draw newly added piece on the main canvas
        const cb = drawPiece(mainCanvas, piecePosition);
        mainCanvas.fillStyle = colors[currentPiece[0].find((v) => v !== 0)];
        iterate(currentPiece, (y, x, cell) => {
            field[piecePosition.y + y][piecePosition.x + x] = cell;
            cb(y, x);
        });
        // spawn a new piece at the top
        spawnPiece();
    }
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

function translateX(delta = stepSize) {
    if (!collisionHorizontally(currentPiece, piecePosition, delta)) {
        piecePosition.x += delta;
    }
}

function rotatePiece() {
    // TODO wallkicks
    const rotatedPiece = rotate2dArray(currentPiece, currentPiece.length);
    if (!(
        collisionHorizontally(rotatedPiece, piecePosition, 0)
        || collisionVertically(rotatedPiece, piecePosition, 0)
    )) {
        currentPiece = rotatedPiece;
        sideCanvas.clearRect(0, 0, sideCanvas.canvas.width, sideCanvas.canvas.height);
        iterate(currentPiece, drawPiece(sideCanvas));
    }
}