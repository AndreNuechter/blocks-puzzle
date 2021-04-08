const pieces = Object.values({
    line: [[1], [1], [1], [1]],
    s: [[2, 0], [2, 2], [0, 2]],
    z: [[0, 3], [3, 3], [3, 0]],
    leftHook: [[4, 4], [0, 4], [0, 4]],
    rightHook: [[5, 5], [5, 0], [5, 0]],
    block: [[6, 6], [6, 6]],
    hat: [[0, 7, 0], [7, 7, 7]]
});

export const colors = [
    null,
    'yellow',
    'blue',
    'red',
    'green',
    'purple',
    'brown',
    'orange',
    'beige'
];

function randomId(arrLength) {
    return Math.floor(Math.random() * arrLength);
}

export default function randomPiece() {
    return pieces[randomId(pieces.length)];
}