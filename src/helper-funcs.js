/** Iterate over a 2d array and execute a callback for each non-zero cell
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
};

export function lastItem(arr) {
    return arr[lastId(arr)];
}

function lastId(arr) {
    return arr.length - 1;
}

export function randomId(arrLength) {
    return Math.floor(Math.random() * arrLength);
}