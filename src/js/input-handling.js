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

const isTouchDevice = window.matchMedia('(hover: none)').matches;
const [handler, downEvent, upEvent] = isTouchDevice
    ? [handlePointerdown, 'pointerdown', 'pointerup']
    : [handleKeydown, 'keydown', 'keyup'];
const once = { once: true };
let touchInputIntervalId;

window.addEventListener(upEvent, triggerGameLoop, once);
document.addEventListener(eventNames.gameStarted, () => window.addEventListener(downEvent, handler));
document.addEventListener(eventNames.gamePaused, () =>{
    window.removeEventListener(downEvent, handler);
    window.addEventListener(upEvent, () => {
        window.addEventListener(downEvent, () => dispatchCustomEvent(eventNames.gameStarted), once);
    }, once);
});
document.addEventListener(eventNames.gameEnded, () => window.removeEventListener(downEvent, handler));

if (isTouchDevice) {
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
    // handling this the same way as dektop would mean that it takes two taps to start a new game
    // NOTE: on desktop it actually does take two keypresses if the game ends while not holding down a key
    document.addEventListener(eventNames.scoreHandled, () => {
        window.addEventListener(downEvent, triggerGameLoop, once);
    });
    // stop repeating touchinputs on pointerup or game-end
    const listener = () => clearInterval(touchInputIntervalId);
    window.addEventListener(upEvent, listener);
    document.addEventListener(eventNames.gameEnded, listener);
} else {
    document.addEventListener(eventNames.scoreHandled, () => {
        window.addEventListener(upEvent, () => {
            window.addEventListener(downEvent, triggerGameLoop, once);
        }, once);
    });
}

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

const repeatedTouchActions = {
    ArrowDown: () => {
        if (roundData.linesAreBeingCleared) return;
        applyGravity();
        vibrate();
    },
    ArrowLeft: () => {
        if (roundData.linesAreBeingCleared) return;
        translateXPiece(-stepSize);
        vibrate();
    },
    ArrowRight: () => {
        if (roundData.linesAreBeingCleared) return;
        translateXPiece(stepSize);
        vibrate();
    }
};

function handlePointerdown({ target: { dataset: { name } } }) {
    if (roundData.linesAreBeingCleared) return;

    if (roundData.isGamePaused) {
        dispatchCustomEvent(eventNames.gameStarted);
    } else {
        switch(name) {
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                repeatTillPointerup(repeatedTouchActions[name]);
                break;
            case 'ArrowUp':
                rotatePiece();
                vibrate();
                break;
            case 'a':
                dispatchCustomEvent(eventNames.gamePaused);
                break;
            case 'b':
                stashPiece();
                vibrate();
                break;
        }
    }
}

// this is helpful because pointerdown isnt fired repeatedly like keydown is
function repeatTillPointerup(action) {
    // fire the callback once immediately
    action();

    // fire the callback in an interval until pointerup or game-end
    touchInputIntervalId = setInterval(action, touchInputDelay);
}

function vibrate() {
    window.navigator.vibrate(touchInputDelay / 3);
}