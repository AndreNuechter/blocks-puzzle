import { fieldCanvas, currentPieceCanvas, piecePreview, pieceCache } from './dom-selections.js';
import {
    currentPieceCanvasSize,
    fieldHeight,
    fieldWidth,
    previewLength,
    previewScalingFactor
} from './constants.js';
import { field, pieceQueue } from './game-objects.js';
import { clearCanvas, colorCanvasGrey, draw2dArray, translateCanvas } from './canvas-handling.js';
import roundData from './round-data.js';

export const cellSize = { value: undefined };

setSizes();
window.addEventListener('resize', () => {
    setSizes();
    redrawCanvases();
});

// FIXME pieces in pieceQueue and pieceCache are drawn blurry on smaller screens, perhaps cuz of using fractional values somewhere (see previewScalingFactor)
function setSizes() {
    // an integer value is needed for crisp lines
    const value = Math.floor(
        Math.min(30, (window.innerHeight - 110) / 20, (window.innerWidth - 220) / 10)
    );
    cellSize.value = value;

    // +1 to account for outlines
    Object.assign(fieldCanvas.canvas, {
        width: fieldWidth * value + 1,
        height: fieldHeight * value + 1
    });
    Object.assign(fieldCanvas.canvas.parentElement.style, {
        width: fieldWidth * value + 1 + 'px',
        height: fieldHeight * value + 1 + 'px'
    });
    Object.assign(currentPieceCanvas.canvas, {
        width: currentPieceCanvasSize * value + 1,
        height: currentPieceCanvasSize * value + 1
    });
    Object.assign(piecePreview.canvas, {
        // -1 to save space and since the preview is never rotated
        width: (currentPieceCanvasSize - 1) * value * previewScalingFactor + 1,
        height: currentPieceCanvasSize * previewLength * value * previewScalingFactor + 1
    });
    Object.assign(pieceCache.canvas, {
        width: (currentPieceCanvasSize) * value * previewScalingFactor + 1,
        height: currentPieceCanvasSize * value * previewScalingFactor + 1
    });
}

function redrawCanvases() {
    colorCanvasGrey(fieldCanvas);
    colorCanvasGrey(piecePreview);
    colorCanvasGrey(pieceCache);
    clearCanvas(currentPieceCanvas);
    translateCanvas(currentPieceCanvas, roundData.piecePosition.x, roundData.piecePosition.y);
    draw2dArray(fieldCanvas, field, { variableColors: true });
    draw2dArray(currentPieceCanvas, roundData.currentPiece);

    if (pieceQueue[0].length) {
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
    }

    if (roundData.cachedPiece) {
        draw2dArray(
            pieceCache,
            roundData.cachedPiece,
            { scalingFactor: previewScalingFactor }
        );
    }
}