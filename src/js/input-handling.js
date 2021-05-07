import { stepSize } from './constants.js';
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

// TODO touch input handling...

document.addEventListener('game-over', () => {
    // only allow starting a new game after keyup,
    // because the player might still hold down a key from the previous game
    window.removeEventListener('keydown', handleKeydown);
    window.addEventListener(
        'keyup',
        addInputHandler,
        { once: true }
    );
});

export default function addInputHandler() {
}

function handleKeydown({ key, ctrlKey }) {
    if (roundData.isGamePaused === undefined) {
        startGame();
    } else if (roundData.isGamePaused) {
        startAnimation();
    } else if (key === 'ArrowDown') {
        applyGravity();
    } else if (key === 'ArrowLeft') {
        translateXPiece(-stepSize);
    } else if (key === 'ArrowRight') {
        translateXPiece(stepSize);
    } else if (key === 'ArrowUp') {
        rotatePiece();
    } else if (key === ' ') {
        suspendAnimation();
    } else if (ctrlKey) {
        stashPiece();
    }
}