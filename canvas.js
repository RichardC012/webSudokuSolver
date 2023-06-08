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
var logicalDFSBoard;

var solvedSquares = new Set();
var btSquares = new Set();
var originalSquares = new Set();
var conflicts = new Set();

const CANVAS_SIZE = 600;
const SQUARE_SIZE = CANVAS_SIZE/9;
const LIGHT_BLUE = 'rgba(84, 194, 237, 0.2)';
const DARK_BLUE = 'rgba(50, 100, 210, 0.3)';
const LIGHT_RED = 'rgba(255, 0, 0, 0.5)';
const LIGHTER_RED = 'rgba(200, 0, 0, 0.2)';
const LIGHT_GREEN = 'rgba(0, 200, 0, 0.2)';
const YELLOW = 'rgba(255, 247, 0, 0.2)';
const LIGHT_GREY = '#BBBBBB';
const DARK_GREY = '#888888';
var sleepTime = 0.05;
var speed = "Slow";
var inSolve = false;
var solvingLogical = false;
var squaresChecked = 0;
var difficulty = "Easy";
var solveStyle = "Backtracking";
var currentAlgorithm = "Backtracking"

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

var canvasLeft = canvas.offsetLeft + canvas.clientLeft;
var canvasTop = canvas.offsetTop + canvas.clientTop;

var selected = {
    x: -1,
    y: -1,
}

startup();

function startup() {
    setPresetBoards();
    setBacktracking();
    startupDrawCanvas();
}

// Same as update canvas but without buttons because for some reason document.getElementById("#textButton") returns NULL and that disables canvas interactivity
function startupDrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawConflicts();
    drawSqaures(solvedSquares, LIGHT_GREEN);
    drawGrid();
    if (selected.x != -1 && selected.y != -1) {
        drawSquares(selected.x, selected.y);
    }
    if (!solvingLogical) {
        drawNumbers(board);
    } else {
        drawLogicalNumbers();
    }
}

// ####### CANVAS INTERACTION AND DRAWING #######

