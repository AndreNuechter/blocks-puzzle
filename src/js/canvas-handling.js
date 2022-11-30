import { colors } from './constants.js';
import { cellSize } from './dom-sizing.js';
import { getColor, iterate } from './helper-funcs.js';

export function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function colorCanvasGrey(ctx) {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function draw2dArray(
    ctx,
    array,
    { offsets = { x: 0, y: 0 }, scalingFactor = 1, variableColors = false } = {
        offsets: { x: 0, y: 0 }, scalingFactor: 1, variableColors: false
    }
) {
    // an integer value is needed for crisp lines
    const currentCellSize = Math.floor(cellSize.value * scalingFactor);

    if (!variableColors) ctx.fillStyle = getColor(colors, array);

    iterate(array, (i, j, cell) => {
        // we add a 0.5 offset to get crisp lines
        const x = (j + offsets.x) * currentCellSize + 0.5;
        const y = (i + offsets.y) * currentCellSize + 0.5;

        if (variableColors) ctx.fillStyle = colors[cell];

        ctx.fillRect(x, y, currentCellSize, currentCellSize);
        ctx.strokeRect(x, y, currentCellSize, currentCellSize);
    });
}

export function translateCanvas(ctx, x, y) {
    ctx.canvas.style.transform = `translate(${x * cellSize.value}px, ${y * cellSize.value}px)`;
}