export const overlay = document.getElementById('overlay');
export const fieldCanvas = document.getElementById('field-canvas').getContext('2d', { alpha: false });
export const currentPieceCanvas = document.getElementById('current-piece-canvas').getContext('2d');
export const pieceCacheCanvas = document.getElementById('piece-cache').getContext('2d', { alpha: false });
export const piecePreview = document.getElementById('piece-preview').getContext('2d', { alpha: false });
export const pointsDisplay = document.getElementById('points-display');
export const clearedLinesCountDisplay = document.getElementById('cleared-lines-count-display');
export const gameSummaryText = document.getElementById('game-summary__text');
export const gameSummaryTable = document.getElementById('game-summary__table');
export const playerNameInput = document.querySelector('input[name="player-name"]')