canvas.addEventListener('click', function(event) {
    let xClicked = Math.floor((event.pageX - canvasLeft)/SQUARE_SIZE);
    let yClicked = Math.floor((event.pageY - canvasTop)/SQUARE_SIZE);
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

function resetBoard() {
    selected.x, selected.y = -1, -1;
    inSolve = false;
    solvingLogical = false;
    if (boardEquals(board, beforeSolveBoard)) {
        board = copyBoard(emptyBoard);
        beforeSolveBoard = copyBoard(emptyBoard);
    } else {
        board = copyBoard(beforeSolveBoard);
    }
    conflicts = new Set();
    solvedSquares = new Set();
    btSquares = new Set();
    squaresChecked = 0;
    updateCanvas();
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawConflicts();
    drawSqaures(solvedSquares, LIGHT_GREEN);
    drawSqaures(btSquares, YELLOW);
    drawGrid();
    if (selected.x != -1 && selected.y != -1) {
        drawSquares(selected.x, selected.y);
    }
    if (!solvingLogical) {
        drawNumbers(board);
    } else {
        drawLogicalNumbers();
    }
    updateButtons();
}

function updateLDFSCanvas(dfsSquares) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawSqaures(dfsSquares, YELLOW);
    drawSqaures(solvedSquares, LIGHT_GREEN);
    drawGrid();
    if (selected.x != -1 && selected.y != -1) {
        drawSquares(selected.x, selected.y);
    }
    drawNumbers(logicalDFSBoard);
    updateButtons();
}

function updateButtons() {
    document.getElementById('textButton').innerText = "Squares Checked: " + squaresChecked;
    document.getElementById('algoButton').innerText = "Current Algorithm: " + currentAlgorithm;
    document.getElementById('diffButton').innerText = "Difficulty: " + difficulty;
    document.getElementById('speedButton').innerText = "Speed: " + speed;
}

// ###### SOLVING FUNCTIONS ######

function solveSudoku() {
    selected.x, selected.y = -1, -1;
    if (solveStyle == "Backtracking") {
        solveBacktracking();
    } else if (solveStyle == "Logical") {
        solveLogical();
    }
}

async function solveBacktracking() {
    if (conflicts.size > 0) {
        return;
    }
    beforeSolveBoard = copyBoard(board);
    btSquares = new Set();
    solvedSquares = new Set();
    let index = 0;
    let stack = [];
    squaresChecked = 0;
    inSolve = true;
    currentAlgorithm = "Backtracking";
    while (board[getY(index)][getX(index)] != 0) {
        index++;
    }
    stack.push(getValidNumbers(getX(index), getY(index), board));
    while (stack.size != 0 && index < 81 && inSolve == true) {
        updateCanvas();
        let tuple = stack[stack.length-1];
        if (tuple[1].size == 0) {
            board[getY(tuple[0])][getX(tuple[0])] = 0;
            btSquares.delete(tuple[0]);
            stack.pop();
            index = stack[stack.length-1][0];
        } else {
            index = tuple[0];
            let num = tuple[1].values().next().value;
            tuple[1].delete(num);
            board[getY(index)][getX(index)] = num;

            btSquares.add(index);

            while (index < 81 && board[getY(index)][getX(index)] != 0) {
                index++;
            }

            if (index < 81) {
                stack.push(getValidNumbers(getX(index), getY(index), board));
            }
        }
        await sleep(sleepTime);
        updateCanvas();
    }
    console.log(squaresChecked);
    solvedSquares = btSquares;
    btSquares = new Set();
    updateCanvas();
}

async function solveLogical() {
    beforeSolveBoard = copyBoard(board);
    logicalBoard = [];
    solvedSquares = new Set();
    originalSquares = new Set();
    squaresChecked = 0;
    inSolve = true;
    solvingLogical = true;
    for (let i = 0; i < 9; i ++) {
        rowArr = [];
        let validNumSet;
        for (let j = 0; j < 9; j++) {
            if (inSolve == false) {
                return;
            }
            if (board[i][j] == 0) {
                validNumSet = getValidNumbers(j,i, board)[1];
                if (validNumSet.size == 1) {
                    solvedSquares.add(i * 9 + j);
                    board[i][j] = validNumSet.values().next().value;
                }
            } else {
                originalSquares.add(i * 9 + j);
                validNumSet = new Set();
                validNumSet.add(board[i][j]);
            }
            rowArr.push(validNumSet);
            
            if(solvedSquares.has(i * 9 + j)) {
                drawNumber(validNumSet.values().next().value, j, i);
                drawSquare(LIGHT_GREEN, j, i);
            } else if (!originalSquares.has(i * 9 + j)) {
                drawSmallNumber(validNumSet, i * 9 + j);
            }
            document.querySelector('#textButton').innerHTML = "Squares Checked: " + squaresChecked;
            await sleep(sleepTime);
        }
        logicalBoard.push(rowArr);
    }
    
    for (let index of solvedSquares) {
        if (inSolve == false) {
            return;
        }
        updateCanvas()
        eliminateNum(logicalBoard[getY(index)][getX(index)].values().next().value, getX(index), getY(index));
        await sleep(sleepTime * 10);
    }

    for (let i = 0; i < 20; i++) {
        if (inSolve == false) {
            updateCanvas();
            return;
        }
        let numbersSolved = solvedSquares.size;
        await findNakedSingles();
        await findHiddenSingles();
        findPointingPairs();
        findNakedDoubles();
        if (solvedLogical()) {
            await findNakedSingles();
            updateCanvas();
            inSolve = false;
            solvingLogical = false;
            return;
        }
        if (numbersSolved == solvedSquares.size) {
            break;
        }
    }

    logicalDFS();
    updateCanvas();
}

async function findNakedSingles() {
    currentAlgorithm = "Naked Singles";
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            index = i * 9 + j;
            if (!solvedSquares.has(index) && !originalSquares.has(index) && inSolve == true) {
                if (logicalBoard[i][j].size == 1) {
                    solvedSquares.add(index);
                    board[i][j] = logicalBoard[i][j].values().next().value;
                    updateCanvas();
                    eliminateNum(logicalBoard[i][j].values().next().value, j, i);
                    await sleep(sleepTime * 10);
                }
            }
        }
    }
}

