import randomPiece, { colors } from './pieces.js';
import {
    dropOffsetX,
    dropOffsetY,
    cellSize,
    fieldHeight,
    fieldWidth,
    stepSize
} from './constants.js';
import {
    lastItem,
    iterate
} from './helper-funcs.js';

const debug = document.getElementById('debug');

const mainCanvas = document.getElementById('main-canvas').getContext('2d', { alpha: false });
const sideCanvas = document.getElementById('helper-canvas').getContext('2d');
const field = Array.from({ length: fieldHeight }, () => new Array(fieldWidth).fill(0));
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
    if (!collisionBelow()) {
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

function collisionBelow() {
    return currentPiece.some((row, y) => {
        const idOfNextRow = y + piecePosition.y + stepSize;
        // reached bottom
        if (idOfNextRow >= fieldHeight) return true;
        // look for non-empty field-cell under non-empty piece-cell
        return row.some((cell, x) => cell !== 0 && field[idOfNextRow][x + piecePosition.x] !== 0);
    });
}

function translateX(delta = stepSize) {
    if (!collisionSideways(delta > 0)) {
        piecePosition.x += delta;
    }
}

function collisionSideways(movingRight) {
    // the piece has not completely entered the field
    if (piecePosition.y < 0) return true;
    if (movingRight) {
        return collisionRight();
    }
    return collisionLeft();
}

function collisionRight() {
    return currentPiece.some((row, y) => {
        const idOfCurrentRow = y + piecePosition.y;
        return row.some((cell, x) => {
            const idOfNextCell = x + piecePosition.x + stepSize;
            // reached right side
            if (idOfNextCell >= fieldWidth) return true;
            // look for non-empty field-cell right of non-empty piece-cell
            return cell !== 0 && field[idOfCurrentRow][idOfNextCell] !== 0;
        });
    });
}

function collisionLeft() {
    return currentPiece.some((row, y) => {
        const idOfCurrentRow = y + piecePosition.y;
        return row.some((cell, x) => {
            const idOfPrevCell = x + piecePosition.x - stepSize;
            // reached left side
            if (idOfPrevCell < 0) return true;
            // look for non-empty field-cell left of non-empty piece-cell
            return cell !== 0 && field[idOfCurrentRow][idOfPrevCell] !== 0;
        });
    });
}

function rotatePiece() {
    // TODO implement this
    if (piecePosition.y) {
        piecePosition.y -= 1;
    }
}