import { fieldCanvas, currentPieceCanvas, piecePreview, pieceCacheCanvas } from './dom-selections.js';
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

function setSizes() {
    // an integer value is needed for crisp lines
    const currentCellSize = Math.floor(
        Math.min(30, (window.innerHeight - 110) / 20, (window.innerWidth - 220) / 10)
    );

    cellSize.value = currentCellSize;

    // +1 to account for outlines
    Object.assign(fieldCanvas.canvas, {
        width: fieldWidth * currentCellSize + 1,
        height: fieldHeight * currentCellSize + 1
    });
    Object.assign(fieldCanvas.canvas.parentElement.style, {
        width: fieldWidth * currentCellSize + 1 + 'px',
        height: fieldHeight * currentCellSize + 1 + 'px'
    });
    Object.assign(currentPieceCanvas.canvas, {
        width: currentPieceCanvasSize * currentCellSize + 1,
        height: currentPieceCanvasSize * currentCellSize + 1
    });
    Object.assign(piecePreview.canvas, {
        // -1 to save space and since the preview is never rotated
        width: (currentPieceCanvasSize - 1) * currentCellSize * previewScalingFactor + 1,
        height: currentPieceCanvasSize * previewLength * currentCellSize * previewScalingFactor + 1
    });
    Object.assign(pieceCacheCanvas.canvas, {
        width: (currentPieceCanvasSize) * currentCellSize * previewScalingFactor + 1,
        height: currentPieceCanvasSize * currentCellSize * previewScalingFactor + 1
    });
}

function redrawCanvases() {
    colorCanvasGrey(fieldCanvas);
    colorCanvasGrey(piecePreview);
    colorCanvasGrey(pieceCacheCanvas);
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
            pieceCacheCanvas,
            roundData.cachedPiece,
            { scalingFactor: previewScalingFactor }
        );
    }
}