async function findHiddenSingles() {
    // Check every Row
    currentAlgorithm = "Hidden Singles";
    for (let i = 0; i < 9; i++) {
        singleMap = new Map();
        highlightRow(i, DARK_BLUE);
        await sleep(sleepTime * 10);
        updateCanvas();
        for (let j = 0; j < 9; j++) {
            let index = i * 9 + j;
            if (!solvedSquares.has(index) && !originalSquares.has(index) && inSolve == true) {
                squaresChecked++;
                for (let num of logicalBoard[i][j]) {
                    if (!singleMap.has(num)) {
                        singleMap.set(num, j);
                    } else {
                        singleMap.set(num, -1);
                    }
                }
            }
        }
        const numIterator = singleMap[Symbol.iterator]();
        for (const item of numIterator) {
            let index = i * 9 + item[1];
            if (item[1] != -1 && !solvedSquares.has(index) && !originalSquares.has(index) && inSolve == true) {
                if (inSolve == false) {
                    return;
                }
                let j = item[1];
                let newSet = new Set();
                newSet.add(item[0]);
                logicalBoard[i][j] = newSet;
                solvedSquares.add(i * 9 + j);
                board[i][j] = item[0];
                
                updateCanvas();
                highlightRow(i, DARK_BLUE);
                await sleep(sleepTime * 10);

                if (inSolve == false) {
                    updateCanvas();
                    return;
                }

                updateCanvas()
                eliminateNum(item[0], j, i);
                await sleep(sleepTime * 10);
                updateCanvas();
            }
        }
    }
    
    // Check every Column
    for (let j = 0; j < 9; j++) {
        singleMap = new Map();
        highlightColumn(j, DARK_BLUE);
        await sleep(sleepTime * 10);
        updateCanvas();
        for (let i = 0; i < 9; i++) {
            let index = i * 9 + j;
            if (!solvedSquares.has(index) && !originalSquares.has(index) && inSolve == true) {
                squaresChecked++;
                for (let num of logicalBoard[i][j]) {
                    if (!singleMap.has(num)) {
                        singleMap.set(num, i);
                    } else {
                        singleMap.set(num, -1);
                    }
                }
            }
        }
        const numIterator = singleMap[Symbol.iterator]();
        for (const item of numIterator) {
            let index = item[1] * 9 + j;
            if (item[1] != -1 && !solvedSquares.has(index) && !originalSquares.has(index) && inSolve == true) {
                if (inSolve == false) {
                    return;
                }
                let i = item[1];
                let newSet = new Set();
                newSet.add(item[0]);
                logicalBoard[i][j] = newSet;
                solvedSquares.add(i * 9 + j);
                
                updateCanvas();
                highlightColumn(j, DARK_BLUE);
                await sleep(sleepTime * 10);

                if (inSolve == false) {
                    updateCanvas();
                    return;
                }

                updateCanvas()
                eliminateNum(item[0], j, i);
                await sleep(sleepTime * 10);
                updateCanvas();
            }
        }
    }
}

async function findPointingPairs() {

}

async function findNakedDoubles() {

}

async function logicalDFS() {
    currentAlgorithm = "Elimination";
    let dfsSquares = new Set();
    let index = 0;
    let stack = [];
    initializeDFSBoard();
    while (logicalDFSBoard[getY(index)][getX(index)] != 0) {
        index++;
    }
    stack.push(getValidNumbers(getX(index),getY(index), logicalDFSBoard));
    while (stack.size != 0 && index < 81 && inSolve == true) {
        updateLDFSCanvas(dfsSquares);
        let tuple = stack[stack.length-1];
        if (tuple[1].size == 0) {
            logicalDFSBoard[getY(tuple[0])][getX(tuple[0])] = 0;
            dfsSquares.delete(tuple[0]);
            stack.pop();
            index = stack[stack.length-1][0];
        } else {
            index = tuple[0];
            let num = tuple[1].values().next().value;
            tuple[1].delete(num);
            logicalDFSBoard[getY(index)][getX(index)] = num;

            dfsSquares.add(index);

            while (index < 81 && logicalDFSBoard[getY(index)][getX(index)] != 0) {
                index++;
            }

            if (index < 81) {
                stack.push(getValidNumbers(getX(index),getY(index), logicalDFSBoard));
            }
        }
        await sleep(sleepTime);
        updateLDFSCanvas(dfsSquares);
    }
    console.log(squaresChecked);
    board = copyBoard(logicalDFSBoard);
    inSolve = false;
    solvingLogical = false;
}

function initializeDFSBoard() {
    logicalDFSBoard = copyBoard(emptyBoard);
    for (let index of solvedSquares) {
        logicalDFSBoard[getY(index)][getX(index)] = logicalBoard[getY(index)][getX(index)].values().next().value;
    }
    for (let index of originalSquares) {
        logicalDFSBoard[getY(index)][getX(index)] = logicalBoard[getY(index)][getX(index)].values().next().value;
    }
}

function solvedLogical() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (logicalBoard[i][j].size >= 2) {
                return false;
            }
        }
    }
    return true;
}

