var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var     emptyBoard = 
                [[0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0]];

var board = copyBoard(emptyBoard);

var beforeSolveBoard = copyBoard(emptyBoard);

var easyBoards;
var mediumBoards;
var hardBoards;
var currBoard;

var logicalBoard;


var solvedSquares = new Set();
var conflicts = new Set();


const CANVAS_SIZE = 600;
const SQUARE_SIZE = CANVAS_SIZE/9;
const LIGHT_BLUE = 'rgba(84, 194, 237, 0.2)';
const DARK_BLUE = 'rgba(50, 100, 210, 0.3)';
const LIGHT_RED = 'rgba(255, 0, 0, 0.5)';
const LIGHT_GREEN = 'rgba(0, 200, 0, 0.2)';
const LIGHT_GREY = '#BBBBBB';
var sleepTime = 0.001;
var inSolve = false;
var squaresChecked = 0;
var difficulty = "Easy";
var solveStyle = "Backtracking";

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

var canvasLeft = canvas.offsetLeft + canvas.clientLeft;
var canvasTop = canvas.offsetTop + canvas.clientTop;

var selected = {
    x: -1,
    y: -1,
}

startup();

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
        board[selected.y][selected.x] = 0;
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

function startup() {
    setPresetBoards();
    updateCanvas();
    setBacktracking();
}

function solveSudoku() {
    if (solveStyle == "Backtracking") {
        solveBacktracking();
    } else if (solveStyle == "Logical") {
        solveLogical();
    }
}

function resetBoard() {
    inSolve = false;
    if (boardEquals(board, beforeSolveBoard)) {
        board = copyBoard(emptyBoard);
        beforeSolveBoard = copyBoard(emptyBoard);
    } else {
        board = copyBoard(beforeSolveBoard);
    }
    conflicts = new Set();
    solvedSquares = new Set();
    squaresChecked = 0;
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
    document.querySelector('#textButton').innerHTML = "Squares Checked: " + squaresChecked;
    document.querySelector('#diffButton').innerHTML = "Difficulty: " + difficulty;
    document.querySelector('#diffButton').innerText = "Difficulty: " + difficulty;
}

async function solveBacktracking() {
    if (conflicts.size > 0) {
        return;
    }
    beforeSolveBoard = copyBoard(board);
    solvedSquares = new Set();
    let index = 0;
    let stack = [];
    squaresChecked = 0;
    inSolve = true;
    while (board[getY(index)][getX(index)] != 0) {
        index++;
    }
    stack.push(getValidNumbers(getX(index), getY(index)));
    while (stack.size != 0 && index < 81 && inSolve == true) {
        updateCanvas();
        let tuple = stack[stack.length-1];
        if (tuple[1].size == 0) {
            board[getY(tuple[0])][getX(tuple[0])] = 0;
            solvedSquares.delete(tuple[0]);
            stack.pop();
            index = stack[stack.length-1][0];
        } else {
            index = tuple[0];
            let num = tuple[1].values().next().value;
            tuple[1].delete(num);
            board[getY(index)][getX(index)] = num;

            solvedSquares.add(index);

            while (index < 81 && board[getY(index)][getX(index)] != 0) {
                index++;
            }

            if (index < 81) {
                stack.push(getValidNumbers(getX(index), getY(index)));
                squaresChecked += 1;
            }
        }
        await sleep(sleepTime);
        updateCanvas();
    }
    console.log(squaresChecked);
}

async function solveLogical() {
    
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
            if (board[j][i] != 0) {
                drawNumber(board[j][i], i, j);
            }
        }
    }
}

function drawNumber(number, x, y) {
    ctx.fillStyle = 'black';
    ctx.font = '48px Lato';
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
    ctx.lineWidth = '1';
    drawVerticalLine(3 * SQUARE_SIZE);
    drawVerticalLine(6 * SQUARE_SIZE);

    drawHorizontalLine(3 * SQUARE_SIZE);
    drawHorizontalLine(6 * SQUARE_SIZE);

}

function setBacktracking() {
    solveStyle = "Backtracking";
    document.getElementById('logicalButton').style.backgroundColor = 'rgb(17, 81, 199)';
    document.getElementById('backtrackingButton').style.backgroundColor = "rgb(30, 185, 113)";
}

function setLogical() {
    solveStyle = "Logical";
    document.getElementById('backtrackingButton').style.backgroundColor = 'rgb(17, 81, 199)';
    document.getElementById('logicalButton').style.backgroundColor = "rgb(30, 185, 113)";
}

function toggleDifficulty() {
    if (difficulty == "Easy") {
        difficulty = "Medium";
    } else if (difficulty == "Medium") {
        difficulty = "Hard";
    } else if (difficulty == "Hard") {
        difficulty = "Easy";
    } else {
        difficulty = "Easy";
    }
    updateCanvas();
}

function boardEquals(a, b){
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (a[i][j] != b[i][j]) {
                return false;
            }
        }
    }
    return true;
}

