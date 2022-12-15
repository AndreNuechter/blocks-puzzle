import { eventNames, stepSize, touchInputDelay } from './constants.js';
import {
    applyGravity,
    rotatePiece,
    startGame,
    stashPiece,
    translateXPiece
} from './gameloop.js';
import { dispatchCustomEvent } from './helper-funcs.js';
import roundData from './round-data.js';

const [handler, downEvent, upEvent] = 'ontouchend' in window
    ? [handlePointerdown, 'pointerdown', 'pointerup']
    : [handleKeydown, 'keydown', 'keyup'];
const once = { once: true };

if (upEvent !== 'keyup') {
    // invert tint on pressed btns
    const pressedCssClass = 'pressed-down';
    const pressTarget = ({ target }) => target.classList.add(pressedCssClass);
    const releaseTarget = ({ target }) => target.classList.remove(pressedCssClass);
    // undo tint on release or exit
    document.querySelectorAll('.control-element').forEach(element => {
        element.addEventListener(downEvent, pressTarget)
        element.addEventListener(upEvent, releaseTarget);
        element.addEventListener('pointerleave', releaseTarget);
    });
}

window.addEventListener(upEvent, triggerGameLoop, once);
document.addEventListener(eventNames.gameStarted, () => window.addEventListener(downEvent, handler));
document.addEventListener(eventNames.gamePaused, () =>{
    window.removeEventListener(downEvent, handler);
    window.addEventListener(upEvent, () => {
        window.addEventListener(downEvent, () => dispatchCustomEvent(eventNames.gameStarted), once);
    }, once);
});
document.addEventListener(eventNames.gameEnded, () => window.removeEventListener(downEvent, handler));
document.addEventListener(eventNames.scoreHandled, () => {
    window.addEventListener(upEvent, () => {
        window.addEventListener(downEvent, triggerGameLoop, once);
    }, once);
});

function triggerGameLoop() {
    startGame();
    dispatchCustomEvent(eventNames.gameStarted);
}

function handleKeydown({ key, ctrlKey }) {
    if (roundData.linesAreBeingCleared) return;

    if (roundData.isGamePaused) {
        dispatchCustomEvent(eventNames.gameStarted);
    } else if (key === 'ArrowDown' || key.toLowerCase() === 's') {
        applyGravity();
    } else if (key === 'ArrowLeft' || key.toLowerCase() === 'a') {
        translateXPiece(-stepSize);
    } else if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
        translateXPiece(stepSize);
    } else if (key === 'ArrowUp' || key.toLowerCase() === 'w') {
        rotatePiece();
    } else if (key === ' ') {
        dispatchCustomEvent(eventNames.gamePaused);
    } else if (ctrlKey) {
        stashPiece();
    }
}

function handlePointerdown({ target: { dataset: { name } } }) {
    if (roundData.linesAreBeingCleared) return;

    if (roundData.isGamePaused) {
        dispatchCustomEvent(eventNames.gameStarted);
    } else if (name === 'ArrowDown') {
        repeatTillPointerup(() => {
            applyGravity();
            vibrate();
        });
    } else if (name === 'ArrowLeft') {
        repeatTillPointerup(() => {
            translateXPiece(-stepSize);
            vibrate();
        });
    } else if (name === 'ArrowRight') {
        repeatTillPointerup(() => {
            translateXPiece(stepSize);
            vibrate();
        });
    } else if (name === 'ArrowUp') {
        rotatePiece();
        vibrate();
    } else if (name === 'a') {
        dispatchCustomEvent(eventNames.gamePaused);
    } else if (name === 'b') {
        stashPiece();
        vibrate();
    }
}

// this is helpful because pointerdown isnt fired repeatedly like keydown is
function repeatTillPointerup(action) {
    // fire the callback once immediately
    action();

    // fire the callback in an interval until pointerup
    const intervalId = setInterval(action, touchInputDelay);

    window.addEventListener(
        upEvent,
        () => clearInterval(intervalId),
        once
    );
}

function vibrate() {
    window.navigator.vibrate(touchInputDelay / 3);
}