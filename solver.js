/**
 * 스도쿠 솔버 - 백트래킹 알고리즘
 */

/**
 * 특정 위치에 숫자가 유효한지 검사
 */
function isValid(board, row, col, num) {
  // 같은 행에 해당 숫자가 있는지 확인
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }

  // 같은 열에 해당 숫자가 있는지 확인
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }

  // 같은 3x3 박스에 해당 숫자가 있는지 확인
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

/**
 * 백트래킹으로 스도쿠 풀기
 */
function solveSudoku(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0; // 백트래킹
          }
        }
        return false; // 해결 불가능
      }
    }
  }
  return true; // 모든 칸이 채워짐
}

/**
 * 보드가 유효한 스도쿠인지 검사 (풀기 전 검증)
 */
function isBoardValid(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      if (num !== 0) {
        board[row][col] = 0;
        if (!isValid(board, row, col, num)) {
          board[row][col] = num;
          return false;
        }
        board[row][col] = num;
      }
    }
  }
  return true;
}

export { solveSudoku, isBoardValid, isValid };
