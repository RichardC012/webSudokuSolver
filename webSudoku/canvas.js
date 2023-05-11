var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var board = [[-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1]];

var solvedSquares = new Set();

var conflicts = new Set();

const CANVAS_SIZE = 600;
const SQUARE_SIZE = CANVAS_SIZE/9;
const LIGHT_BLUE = 'rgba(84, 194, 237, 0.2)';
const DARK_BLUE = 'rgba(50, 100, 210, 0.3)';
const LIGHT_RED = 'rgba(255, 0, 0, 0.5)';
const LIGHT_GREEN = 'rgba(0, 200, 0, 0.2)';
const LIGHT_GREY = '#BBBBBB';

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

var canvasLeft = canvas.offsetLeft + canvas.clientLeft;
var canvasTop = canvas.offsetTop + canvas.clientTop;

var selected = {
    x: -1,
    y: -1,
}

canvas.addEventListener('click', function(event) {
    var xClicked = Math.floor((event.pageX - canvasLeft)/SQUARE_SIZE),
        yClicked = Math.floor((event.pageY - canvasTop)/SQUARE_SIZE);
    
    selected.x = xClicked;
    selected.y = yClicked;

    updateCanvas();

 }, false);

document.addEventListener('keydown',async function(event) {
    var key = event.key;


    if (/[1-9]/.test(key)) {
        board[selected.y][selected.x] = +key;
        checkConflict(selected.x, selected.y);
    } else if (key == "Backspace") {
        board[selected.y][selected.x] = -1;
        conflicts.delete(selected.x + selected.y * 9);
        for (const index of conflicts) {
            checkConflict(index % 9, Math.floor(index/9));
        }
    } else if (key == "s" && conflicts.size == 0) {
        solveSudoku();
    } else if (key == "Escape") {
        selected.x = -1;
        selected.y = -1;
    }

    updateCanvas();
});

function resetBoard() {
    board = [[-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1,-1,-1,-1,-1]];
    solvedSquares = new Set();
    conflicts = new Set();
    updateCanvas();
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawConflicts();
    drawSolvedSqaures();
    drawGrid();
    if (selected.x != -1 && selected.y != -1) {
        drawSquares(selected.x, selected.y);
    }
    drawNumbers();
}

async function solveSudoku() {
    solvedSquares = new Set();
    let index = 0;
    let stack = [];
    let numChecked = 0;
    while (board[getY(index)][getX(index)] != -1) {
        index++;
    }
    stack.push(getValidNumbers(getX(index), getY(index)));
    while (stack.size != 0 && index < 81) {
        updateCanvas();
        let tuple = stack[stack.length-1];
        if (tuple[1].size == 0) {
            board[getY(tuple[0])][getX(tuple[0])] = -1;
            solvedSquares.delete(tuple[0]);
            stack.pop();
            index = stack[stack.length-1][0];
        } else {
            index = tuple[0];
            let num = tuple[1].values().next().value;
            tuple[1].delete(num);
            board[getY(index)][getX(index)] = num;

            solvedSquares.add(index);

            while (index < 81 && board[getY(index)][getX(index)] != -1) {
                index++;
            }

            if (index < 81) {
                stack.push(getValidNumbers(getX(index), getY(index)));
                numChecked++;
            }
        }
        await sleep(0.001);
        updateCanvas();
    }
    console.log(numChecked);
}

async function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// returns a tuple [index, set]
function getValidNumbers(x, y) {
    const newSet = new Set([1,2,3,4,5,6,7,8,9]);
    
    for (let i = 0; i < 9; i++) {
        newSet.delete(board[y][i]);
        newSet.delete(board[i][x]);
        
    }

    let xFloor = Math.floor(x/3) * 3;
    let yFloor = Math.floor(y/3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            newSet.delete(board[yFloor + j][xFloor + i]);
        }
    }
    return [x + y * 9, newSet];
}

function drawSolvedSqaures() {
    for (index of solvedSquares) {
        drawSquare(LIGHT_GREEN, getX(index), getY(index));
    }
}

