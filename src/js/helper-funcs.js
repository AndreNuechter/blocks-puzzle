/** Iterate over a 2d array of numbers and execute a callback for each non-zero cell
 * @param { number[][] } arr
 * @param { Function } cb
 */
export function iterate(arr, cb) {
    arr.forEach((row, y) => row
        .forEach((cell, x) => {
            if (cell > 0) {
                cb(y, x, cell);
            }
        })
    );
}

export function lastItem(arr) {
    return arr[lastId(arr)];
}

function lastId(arr) {
    return arr.length - 1;
}

export function randomId(arrLength) {
    return Math.floor(Math.random() * arrLength);
}

// thx to: https://stackoverflow.com/a/42535/7732282
export function rotate2dArray(arr, length = arr.length) {
    const res = Array.from({ length }, () => new Array(length));

    for (let y = 0; y < length; y += 1) {
        for (let x = 0; x < length; x += 1) {
            res[y][x] = arr[length - x - 1][y];
        }
    }

    return res;
}

export function getColor(colors, piece) {
    // due to the rotation system used, we know one of the two cells is filled in any piece-type
    return colors[piece[1][1] || piece[2][2]];
}