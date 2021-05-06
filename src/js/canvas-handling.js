import { cellSize } from './constants.js';
import { colors, getColor } from './pieces.js';
import { iterate } from './helper-funcs.js';

export function clearCanvas(ctx) {
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function draw2dArray(ctx, array, offsets = { x: 0, y: 0 }, scalingFactor = 1, variableColors = false) {
    const size = cellSize * scalingFactor;
    if (!variableColors) ctx.fillStyle = getColor(array);
    iterate(array, (i, j, cell) => {
        // we add a 0.5 offset to get crisp lines
        const x = (j + offsets.x) * size + 0.5;
        const y = (i + offsets.y) * size + 0.5;

        if (variableColors) ctx.fillStyle = colors[cell];

        ctx.fillRect(x, y, size, size);
        ctx.strokeRect(x, y, size, size);
    });
}