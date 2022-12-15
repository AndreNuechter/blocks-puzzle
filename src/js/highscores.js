import { eventNames } from './constants.js';
import { gameSummaryTable, overlay } from "./dom-selections.js";
import { dispatchCustomEvent } from './helper-funcs.js';

const highscores = JSON.parse(localStorage.getItem('blocks-puzzle-hi-scores')) || [];
const maxHighscores = 10;
const newScore = {
    name: '',
    points: 0,
    clearedLinesCount: 0,
    position: -1
};

document.addEventListener(eventNames.scoreHandled, () => {
    overlay.classList.remove('asking-player-name');
    gameSummaryTable.innerHTML = getHighscores();
})

document.getElementById('player-name-form').addEventListener('submit', (event) => {
    const nameInput = event.target.querySelector('input');
    event.preventDefault();
    newScore.name = nameInput.value;
    nameInput.value = '';
    addHighscore(newScore);
    dispatchCustomEvent(eventNames.scoreHandled);
});

export default function handleScore(points, clearedLinesCount) {
    const position = getPosition(points);

    if (position > -1) {
        overlay.classList.add('asking-player-name');
        Object.assign(newScore, { points, clearedLinesCount, position });
    } else {
        dispatchCustomEvent(eventNames.scoreHandled);
    }
}

function getHighscores() {
    if (highscores.length === 0) return '';

    return '<tr><th>#</th><th>Points</th><th>Cleared</th><th>Name</th></tr>' + highscores
        .map(
            ({ points, clearedLinesCount, name }, position) => `
            <tr>
                <td>${position + 1}</td>
                <td>${points}</td>
                <td>${clearedLinesCount}</td>
                <td>${name}</td>
            </tr>`
        )
        .join('');
}

function getPosition(newPoints) {
    if (newPoints === 0) return -1;

    const position = highscores.findIndex(({ points: oldPoints }) => newPoints > oldPoints);

    return position < 0 && highscores.length < maxHighscores
        ? highscores.length
        : position;
}

function addHighscore({ points, clearedLinesCount, name, position }) {
    highscores.splice(position, 0, { points, clearedLinesCount, name });
    highscores.length = Math.min(highscores.length, maxHighscores);
    localStorage.setItem('blocks-puzzle-hi-scores', JSON.stringify(highscores));
}