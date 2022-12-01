import {
    currentPieceCanvasSize,
    initialDropDelay,
    dropOffsetX,
    dropOffsetY,
    lineClearMultipliers,
    previewScalingFactor,
    stepSize,
    lineClearBaseAnimationDelay,
    fieldWidth
} from './constants.js';
import { iterate, lastItem, rotate2dArray } from './helper-funcs.js';
import { collidesHorizontally, collidesVertically, isColliding } from './collision-detection.js';
import { field, pieceQueue, getRandomPiece } from './game-objects.js';
import { fieldCanvas, pieceCache, piecePreview } from './dom-selections.js';
import { colorCanvasGrey, draw2dArray } from './canvas-handling.js';
import roundData from './round-data.js';

let animationRequestId;
let lastTick;

function gameLoop(timestamp) {
    if (lastTick === undefined) {
        lastTick = timestamp;
    }

    // initially pieces fall at ~ 1 row/sec
    // after about 300 line-clears at ~ 60 rows/sec or 1 row/frame
    if (!roundData.linesAreBeingCleared
        && (timestamp - lastTick) >= (initialDropDelay - 3.33 * roundData.clearedLinesCount)
    ) {
        lastTick = timestamp;
        applyGravity();
    }

    animationRequestId = requestAnimationFrame(gameLoop);
}

export function startGame() {
    field.forEach(row => row.fill(0));
    Object.assign(roundData, { points: 0, clearedLinesCount: 0 });
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
    lastTick = undefined;
    document.dispatchEvent(new Event('game-over'));
}

export function translateXPiece(delta) {
    if (!collidesHorizontally(field, roundData.currentPiece, roundData.piecePosition, delta)) {
        roundData.piecePosition.x += delta;
    }
}

export function rotatePiece() {
    const rotatedPiece = rotate2dArray(roundData.currentPiece);

    if (!isColliding(field, rotatedPiece, roundData.piecePosition)) {
        roundData.currentPiece = rotatedPiece;
    } else {
        // if a rotation is refused, try again while moving the rotated piece 1 (and then 2) blocks away from the closest wall ("wallkick")
        if (roundData.piecePosition.x < (fieldWidth / 2)) {
            if (!isColliding(field, rotatedPiece, {
                x: roundData.piecePosition.x + 1,
                y: roundData.piecePosition.y,
            })) {
                roundData.currentPiece = rotatedPiece;
                roundData.piecePosition.x += 1;
            } else if (!isColliding(field, rotatedPiece, {
                x: roundData.piecePosition.x + 2,
                y: roundData.piecePosition.y,
            })) {
                roundData.currentPiece = rotatedPiece;
                roundData.piecePosition.x += 2;
            }
        } else {
            if (!isColliding(field, rotatedPiece, {
                x: roundData.piecePosition.x - 1,
                y: roundData.piecePosition.y,
            })) {
                roundData.currentPiece = rotatedPiece;
                roundData.piecePosition.x -= 1;
            } else if (!isColliding(field, rotatedPiece, {
                x: roundData.piecePosition.x - 2,
                y: roundData.piecePosition.y,
            })) {
                roundData.currentPiece = rotatedPiece;
                roundData.piecePosition.x -= 2;
            }
        }
    }
}

export function applyGravity() {
    if (!collidesVertically(field, roundData.currentPiece, roundData.piecePosition, stepSize)) {
        roundData.piecePosition.y += stepSize;
    } else {
        lockPiece();
        clearLinesAndSpawnNewPiece();
    }
}

function lockPiece() {
    // incorporate currentPiece into the playing field
    iterate(roundData.currentPiece, (y, x, cell) => {
        field[roundData.piecePosition.y + y][roundData.piecePosition.x + x] = cell;
    });
    // draw the current piece onto the main canvas
    draw2dArray(fieldCanvas, roundData.currentPiece, { offsets: roundData.piecePosition });
    // delete the currentPiece and clear its canvas
    roundData.currentPiece = undefined;
}

function clearLinesAndSpawnNewPiece() {
    const indicesOfClearedRows = field.reduce((result, row, y) => {
        if (row.some(cell => cell === 0)) return result;
        row.fill(0); // clear the row
        result.push(y);
        return result;
    }, []);

    if (indicesOfClearedRows.length > 0) {
        // give points, add cleared lines and delay applying gravity/accepting inputs
        // TODO give bonus points for eg harddrops, t-spins and combos (timebased clears?) and output name of rewarded actions + given points
        Object.assign(roundData, {
            points: roundData.points + lineClearMultipliers[indicesOfClearedRows.length] * (Math.floor(roundData.clearedLinesCount * 0.1) + 1),
            clearedLinesCount: roundData.clearedLinesCount + indicesOfClearedRows.length,
            linesAreBeingCleared: true
        });

        // re-draw field with gaps where cleared rows were
        colorCanvasGrey(fieldCanvas);
        draw2dArray(fieldCanvas, field, { variableColors: true });

        // re-draw collapsed canvas and spawn a new piece once the delay runs out
        setTimeout(() => {
            roundData.linesAreBeingCleared = false;
            colorCanvasGrey(fieldCanvas);
            draw2dArray(fieldCanvas, field, { variableColors: true });
            spawnNewPiece();
        }, lineClearBaseAnimationDelay * indicesOfClearedRows.length);

        // move the cleared row(s) to the top of the field, closing the gaps
        indicesOfClearedRows.forEach(y => field.unshift(...field.splice(y, 1)));
    } else {
        // if no lines were cleared, spawn a new piece now
        spawnNewPiece();
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
            {
                offsets: { x: 0, y: i * currentPieceCanvasSize },
                scalingFactor: previewScalingFactor
            }
        );
    });
    return emittedPiece;
}