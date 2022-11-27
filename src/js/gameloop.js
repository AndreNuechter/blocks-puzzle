import {
    currentPieceCanvasSize,
    initialDropDelay,
    dropOffsetX,
    dropOffsetY,
    lineClearMultipliers,
    previewScalingFactor,
    stepSize,
    lineClearBaseAnimationDelay
} from './constants.js';
import { iterate, lastItem, rotate2dArray } from './helper-funcs.js';
import { collidesHorizontally, collidesVertically, isColliding } from './collision-detection.js';
// TODO turn these into modules...a canvas should change when the associated array does...we also need reset capabilities for resizing
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

    animationRequestId = requestAnimationFrame(gameLoop);

    if (roundData.lineClearAnimationDelay.active) {
        // redraw the changed playing-field once the delay has run out
        if (timestamp < roundData.lineClearAnimationDelay.nextTick) {
            return;
        } else {
            roundData.lineClearAnimationDelay.active = false;
            colorCanvasGrey(fieldCanvas);
            draw2dArray(fieldCanvas, field, { variableColors: true });
        }
    }

    // initially pieces fall at 1 row/sec; after about 300 line-clears at 1 row/frame
    if ((timestamp - lastTick) >= (initialDropDelay - 3.33 * roundData.clearedLinesCount)) {
        lastTick = timestamp;
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
        clearLines();
        spawnNewPiece();
    }
}

function lockPiece() {
    iterate(roundData.currentPiece, (y, x, cell) => {
        field[roundData.piecePosition.y + y][roundData.piecePosition.x + x] = cell;
    });
    draw2dArray(fieldCanvas, roundData.currentPiece, { offsets: roundData.piecePosition });
}

function clearLines() {
    const indicesOfClearedRows = field.reduce((result, row, y) => {
        if (row.some(cell => cell === 0)) return result;
        row.fill(0); // clear the row
        result.push(y);
        return result;
    }, []);

    if (indicesOfClearedRows.length > 0) {
        // give points and add cleared lines
        // TODO give bonus points for eg harddrops, t-spins and combos (timebased clears?)...
        // and output name of rewarded actions + given points
        // TODO prevent new piece being spawned before the delay is over
        Object.assign(roundData, {
            points: roundData.points + lineClearMultipliers[indicesOfClearedRows.length] * (Math.floor(roundData.clearedLinesCount * 0.1) + 1),
            clearedLinesCount: roundData.clearedLinesCount + indicesOfClearedRows.length,
            lineClearAnimationDelay: {
                active: true,
                nextTick: lastTick + lineClearBaseAnimationDelay * indicesOfClearedRows.length
            }
        });

        // re-draw field with gaps where cleared rows were
        colorCanvasGrey(fieldCanvas);
        draw2dArray(fieldCanvas, field, { variableColors: true });

        // move the cleared row(s) to the top of the field, closing the gaps
        indicesOfClearedRows.forEach(y => field.unshift(...field.splice(y, 1)));
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