function checkConflict(x, y) {
    let conflicted = false;

    for (let i = 0; i < 9; i++) {
        if (i < Math.floor(y/3) * 3 || i >= Math.floor(y/3) * 3 + 3) {
            if (board[y][x] == board[i][x] && y != i) {
                conflicted = true;
                conflicts.add(x + y * 9);
                conflicts.add(x + i * 9);
            }
        }
        if (i < Math.floor(x/3) * 3 || i >= Math.floor(x/3) * 3 + 3) {
            if (board[y][x] == board[y][i] && x != i) {
                conflicted = true;
                conflicts.add(x + y * 9);
                conflicts.add(i + y * 9);
            }
        }
    }

    let xFloor = Math.floor(x/3) * 3;
    let yFloor = Math.floor(y/3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[y][x] == board[yFloor + j][xFloor + i] && (y != (yFloor + j) || x != (xFloor + i))) {
                conflicted = true;
                conflicts.add(x + y * 9);
                conflicts.add(xFloor + i + (yFloor + j) * 9);
            }
        }
    }
    if (!conflicted) {
        conflicts.delete(x + y * 9);
    }

    console.log(conflicts);
    return conflicted;
}

function drawConflicts() {
    for (const index of conflicts) {
        drawOutline(LIGHT_RED, index % 9, Math.floor(index/9));
    }
}

function getX(index) {
    return index % 9;
}

function getY(index) {
    return Math.floor(index/9);
}

function drawNumbers() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[j][i] != -1) {
                drawNumber(board[j][i], i, j);
            }
        }
    }
}

function drawNumber(number, x, y) {
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.fillText(number.toString(), SQUARE_SIZE * (x + 0.31), SQUARE_SIZE * (y + 0.75));
}

function drawSquares(x, y) {
    ctx.fillStyle = LIGHT_BLUE;
    
    for (let i = 0; i < 9; i++) {
        if (i < Math.floor(y/3) * 3 || i >= Math.floor(y/3) * 3 + 3) {
            drawSquare(LIGHT_BLUE, x, i);
        }
        if (i < Math.floor(x/3) * 3 || i >= Math.floor(x/3) * 3 + 3) {
            drawSquare(LIGHT_BLUE, i, y);
        }
    }

    let xFloor = Math.floor(x/3) * 3;
    let yFloor = Math.floor(y/3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            drawSquare(LIGHT_BLUE, xFloor + i, yFloor + j);
        }
    }

    drawOutline(DARK_BLUE, x, y);
}

function drawSquare(color, x, y) {
    ctx.fillStyle = color;
    ctx.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
}

function drawOutline(color, x, y) {
    ctx.strokeStyle = color;
    ctx.lineWidth = '3';
    ctx.beginPath();
    ctx.rect(x * SQUARE_SIZE + 1, y * SQUARE_SIZE + 1, SQUARE_SIZE - 2, SQUARE_SIZE - 2);
    ctx.stroke();
}

function drawVerticalLine(xPos) {
    ctx.beginPath();
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, CANVAS_SIZE);
    ctx.stroke();
}

function drawHorizontalLine(yPos) {
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(CANVAS_SIZE, yPos);
    ctx.stroke();
}

function drawGrid() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = '0.3';
    drawVerticalLine(1 * SQUARE_SIZE);
    drawVerticalLine(2 * SQUARE_SIZE);
    drawVerticalLine(4 * SQUARE_SIZE);
    drawVerticalLine(5 * SQUARE_SIZE);
    drawVerticalLine(7 * SQUARE_SIZE);
    drawVerticalLine(8 * SQUARE_SIZE);

    drawHorizontalLine(1 * SQUARE_SIZE);
    drawHorizontalLine(2 * SQUARE_SIZE);
    drawHorizontalLine(4 * SQUARE_SIZE);
    drawHorizontalLine(5 * SQUARE_SIZE);
    drawHorizontalLine(7 * SQUARE_SIZE);
    drawHorizontalLine(8 * SQUARE_SIZE);

    ctx.strokeStyle = 'black';
    drawVerticalLine(3 * SQUARE_SIZE);
    drawVerticalLine(6 * SQUARE_SIZE);

    drawHorizontalLine(3 * SQUARE_SIZE);
    drawHorizontalLine(6 * SQUARE_SIZE);

}

updateCanvas();

