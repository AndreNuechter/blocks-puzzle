const __default = (async ()=>{ if ('wakeLock' in navigator && 'request' in navigator.wakeLock) { const getWakeLock = ()=>navigator.wakeLock.request('screen') ; await getWakeLock(); document.addEventListener('visibilitychange', async ()=>{ if (document.visibilityState === 'visible') { await getWakeLock(); } }); } })(); const __default1 = (()=>{ window.addEventListener('DOMContentLoaded', ()=>{ if ('serviceWorker' in window.navigator) { window.navigator.serviceWorker.register('./service-worker.js'); } }, { once: true }); })(); const stepSize = 1; const lineClearMultipliers = [ 0, 100, 300, 500, 800 ]; const colors = [ 'lightgrey', 'yellow', 'blue', 'red', 'green', 'purple', 'brown', 'orange', 'beige' ]; const newGameMsg = document.getElementById('new-game-msg'); const pauseMsg = document.getElementById('paused-msg'); const overlay = document.getElementById('overlay'); const fieldCanvas = document.getElementById('field-canvas').getContext('2d', { alpha: false }); const currentPieceCanvas = document.getElementById('current-piece-canvas').getContext('2d'); const pieceCache = document.getElementById('piece-cache').getContext('2d', { alpha: false }); const piecePreview = document.getElementById('piece-preview').getContext('2d', { alpha: false }); const pointsDisplay = document.getElementById('points-display'); const clearedLinesCountDisplay = document.getElementById('cleared-lines-count-display'); const gameSummary = document.getElementById('game-summary'); function iterate(arr, cb) { arr.forEach((row, y)=>row.forEach((cell, x)=>{ if (cell > 0) { cb(y, x, cell); } }) ); } function lastItem(arr) { return arr[lastId(arr)]; } function lastId(arr) { return arr.length - 1; } function randomId(arrLength) { return Math.floor(Math.random() * arrLength); } function rotate2dArray(arr, length = arr.length) { const res = Array.from({ length }, ()=>new Array(length) ); for(let y = 0; y < length; y += 1){ for(let x = 0; x < length; x += 1){ res[y][x] = arr[length - x - 1][y]; } } return res; } function getColor(colors1, piece) { return colors1[piece[1][1] || piece[2][2]]; } const pieces = Object.values({ line: [ [ 0, 0, 1, 0 ], [ 0, 0, 1, 0 ], [ 0, 0, 1, 0 ], [ 0, 0, 1, 0 ] ], s: [ [ 0, 2, 2 ], [ 2, 2, 0 ], [ 0, 0, 0 ] ], z: [ [ 3, 3, 0 ], [ 0, 3, 3 ], [ 0, 0, 0 ] ], l: [ [ 0, 4, 0 ], [ 0, 4, 0 ], [ 0, 4, 4 ] ], r: [ [ 0, 5, 5 ], [ 0, 5, 0 ], [ 0, 5, 0 ] ], o: [ [ 6, 6 ], [ 6, 6 ] ], t: [ [ 0, 7, 0 ], [ 7, 7, 7 ], [ 0, 0, 0 ] ] }); const pieceQueue = new Array(5).fill([]); const field = Array.from({ length: 20 }, ()=>new Array(10) ); function getRandomPiece() { return pieces[randomId(pieces.length)]; } const cellSize = { value: undefined }; function clearCanvas(ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); } let points = 0; setSizes(); window.addEventListener('resize', ()=>{ setSizes(); redrawCanvases(); }); function setSizes() { const value = Math.min(30, (window.innerHeight - 110) / 20, (window.innerWidth - 220) / 10); cellSize.value = value; Object.assign(fieldCanvas.canvas, { width: 10 * value + 1, height: 20 * value + 1 }); Object.assign(fieldCanvas.canvas.parentElement.style, { width: 10 * value + 1 + 'px', height: 20 * value + 1 + 'px' }); Object.assign(currentPieceCanvas.canvas, { width: 4 * value + 1, height: 4 * value + 1 }); Object.assign(piecePreview.canvas, { width: (4 - 1) * value * 0.5 + 1, height: 4 * 5 * value * 0.5 + 1 }); Object.assign(pieceCache.canvas, { width: 4 * value * 0.5 + 1, height: 4 * value * 0.5 + 1 }); } function colorCanvasGrey(ctx) { ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); } function draw2dArray(ctx, array, offsets = { x: 0, y: 0 }, scalingFactor = 1, variableColors = false) { const size = cellSize.value * scalingFactor; if (!variableColors) ctx.fillStyle = getColor(colors, array); iterate(array, (i, j, cell)=>{ const x = (j + offsets.x) * size + 0.5; const y = (i + offsets.y) * size + 0.5; if (variableColors) ctx.fillStyle = colors[cell]; ctx.fillRect(x, y, size, size); ctx.strokeRect(x, y, size, size); }); } let clearedLinesCount = 0; let currentPiece; let cachedPiece; let x; function translateCanvas(ctx, x1, y) { ctx.canvas.style.transform = `translate(${x1 * cellSize.value}px, ${y * cellSize.value}px)`; } let y; const __default2 = { get points () { return points; }, set points (value){ points = value; pointsDisplay.textContent = value; }, get clearedLinesCount () { return clearedLinesCount; }, set clearedLinesCount (value){ clearedLinesCount = value; clearedLinesCountDisplay.textContent = value; }, get currentPiece () { return currentPiece; }, set currentPiece (piece){ currentPiece = piece; clearCanvas(currentPieceCanvas); draw2dArray(currentPieceCanvas, piece); }, get cachedPiece () { return cachedPiece; }, set cachedPiece (piece){ cachedPiece = piece; colorCanvasGrey(pieceCache); draw2dArray(pieceCache, piece, undefined, 0.5); }, piecePosition: { get x () { return x; }, set x (value1){ x = value1; translateCanvas(currentPieceCanvas, x, y); }, get y () { return y; }, set y (value1){ y = value1; translateCanvas(currentPieceCanvas, x, y); } }, isGamePaused: undefined }; function redrawCanvases() { colorCanvasGrey(fieldCanvas); draw2dArray(fieldCanvas, field, undefined, undefined, true); clearCanvas(currentPieceCanvas); draw2dArray(currentPieceCanvas, __default2.currentPiece); translateCanvas(currentPieceCanvas, __default2.x, __default2.y); colorCanvasGrey(piecePreview); if (pieceQueue[0].length) { pieceQueue.forEach((upcomingPiece, i)=>{ draw2dArray(piecePreview, upcomingPiece, { x: 0, y: i * 4 }, 0.5); }); } colorCanvasGrey(pieceCache); if (__default2.cachedPiece) { draw2dArray(pieceCache, __default2.cachedPiece, undefined, 0.5); } } document.addEventListener('start-game', ()=>{ overlay.classList.remove('fresh', 'paused', 'game-over'); overlay.classList.add('playing'); }); document.addEventListener('pause-game', ()=>{ overlay.classList.replace('playing', 'paused'); }); document.addEventListener('game-over', ()=>{ gameSummary.textContent = `${points} points via ${clearedLinesCount} cleared lines`; overlay.classList.replace('paused', 'game-over'); }); function collidesVertically(field1, piece, piecePosition, distance) { return piece.some((row, y1)=>{ const idOfNextRow = y1 + piecePosition.y + distance; if (row.every((cell)=>cell === 0 )) return false; if (idOfNextRow >= 20) return true; return row.some((cell, x1)=>cell !== 0 && field1[idOfNextRow][x1 + piecePosition.x] !== 0 ); }); } function collidesHorizontally(field1, piece, piecePosition, distance) { return piece.some((row, y1)=>{ const idOfCurrentRow = y1 + piecePosition.y; return row.some((cell, x1)=>{ const idOfNextCell = x1 + piecePosition.x + distance; if (idOfNextCell >= 10 && piece.some((row1)=>row1[x1] !== 0 )) return true; return cell !== 0 && field1[idOfCurrentRow][idOfNextCell] !== 0; }); }); } function isColliding(field1, piece, piecePosition) { return collidesHorizontally(field1, piece, piecePosition, 0) || collidesVertically(field1, piece, piecePosition, 0); } let animationRequestId; let lastCall; function gameLoop(timestamp) { if (lastCall === undefined) { lastCall = timestamp; } animationRequestId = requestAnimationFrame(gameLoop); if (timestamp - lastCall >= 1000 - 3.33 * __default2.clearedLinesCount) { lastCall = timestamp; applyGravity(); } } function startGame() { field.forEach((row)=>row.fill(0) ); __default2.points = 0; __default2.clearedLinesCount = 0; pieceQueue.forEach((_, i)=>{ pieceQueue[i] = getRandomPiece(); }); colorCanvasGrey(pieceCache); colorCanvasGrey(fieldCanvas); spawnNewPiece(); startAnimation(); } function startAnimation() { __default2.isGamePaused = false; animationRequestId = requestAnimationFrame(gameLoop); document.dispatchEvent(new Event('start-game')); } function suspendAnimation() { __default2.isGamePaused = true; cancelAnimationFrame(animationRequestId); document.dispatchEvent(new Event('pause-game')); } function endGame() { suspendAnimation(); __default2.isGamePaused = undefined; lastCall = undefined; document.dispatchEvent(new Event('game-over')); } function translateXPiece(delta) { if (!collidesHorizontally(field, __default2.currentPiece, __default2.piecePosition, delta)) { __default2.piecePosition.x += delta; } } function rotatePiece() { const rotatedPiece = rotate2dArray(__default2.currentPiece); if (!isColliding(field, rotatedPiece, __default2.piecePosition)) { __default2.currentPiece = rotatedPiece; } } function applyGravity() { if (!collidesVertically(field, __default2.currentPiece, __default2.piecePosition, 1)) { __default2.piecePosition.y += stepSize; } else { lockPiece(); clearLines(); spawnNewPiece(); } } function lockPiece() { iterate(__default2.currentPiece, (y1, x1, cell)=>{ field[__default2.piecePosition.y + y1][__default2.piecePosition.x + x1] = cell; }); draw2dArray(fieldCanvas, __default2.currentPiece, __default2.piecePosition); } function clearLines() { let cleared = 0; field.forEach((row, y1)=>{ if (row.some((cell)=>cell === 0 )) return; row.fill(0); cleared += 1; field.unshift(...field.splice(y1, 1)); }); if (cleared > 0) { colorCanvasGrey(fieldCanvas); draw2dArray(fieldCanvas, field, undefined, undefined, true); __default2.points += lineClearMultipliers[cleared] * (Math.floor(__default2.clearedLinesCount * 0.1) + 1); __default2.clearedLinesCount += cleared; } } function spawnNewPiece() { Object.assign(__default2.piecePosition, { x: 4, y: 0 }); __default2.currentPiece = progressPieceQueue(); if (isColliding(field, __default2.currentPiece, __default2.piecePosition)) { endGame(); } } function stashPiece() { if (!isColliding(field, __default2.cachedPiece || lastItem(pieceQueue), __default2.piecePosition)) { if (__default2.cachedPiece) { [__default2.currentPiece, __default2.cachedPiece] = [ __default2.cachedPiece, __default2.currentPiece ]; } else { __default2.cachedPiece = __default2.currentPiece; __default2.currentPiece = progressPieceQueue(); } } } function progressPieceQueue() { const emittedPiece = pieceQueue.pop(); colorCanvasGrey(piecePreview); pieceQueue.unshift(getRandomPiece()); pieceQueue.forEach((upcomingPiece, i)=>{ draw2dArray(piecePreview, upcomingPiece, { x: 0, y: i * 4 }, 0.5); }); return emittedPiece; } const [handler, downEvent, upEvent] = 'ontouchend' in window ? [ handlePointerdown, 'pointerdown', 'pointerup' ] : [ handleKeydown, 'keydown', 'keyup' ]; const once = { once: true }; if (upEvent !== 'keyUp') { newGameMsg.textContent = 'Tap screen to start a new Game.'; pauseMsg.textContent = 'Paused. Tap screen to continue.'; } document.addEventListener('game-over', ()=>{ window.removeEventListener(downEvent, handler); window.addEventListener(upEvent, addInputHandler, once); }); function addInputHandler() { window.addEventListener(downEvent, handler); } function handleKeydown({ key , ctrlKey }) { if (__default2.isGamePaused === undefined) { startGame(); } else if (__default2.isGamePaused) { startAnimation(); } else if (key === 'ArrowDown' || key.toLowerCase() === 's') { applyGravity(); } else if (key === 'ArrowLeft' || key.toLowerCase() === 'a') { translateXPiece(-1); } else if (key === 'ArrowRight' || key.toLowerCase() === 'd') { translateXPiece(1); } else if (key === 'ArrowUp' || key.toLowerCase() === 'w') { rotatePiece(); } else if (key === ' ') { suspendAnimation(); } else if (ctrlKey) { stashPiece(); } } function handlePointerdown({ target: { dataset: { name } } }) { if (__default2.isGamePaused === undefined) { startGame(); } else if (__default2.isGamePaused) { startAnimation(); } else if (name === 'ArrowDown') { repeatTillPointerup(applyGravity); } else if (name === 'ArrowLeft') { repeatTillPointerup(()=>translateXPiece(-1) ); } else if (name === 'ArrowRight') { repeatTillPointerup(()=>translateXPiece(1) ); } else if (name === 'ArrowUp') { rotatePiece(); } else if (name === 'a') { suspendAnimation(); } else if (name === 'b') { stashPiece(); } } function repeatTillPointerup(action) { const intervalId = setInterval(action, 100); window.addEventListener(upEvent, ()=>clearInterval(intervalId) , once); }