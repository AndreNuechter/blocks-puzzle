import { stepSize, touchInputDelay } from './constants.js';
import { newGameMsg, pauseMsg } from './dom-selections.js';
import {
    applyGravity,
    rotatePiece,
    startAnimation,
    startGame,
    stashPiece,
    suspendAnimation,
    translateXPiece
} from './gameloop.js';
import roundData from './round-data.js';

const [handler, downEvent, upEvent] = 'ontouchend' in window
    ? [handlePointerdown, 'pointerdown', 'pointerup']
    : [handleKeydown, 'keydown', 'keyup'];
const once = { once: true };

if (upEvent !== 'keyup') {
    newGameMsg.textContent = 'Tap screen to start a new Game.';
    pauseMsg.textContent = 'Paused. Tap screen to continue.';
}

document.addEventListener('game-over', () => {
    // only allow starting a new game after up,
    // because the player might still hold down from the previous game
    window.removeEventListener(downEvent, handler);
    window.addEventListener(
        upEvent,
        addInputHandler,
        once
    );
});

addInputHandler();

function addInputHandler() {
    window.addEventListener(downEvent, handler);
}

function handleKeydown({ key, ctrlKey }) {
    if (roundData.isGamePaused === undefined) {
        startGame();
    } else if (roundData.isGamePaused) {
        startAnimation();
    } else if (key === 'ArrowDown' || key.toLowerCase() === 's') {
        applyGravity();
    } else if (key === 'ArrowLeft' || key.toLowerCase() === 'a') {
        translateXPiece(-stepSize);
    } else if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
        translateXPiece(stepSize);
    } else if (key === 'ArrowUp' || key.toLowerCase() === 'w') {
        rotatePiece();
    } else if (key === ' ') {
        suspendAnimation();
    } else if (ctrlKey) {
        stashPiece();
    }
}

function handlePointerdown({ target: { dataset: { name } } }) {
    if (roundData.isGamePaused === undefined) {
        startGame();
    } else if (roundData.isGamePaused) {
        startAnimation();
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
        suspendAnimation();
    } else if (name === 'b') {
        stashPiece();
        vibrate();
    }
}

// this is helpful because pointerdown isnt fired repeatedly like keydown is
function repeatTillPointerup(action) {
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