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

// TODO border on pieces may be cut off on small displays
// FIXME on small (possibly high dpi) screens the canvas is rendered blurry and borders may be of uneven size. Is it scaled?; try the following: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
setSizes();
window.addEventListener('resize', () => {
    setSizes();
    redrawCanvases();
});

function setSizes() {
    const value = Math.min(30, (window.innerHeight - 110) / 20, (window.innerWidth - 220) / 10);
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
    translateCanvas(currentPieceCanvas, roundData.x, roundData.y);
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