function eliminateNum(number, x, y) {
    squaresChecked++;
    for (let i = 0; i < 9; i++) {
        // Checks the column
        if (i < Math.floor(y/3) * 3 || i >= Math.floor(y/3) * 3 + 3) {
            if (y != i) {
                logicalBoard[i][x].delete(number);
                drawThickOutline(LIGHTER_RED, x, i);
            }
        }
        // Checks the row
        if (i < Math.floor(x/3) * 3 || i >= Math.floor(x/3) * 3 + 3) {
            if (x != i) {
                logicalBoard[y][i].delete(number);
                drawThickOutline(LIGHTER_RED, i, y);
            }
        }
    }

    let xFloor = Math.floor(x/3) * 3;
    let yFloor = Math.floor(y/3) * 3;
    // Checks the square
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if ((y != (yFloor + j) || x != (xFloor + i))) {
                logicalBoard[yFloor + j][xFloor + i].delete(number);
                drawOutline(LIGHTER_RED, xFloor + i, yFloor + j);
            }
        }
    }
}

async function sleep(seconds) {
    if (sleepTime >= 0) {
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
    
}

// returns a tuple [index, set]
function getValidNumbers(x, y, b) {
    squaresChecked++;
    const newSet = new Set([1,2,3,4,5,6,7,8,9]);
    
    for (let i = 0; i < 9; i++) {
        newSet.delete(b[y][i]);
        newSet.delete(b[i][x]);
    }

    let xFloor = Math.floor(x/3) * 3;
    let yFloor = Math.floor(y/3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            newSet.delete(b[yFloor + j][xFloor + i]);
        }
    }
    return [x + y * 9, newSet];
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

function getX(index) {
    return index % 9;
}

function getY(index) {
    return Math.floor(index/9);
}

// ###### DRAW FUNCTIONS ######

function highlightRow(rowNum, color) {
    for (let i = 0; i < 9; i++) {
        drawThickOutline(color, i, rowNum);
    }
}

function highlightColumn(colNum, color) {
    for (let i = 0; i < 9; i++) {
        drawThickOutline(color, colNum, i);
    }
}

function drawLogicalNumbers() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if(solvedSquares.has(i * 9 + j)) {
                drawNumber(logicalBoard[i][j].values().next().value, j, i);
            } else if (originalSquares.has(i * 9 + j)) {
                drawNumber(logicalBoard[i][j].values().next().value, j, i);
            } else {
                drawSmallNumber(logicalBoard[i][j], i * 9 + j);
            }
        }
    }
}

function drawSmallNumber(numset, index) {
    ctx.fillStyle = DARK_GREY;
    ctx.font = 'bold 23px Lato';
    for (number of numset) {
        let xPos = SQUARE_SIZE * (getX(index) + 0.32 * ((number - 1) % 3) + 0.07);
        let yPos = SQUARE_SIZE * (getY(index) + 0.30 * (Math.floor((number - 1)/3) + 1.08));
        ctx.fillText(number.toString(), xPos, yPos);
    }
}

function drawConflicts() {
    for (const index of conflicts) {
        drawOutline(LIGHT_RED, getX(index), getY(index));
    }
}

function drawNumbers(drawboard) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (drawboard[j][i] != 0) {
                drawNumber(drawboard[j][i], i, j);
            }
        }
    }
}

function drawNumber(number, x, y) {
    ctx.fillStyle = 'black';
    ctx.font = '48px Lato';
    ctx.fillText(number.toString(), SQUARE_SIZE * (x + 0.31), SQUARE_SIZE * (y + 0.75));
}

function drawSqaures(squares, color) {
    for (index of squares) {
        drawSquare(color, getX(index), getY(index));
    }
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

function drawThickOutline(color, x, y) {
    ctx.strokeStyle = color;
    ctx.lineWidth = '6';
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

// ###### BUTTON FUNCTIONALITY ######

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
    updateButtons();
    
}

function toggleSpeed() {

    if (speed == "Slow") {
        speed = "Medium";
        sleepTime = 0.02;
    } else if (speed == "Medium") {
        speed = "Fast";
        sleepTime = 0.001;
    } else if (speed == "Fast") {
        speed = "Instant";
        sleepTime = -1;
    } else if (speed == "Instant") {
        speed = "Slow";
        sleepTime = 0.05;
    } else {
        speed = "Slow";
        sleepTime = 0.05;
    }
    updateButtons();
}

function setRandomPuzzle() {
    inSolve = false;
    solvingLogical = false;
    resetBoard();
    resetBoard();
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
    selected.x, selected.y = -1, -1;
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

    [[9, 3, 0, 0, 0, 0, 5, 0, 0],
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