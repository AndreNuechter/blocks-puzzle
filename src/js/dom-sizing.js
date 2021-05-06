import { fieldCanvas, currentPieceCanvas, piecePreview, pieceCache } from './dom-selections.js';
import {
    currentPieceCanvasSize,
    cellSize,
    fieldHeight,
    fieldWidth,
    previewLength,
    previewScalingFactor
} from './constants.js';

// TODO handle device orientation (initial state and changes)

// +1 to account for outlines
Object.assign(fieldCanvas.canvas, {
    width: fieldWidth * cellSize + 1,
    height: fieldHeight * cellSize + 1
});
Object.assign(fieldCanvas.canvas.parentElement.style, {
    width: fieldWidth * cellSize + 1 + 'px',
    height: fieldHeight * cellSize + 1 + 'px'
});
Object.assign(currentPieceCanvas.canvas, {
    width: currentPieceCanvasSize * cellSize + 1,
    height: currentPieceCanvasSize * cellSize + 1
});
Object.assign(piecePreview.canvas, {
    // -1 to save space and since the preview is never rotated
    width: (currentPieceCanvasSize - 1) * cellSize * previewScalingFactor + 1,
    height: currentPieceCanvasSize * previewLength * cellSize * previewScalingFactor + 1
});
Object.assign(pieceCache.canvas, {
    width: (currentPieceCanvasSize) * cellSize * previewScalingFactor + 1,
    height: currentPieceCanvasSize * cellSize * previewScalingFactor + 1
});