function copyBoard(b) {
    let newBoard = []
    for (let i = 0; i < 9; i++) {
        let row = b[i].slice();
        newBoard.push(row)
    }
    return newBoard;
}


function setRandomPuzzle() {
    inSolve = false;
    board = copyBoard(getBoard());
    beforeSolveBoard = copyBoard(emptyBoard);
    squaresChecked = 0;
    solvedSquares = new Set();
    conflicts = new Set();
    updateCanvas();
}

function getBoard() {
    if (difficulty == "Easy") {
        return getRandomFromBoard(easyBoards);
    } else if (difficulty == "Medium") {
        return getRandomFromBoard(mediumBoards);
    } else if (difficulty == "Hard") {
        return getRandomFromBoard(hardBoards);
    } else {
        return easyBoards[0];
    }
}

function getRandomFromBoard(board) {
    idx = Math.floor(Math.random() * board.length);
    while (idx == currBoard) {
        idx = Math.floor(Math.random() * board.length);
    }
    currBoard = idx;
    return board[idx];
}

function setPresetBoards() {
    easyBoards =
    [
    [[5, 0, 0, 4, 0, 7, 9, 0, 3],
    [0, 0, 2, 0, 1, 0, 0, 8, 7],
    [1, 0, 0, 6, 8, 0, 0, 0, 4],
    [8, 0, 0, 3, 0, 0, 7, 0, 0],
    [0, 2, 6, 0, 0, 1, 3, 4, 5],
    [4, 7, 0, 0, 5, 0, 0, 0, 0],
    [0, 0, 0, 0, 3, 2, 4, 0, 9],
    [0, 3, 0, 0, 0, 8, 0, 6, 2],
    [0, 0, 9, 7, 6, 0, 5, 0, 8]],

    [[0, 3, 0, 0, 0, 0, 5, 0, 0],
    [0, 0, 0, 0, 3, 7, 0, 0, 1],
    [7, 0, 2, 1, 6, 0, 0, 0, 0],
    [0, 1, 7, 5, 9, 6, 0, 3, 8],
    [0, 0, 0, 2, 0, 0, 0, 4, 5],
    [5, 2, 8, 0, 7, 4, 0, 1, 9],
    [3, 0, 5, 0, 0, 9, 1, 0, 0],
    [0, 7, 4, 0, 0, 0, 9, 0, 2],
    [0, 0, 0, 6, 0, 0, 0, 0, 7]],

    [[0, 0, 0, 0, 1, 5, 3, 7, 0],
    [0, 5, 8, 7, 0, 3, 4, 0, 0],
    [3, 4, 7, 0, 2, 8, 0, 0, 0],
    [5, 1, 0, 6, 7, 0, 0, 0, 4],
    [6, 0, 0, 8, 0, 0, 0, 5, 7],
    [8, 0, 0, 0, 0, 9, 0, 1, 0],
    [4, 6, 9, 0, 0, 0, 0, 0, 2],
    [0, 8, 1, 3, 0, 0, 0, 0, 0],
    [7, 3, 0, 2, 0, 0, 1, 9, 0]],

    [[3, 0, 0, 0, 9, 0, 8, 2, 0],
    [0, 1, 0, 6, 0, 0, 0, 0, 0],
    [0, 0, 0, 4, 3, 0, 0, 7, 6],
    [0, 9, 1, 0, 0, 0, 6, 4, 0],
    [0, 0, 0, 0, 2, 0, 0, 0, 8],
    [6, 0, 8, 9, 0, 0, 0, 0, 0],
    [7, 0, 6, 3, 0, 9, 2, 5, 4],
    [1, 2, 3, 5, 0, 8, 0, 6, 9],
    [0, 4, 0, 2, 0, 7, 0, 0, 0]],

    [[0, 0, 0, 3, 0, 1, 0, 6, 0],
    [0, 0, 0, 0, 0, 8, 0, 4, 2],
    [6, 3, 8, 4, 2, 5, 1, 9, 7],
    [3, 9, 4, 0, 7, 0, 0, 0, 0],
    [2, 0, 0, 1, 0, 0, 4, 7, 0],
    [0, 0, 0, 0, 0, 4, 0, 0, 6],
    [1, 2, 3, 9, 0, 0, 6, 8, 0],
    [0, 8, 9, 0, 0, 6, 0, 0, 4],
    [0, 4, 0, 0, 0, 0, 2, 1, 0]]
    
    ];

    mediumBoards =
    [
    [[0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 3, 1, 0, 0, 5, 0],
    [5, 1, 3, 0, 0, 0, 2, 4, 9],
    [0, 4, 9, 0, 5, 0, 0, 0, 1],
    [0, 8, 0, 0, 0, 1, 0, 0, 0],
    [6, 0, 1, 0, 0, 3, 4, 7, 0],
    [0, 7, 8, 0, 0, 0, 0, 2, 4],
    [4, 2, 0, 0, 9, 7, 0, 0, 0],
    [0, 0, 0, 0, 0, 4, 7, 0, 5]],

    [[0, 0, 2, 3, 7, 0, 0, 5, 0],
    [1, 0, 0, 0, 2, 9, 0, 0, 0],
    [0, 0, 4, 0, 6, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 4, 0, 0, 6],
    [6, 0, 0, 2, 5, 0, 0, 1, 8],
    [0, 2, 7, 0, 0, 0, 0, 0, 5],
    [4, 0, 0, 8, 3, 0, 5, 0, 1],
    [0, 0, 0, 0, 0, 0, 9, 0, 0],
    [7, 5, 0, 0, 0, 0, 0, 4, 2]],

    [[0, 6, 0, 0, 0, 0, 0, 0, 0],
    [3, 8, 1, 6, 0, 0, 7, 0, 0],
    [0, 0, 9, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 9, 0, 2, 8, 0, 3],
    [2, 0, 0, 3, 0, 4, 0, 6, 0],
    [0, 0, 0, 0, 8, 5, 0, 2, 4],
    [0, 1, 0, 0, 9, 0, 2, 0, 0],
    [0, 0, 0, 2, 0, 0, 0, 4, 7],
    [8, 0, 0, 7, 0, 3, 0, 0, 1]],

    [[0, 0, 0, 1, 0, 5, 9, 8, 4],
    [8, 0, 3, 0, 0, 6, 0, 0, 7],
    [0, 9, 0, 0, 2, 8, 0, 1, 0],
    [0, 0, 5, 6, 0, 0, 8, 0, 0],
    [0, 0, 0, 0, 1, 2, 0, 0, 0],
    [2, 4, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 6, 0, 3, 0, 0],
    [7, 3, 0, 0, 8, 0, 0, 0, 9],
    [9, 0, 2, 4, 0, 0, 0, 0, 0]],

    [[2, 0, 0, 0, 0, 8, 0, 0, 0],
    [0, 9, 0, 0, 4, 0, 0, 8, 7],
    [8, 0, 0, 0, 0, 7, 0, 5, 4],
    [0, 1, 0, 6, 8, 0, 0, 0, 0],
    [9, 0, 0, 7, 0, 0, 1, 0, 0],
    [0, 0, 4, 0, 1, 0, 5, 3, 0],
    [0, 0, 1, 0, 2, 0, 0, 0, 0],
    [4, 0, 0, 8, 0, 1, 0, 0, 6],
    [0, 0, 6, 4, 0, 3, 8, 0, 0]]
    
    ];

    hardBoards =
    [
    [[5, 0, 0, 0, 0, 8, 0, 0, 0],
    [0, 0, 0, 7, 0, 0, 2, 0, 0],
    [4, 0, 9, 0, 1, 0, 0, 7, 0],
    [9, 0, 3, 0, 0, 4, 6, 0, 0],
    [0, 5, 0, 0, 0, 0, 0, 9, 0],
    [0, 2, 0, 0, 3, 0, 0, 0, 0],
    [7, 0, 1, 0, 4, 0, 0, 2, 0],
    [0, 0, 0, 0, 0, 6, 0, 0, 8],
    [0, 3, 0, 0, 0, 0, 0, 0, 0]],

    [[0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]],

    [[7, 0, 6, 9, 0, 3, 0, 0, 4],
    [0, 3, 0, 0, 8, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 0, 0, 9, 0],
    [0, 0, 4, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 0],
    [0, 6, 0, 5, 0, 7, 0, 8, 0],
    [5, 0, 0, 0, 0, 0, 0, 0, 8],
    [0, 0, 0, 2, 0, 0, 0, 0, 0],
    [0, 7, 0, 6, 0, 9, 0, 5, 0]],

    [[0, 0, 1, 6, 2, 0, 0, 5, 7],
    [0, 0, 0, 0, 0, 0, 0, 0, 9],
    [0, 4, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 6, 0, 4, 0, 0],
    [0, 3, 0, 0, 0, 7, 0, 6, 5],
    [0, 0, 5, 0, 0, 0, 9, 0, 0],
    [0, 0, 0, 0, 0, 0, 6, 0, 0],
    [8, 0, 0, 0, 0, 3, 0, 0, 0],
    [0, 0, 4, 0, 7, 0, 0, 2, 1]],

    [[0, 4, 0, 9, 0, 0, 2, 0, 0],
    [0, 6, 0, 0, 0, 5, 0, 0, 0],
    [2, 0, 5, 0, 8, 0, 0, 0, 7],
    [0, 0, 6, 0, 0, 0, 0, 0, 0],
    [5, 0, 7, 0, 0, 1, 9, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 1, 0],
    [0, 0, 0, 3, 0, 0, 0, 0, 8],
    [0, 2, 0, 0, 0, 0, 0, 0, 0],
    [9, 0, 1, 0, 0, 4, 7, 0, 0]]
    ];
}