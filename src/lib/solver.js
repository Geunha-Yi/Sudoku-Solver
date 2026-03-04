export function isValid(board, row, col, num) {
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

export function solveSudoku(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      for (let n = 1; n <= 9; n++) {
        if (isValid(board, r, c, n)) {
          board[r][c] = n;
          if (solveSudoku(board)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

export function isBoardValid(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const n = board[r][c];
      if (n === 0) continue;
      board[r][c] = 0;
      if (!isValid(board, r, c, n)) {
        board[r][c] = n;
        return false;
      }
      board[r][c] = n;
    }
  }
  return true;
}
