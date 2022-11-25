window.addEventListener('DOMContentLoaded', ()=>{ if ('serviceWorker' in window.navigator) { window.navigator.serviceWorker.register('./service-worker.js'); } }, { once: true }); if ('wakeLock' in navigator && 'request' in navigator.wakeLock) { const getWakeLock = ()=>navigator.wakeLock.request('screen'); getWakeLock(); document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState === 'visible') { getWakeLock(); } }); } const stepSize = 1; const lineClearMultipliers = [ 0, 100, 300, 500, 800 ]; const colors = [ 'lightgrey', 'yellow', 'blue', 'red', 'green', 'purple', 'brown', 'orange', 'beige' ]; const newGameMsg = document.getElementById('new-game-msg'); const pauseMsg = document.getElementById('paused-msg'); const overlay = document.getElementById('overlay'); const fieldCanvas = document.getElementById('field-canvas').getContext('2d', { alpha: false }); const currentPieceCanvas = document.getElementById('current-piece-canvas').getContext('2d'); const pieceCache = document.getElementById('piece-cache').getContext('2d', { alpha: false }); const piecePreview = document.getElementById('piece-preview').getContext('2d', { alpha: false }); const pointsDisplay = document.getElementById('points-display'); const clearedLinesCountDisplay = document.getElementById('cleared-lines-count-display'); const gameSummary = document.getElementById('game-summary'); function iterate(arr, cb) { arr.forEach((row, y)=>row.forEach((cell, x)=>{ if (cell > 0) { cb(y, x, cell); } })); } function lastItem(arr) { return arr[lastId(arr)]; } function lastId(arr) { return arr.length - 1; } function randomId(arrLength) { return Math.floor(Math.random() * arrLength); } function rotate2dArray(arr, length = arr.length) { const res = Array.from({ length }, ()=>new Array(length)); for(let y = 0; y < length; y += 1){ for(let x = 0; x < length; x += 1){ res[y][x] = arr[length - x - 1][y]; } } return res; } function getColor(colors, piece1) { return colors[piece1[1][1] || piece1[2][2]]; } function collidesVertically(field, piece1, piecePosition, distance) { return piece1.some((row, y)=>{ const idOfNextRow = y + piecePosition.y + distance; if (row.every((cell)=>cell === 0)) return false; if (idOfNextRow >= 20) return true; return row.some((cell, x)=>cell !== 0 && field[idOfNextRow][x + piecePosition.x] !== 0); }); } function collidesHorizontally(field, piece1, piecePosition, distance) { return piece1.some((row, y)=>{ const idOfCurrentRow = y + piecePosition.y; return row.some((cell, x)=>{ const idOfNextCell = x + piecePosition.x + distance; if (idOfNextCell >= 10 && piece1.some((row)=>row[x] !== 0)) return true; return cell !== 0 && field[idOfCurrentRow][idOfNextCell] !== 0; }); }); } function isColliding(field, piece1, piecePosition) { return collidesHorizontally(field, piece1, piecePosition, 0) || collidesVertically(field, piece1, piecePosition, 0); } const pieces = Object.values({ line: [ [ 0, 0, 1, 0 ], [ 0, 0, 1, 0 ], [ 0, 0, 1, 0 ], [ 0, 0, 1, 0 ] ], s: [ [ 0, 2, 2 ], [ 2, 2, 0 ], [ 0, 0, 0 ] ], z: [ [ 3, 3, 0 ], [ 0, 3, 3 ], [ 0, 0, 0 ] ], l: [ [ 0, 4, 0 ], [ 0, 4, 0 ], [ 0, 4, 4 ] ], r: [ [ 0, 5, 5 ], [ 0, 5, 0 ], [ 0, 5, 0 ] ], o: [ [ 6, 6 ], [ 6, 6 ] ], t: [ [ 0, 7, 0 ], [ 7, 7, 7 ], [ 0, 0, 0 ] ] }); const pieceQueue = new Array(5).fill([]); const field = Array.from({ length: 20 }, ()=>new Array(10)); function getRandomPiece() { return pieces[randomId(pieces.length)]; } function clearCanvas(ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); } const cellSize = { value: undefined }; let points = 0; function colorCanvasGrey(ctx) { ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); } setSizes(); window.addEventListener('resize', ()=>{ setSizes(); redrawCanvases(); }); function setSizes() { const value1 = Math.min(30, (window.innerHeight - 110) / 20, (window.innerWidth - 220) / 10); cellSize.value = value1; Object.assign(fieldCanvas.canvas, { width: 10 * value1 + 1, height: 20 * value1 + 1 }); Object.assign(fieldCanvas.canvas.parentElement.style, { width: 10 * value1 + 1 + 'px', height: 20 * value1 + 1 + 'px' }); Object.assign(currentPieceCanvas.canvas, { width: 4 * value1 + 1, height: 4 * value1 + 1 }); Object.assign(piecePreview.canvas, { width: (4 - 1) * value1 * 0.5 + 1, height: 4 * 5 * value1 * 0.5 + 1 }); Object.assign(pieceCache.canvas, { width: 4 * value1 * 0.5 + 1, height: 4 * value1 * 0.5 + 1 }); } function draw2dArray(ctx, array, { offsets ={ x: 0, y: 0 } , scalingFactor =1 , variableColors =false } = { offsets: { x: 0, y: 0 }, scalingFactor: 1, variableColors: false }) { const size = cellSize.value * scalingFactor; if (!variableColors) ctx.fillStyle = getColor(colors, array); iterate(array, (i, j, cell)=>{ const x = (j + offsets.x) * size + 0.5; const y = (i + offsets.y) * size + 0.5; if (variableColors) ctx.fillStyle = colors[cell]; ctx.fillRect(x, y, size, size); ctx.strokeRect(x, y, size, size); }); } function translateCanvas(ctx, x, y) { ctx.canvas.style.transform = `translate(${x * cellSize.value}px, ${y * cellSize.value}px)`; } let clearedLinesCount = 0; let currentPiece; let cachedPiece; let x; let y; const __default = { get points () { return points; }, set points (value){ points = value; pointsDisplay.textContent = value; }, get clearedLinesCount () { return clearedLinesCount; }, set clearedLinesCount (value){ clearedLinesCount = value; clearedLinesCountDisplay.textContent = value; }, get currentPiece () { return currentPiece; }, set currentPiece (piece){ currentPiece = piece; clearCanvas(currentPieceCanvas); draw2dArray(currentPieceCanvas, piece); }, get cachedPiece () { return cachedPiece; }, set cachedPiece (piece){ cachedPiece = piece; colorCanvasGrey(pieceCache); draw2dArray(pieceCache, piece, { scalingFactor: 0.5 }); }, piecePosition: { get x () { return x; }, set x (value){ x = value; translateCanvas(currentPieceCanvas, x, y); }, get y () { return y; }, set y (value){ y = value; translateCanvas(currentPieceCanvas, x, y); } }, isGamePaused: undefined }; function redrawCanvases() { colorCanvasGrey(fieldCanvas); draw2dArray(fieldCanvas, field, { variableColors: true }); clearCanvas(currentPieceCanvas); draw2dArray(currentPieceCanvas, __default.currentPiece); translateCanvas(currentPieceCanvas, __default.x, __default.y); colorCanvasGrey(piecePreview); if (pieceQueue[0].length) { pieceQueue.forEach((upcomingPiece, i)=>{ draw2dArray(piecePreview, upcomingPiece, { offsets: { x: 0, y: i * 4 }, scalingFactor: 0.5 }); }); } colorCanvasGrey(pieceCache); if (__default.cachedPiece) { draw2dArray(pieceCache, __default.cachedPiece, { scalingFactor: 0.5 }); } } document.addEventListener('start-game', ()=>{ overlay.classList.remove('fresh', 'paused', 'game-over'); overlay.classList.add('playing'); }); document.addEventListener('pause-game', ()=>{ overlay.classList.replace('playing', 'paused'); }); document.addEventListener('game-over', ()=>{ gameSummary.textContent = `You got ${points} points for clearing ${clearedLinesCount} lines`; overlay.classList.replace('paused', 'game-over'); }); const lineClearAnimationDelay = { active: false, nextTick: null }; let animationRequestId; let lastTick; function gameLoop(timestamp) { if (lastTick === undefined) { lastTick = timestamp; } animationRequestId = requestAnimationFrame(gameLoop); if (lineClearAnimationDelay.active) { if (timestamp < lineClearAnimationDelay.nextTick) { return; } else { lineClearAnimationDelay.active = false; colorCanvasGrey(fieldCanvas); draw2dArray(fieldCanvas, field, { variableColors: true }); } } if (timestamp - lastTick >= 1000 - 3.33 * __default.clearedLinesCount) { lastTick = timestamp; applyGravity(); } } function startGame() { field.forEach((row)=>row.fill(0)); __default.points = 0; __default.clearedLinesCount = 0; pieceQueue.forEach((_, i)=>{ pieceQueue[i] = getRandomPiece(); }); colorCanvasGrey(pieceCache); colorCanvasGrey(fieldCanvas); spawnNewPiece(); startAnimation(); } function startAnimation() { __default.isGamePaused = false; animationRequestId = requestAnimationFrame(gameLoop); document.dispatchEvent(new Event('start-game')); } function suspendAnimation() { __default.isGamePaused = true; cancelAnimationFrame(animationRequestId); document.dispatchEvent(new Event('pause-game')); } function endGame() { suspendAnimation(); __default.isGamePaused = undefined; lastTick = undefined; document.dispatchEvent(new Event('game-over')); } function translateXPiece(delta) { if (!collidesHorizontally(field, __default.currentPiece, __default.piecePosition, delta)) { __default.piecePosition.x += delta; } } function rotatePiece() { const rotatedPiece = rotate2dArray(__default.currentPiece); if (!isColliding(field, rotatedPiece, __default.piecePosition)) { __default.currentPiece = rotatedPiece; } } function applyGravity() { if (!collidesVertically(field, __default.currentPiece, __default.piecePosition, 1)) { __default.piecePosition.y += stepSize; } else { lockPiece(); clearLines(); spawnNewPiece(); } } function lockPiece() { iterate(__default.currentPiece, (y, x, cell)=>{ field[__default.piecePosition.y + y][__default.piecePosition.x + x] = cell; }); draw2dArray(fieldCanvas, __default.currentPiece, { offsets: __default.piecePosition }); } function clearLines() { const indicesOfClearedRows = field.reduce((result, row, y)=>{ if (row.some((cell)=>cell === 0)) return result; row.fill(0); result.push(y); return result; }, []); if (indicesOfClearedRows.length > 0) { Object.assign(__default, { points: __default.points + lineClearMultipliers[indicesOfClearedRows.length] * (Math.floor(__default.clearedLinesCount * 0.1) + 1), clearedLinesCount: __default.clearedLinesCount + indicesOfClearedRows.length }); Object.assign(lineClearAnimationDelay, { active: true, nextTick: lastTick + 350 * indicesOfClearedRows.length }); colorCanvasGrey(fieldCanvas); draw2dArray(fieldCanvas, field, { variableColors: true }); indicesOfClearedRows.forEach((y)=>field.unshift(...field.splice(y, 1))); } } function spawnNewPiece() { Object.assign(__default.piecePosition, { x: 4, y: 0 }); __default.currentPiece = progressPieceQueue(); if (isColliding(field, __default.currentPiece, __default.piecePosition)) { endGame(); } } function stashPiece() { if (!isColliding(field, __default.cachedPiece || lastItem(pieceQueue), __default.piecePosition)) { if (__default.cachedPiece) { [__default.currentPiece, __default.cachedPiece] = [ __default.cachedPiece, __default.currentPiece ]; } else { __default.cachedPiece = __default.currentPiece; __default.currentPiece = progressPieceQueue(); } } } function progressPieceQueue() { const emittedPiece = pieceQueue.pop(); colorCanvasGrey(piecePreview); pieceQueue.unshift(getRandomPiece()); pieceQueue.forEach((upcomingPiece, i)=>{ draw2dArray(piecePreview, upcomingPiece, { offsets: { x: 0, y: i * 4 }, scalingFactor: 0.5 }); }); return emittedPiece; } const [handler, downEvent, upEvent] = 'ontouchend' in window ? [ handlePointerdown, 'pointerdown', 'pointerup' ] : [ handleKeydown, 'keydown', 'keyup' ]; const once = { once: true }; if (upEvent !== 'keyup') { newGameMsg.textContent = 'Tap screen to start a new Game.'; pauseMsg.textContent = 'Paused. Tap screen to continue.'; const pressedCssClass = 'pressed-down'; const pressTarget = ({ target })=>target.classList.add(pressedCssClass); const releaseTarget = ({ target })=>target.classList.remove(pressedCssClass); document.querySelectorAll('.control-element').forEach((element)=>{ element.addEventListener(downEvent, pressTarget); element.addEventListener(upEvent, releaseTarget); element.addEventListener('pointerleave', releaseTarget); }); } document.addEventListener('game-over', ()=>{ window.removeEventListener(downEvent, handler); window.addEventListener(upEvent, addInputHandler, once); }); addInputHandler(); function addInputHandler() { window.addEventListener(downEvent, handler); } function handleKeydown({ key , ctrlKey }) { if (__default.isGamePaused === undefined) { startGame(); } else if (__default.isGamePaused) { startAnimation(); } else if (key === 'ArrowDown' || key.toLowerCase() === 's') { applyGravity(); } else if (key === 'ArrowLeft' || key.toLowerCase() === 'a') { translateXPiece(-1); } else if (key === 'ArrowRight' || key.toLowerCase() === 'd') { translateXPiece(1); } else if (key === 'ArrowUp' || key.toLowerCase() === 'w') { rotatePiece(); } else if (key === ' ') { suspendAnimation(); } else if (ctrlKey) { stashPiece(); } } function handlePointerdown({ target: { dataset: { name } } }) { if (__default.isGamePaused === undefined) { startGame(); } else if (__default.isGamePaused) { startAnimation(); } else if (name === 'ArrowDown') { repeatTillPointerup(()=>{ applyGravity(); vibrate(); }); } else if (name === 'ArrowLeft') { repeatTillPointerup(()=>{ translateXPiece(-1); vibrate(); }); } else if (name === 'ArrowRight') { repeatTillPointerup(()=>{ translateXPiece(1); vibrate(); }); } else if (name === 'ArrowUp') { rotatePiece(); vibrate(); } else if (name === 'a') { suspendAnimation(); } else if (name === 'b') { stashPiece(); vibrate(); } } function repeatTillPointerup(action) { const intervalId = setInterval(action, 100); window.addEventListener(upEvent, ()=>clearInterval(intervalId), once); } function vibrate() { window.navigator.vibrate(100 / 3); }