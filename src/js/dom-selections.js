export const overlay = document.getElementById('overlay');
export const fieldCanvas = document.getElementById('field-canvas').getContext('2d', { alpha: false });
export const currentPieceCanvas = document.getElementById('current-piece-canvas').getContext('2d');
export const piecePreview = document.getElementById('piece-preview').getContext('2d', { alpha: false });
export const pointsDisplay = document.getElementById('points-display');
export const clearedLinesCountDisplay = document.getElementById('cleared-lines-count-display');
export const gameSummary = document.getElementById('game-summary');