# Web Sudoku Solver Visualizer
Online Web-based application for solving sudoku puzzles and visualizing the solve in real time.

The solver feature 2 main solving algorithms, a brute-force DFS + backtracking algorithm, and one that applies human sudoku solving techniques to solve easy squares before applying backtracking.
For easy Sudokus, backtracking works fine, but the time complexity grows exponentially relative to the number of empty squares and could get rather expensive for hard Sudokus.
The logical approach, which uses human techniques like naked and hidden singles, eliminates most of the easy squares which can significantly reduce time spent on hard Sudokus.

The board can also be edited by clicking on a cell and typing in a number, and a number can be removed with backspace.

Built using Javascript, HTML, and CSS
