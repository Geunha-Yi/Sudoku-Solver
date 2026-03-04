/**
 * 랜덤 스도쿠 퍼즐 생성
 * 완전히 풀린 보드에서 랜덤하게 숫자를 제거해 퍼즐을 만듭니다.
 */

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 기본 완성형 스도쿠 (변형의 시드) */
const BASE = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9, 1],
  [5, 6, 7, 8, 9, 1, 2, 3, 4],
  [8, 9, 1, 2, 3, 4, 5, 6, 7],
  [3, 4, 5, 6, 7, 8, 9, 1, 2],
  [6, 7, 8, 9, 1, 2, 3, 4, 5],
  [9, 1, 2, 3, 4, 5, 6, 7, 8],
]

function swapRows(board, r1, r2) {
  ;[board[r1], board[r2]] = [board[r2], board[r1]]
}
function swapCols(board, c1, c2) {
  for (let r = 0; r < 9; r++) {
    ;[board[r][c1], board[r][c2]] = [board[r][c2], board[r][c1]]
  }
}
function swapBands(board, b1, b2) {
  for (let i = 0; i < 3; i++) {
    swapRows(board, b1 * 3 + i, b2 * 3 + i)
  }
}
function swapStacks(board, s1, s2) {
  for (let i = 0; i < 3; i++) {
    swapCols(board, s1 * 3 + i, s2 * 3 + i)
  }
}
function permuteNumbers(board, perm) {
  const next = [...board.map(row => [...row])]
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      next[r][c] = perm[next[r][c] - 1]
    }
  }
  return next
}

/** 완전히 풀린 랜덤 스도쿠 생성 */
export function generateCompleteBoard() {
  let board = BASE.map(row => [...row])
  const perm = shuffle(DIGITS)
  board = permuteNumbers(board, perm)
  const bandOrder = shuffle([0, 1, 2])
  swapBands(board, bandOrder[0], bandOrder[1])
  swapBands(board, bandOrder[1], bandOrder[2])
  const stackOrder = shuffle([0, 1, 2])
  swapStacks(board, stackOrder[0], stackOrder[1])
  swapStacks(board, stackOrder[1], stackOrder[2])
  for (let b = 0; b < 3; b++) {
    const rowOrder = shuffle([0, 1, 2])
    swapRows(board, b * 3 + rowOrder[0], b * 3 + rowOrder[1])
    swapRows(board, b * 3 + rowOrder[1], b * 3 + rowOrder[2])
  }
  for (let s = 0; s < 3; s++) {
    const colOrder = shuffle([0, 1, 2])
    swapCols(board, s * 3 + colOrder[0], s * 3 + colOrder[1])
    swapCols(board, s * 3 + colOrder[1], s * 3 + colOrder[2])
  }
  return board
}

function getBox(r, c) {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3)
}

/**
 * 행·열·박스 각각에 최소 1개 빈 칸이 있도록 하는 9칸 패턴
 */
function getTransversal() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(r => {
    const c = (r % 3) * 3 + Math.floor(r / 3)
    return [r, c]
  })
}

/**
 * 제거 가능한 셀 중에서, 현재 제거 수가 가장 적은 행/열/박스에 속한 셀을 우선 선택
 * → 전 영역에 골고루 빈 칸 분배
 */
function pickBalancedCell(toRemove, rowRemoved, colRemoved, boxRemoved) {
  let bestScore = -1
  const candidates = []

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c
      if (toRemove.has(idx)) continue
      if (rowRemoved[r] >= 8 || colRemoved[c] >= 8 || boxRemoved[getBox(r, c)] >= 8) continue

      const rowNeed = 8 - rowRemoved[r]
      const colNeed = 8 - colRemoved[c]
      const boxNeed = 8 - boxRemoved[getBox(r, c)]
      const score = rowRemoved[r] + colRemoved[c] + boxRemoved[getBox(r, c)]

      if (bestScore < 0 || score <= bestScore) {
        if (score < bestScore) candidates.length = 0
        bestScore = score
        candidates.push([r, c])
      }
    }
  }

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * 퍼즐 생성 - 전 영역에 골고루 빈 칸 분배, 모든 행·열·박스에 최소 1개 빈 칸
 */
export function generatePuzzle(keepCount = 32) {
  const complete = generateCompleteBoard()
  const puzzle = complete.map(row => [...row])

  const removeCount = 81 - Math.min(45, Math.max(25, keepCount))
  const rowRemoved = Array(9).fill(0)
  const colRemoved = Array(9).fill(0)
  const boxRemoved = Array(9).fill(0)
  const toRemove = new Set()

  for (const [r, c] of getTransversal()) {
    toRemove.add(r * 9 + c)
    rowRemoved[r]++
    colRemoved[c]++
    boxRemoved[getBox(r, c)]++
  }

  let added = 9
  while (added < removeCount) {
    const cell = pickBalancedCell(toRemove, rowRemoved, colRemoved, boxRemoved)
    if (!cell) break
    const [r, c] = cell
    toRemove.add(r * 9 + c)
    rowRemoved[r]++
    colRemoved[c]++
    boxRemoved[getBox(r, c)]++
    added++
  }

  for (const idx of toRemove) {
    puzzle[Math.floor(idx / 9)][idx % 9] = 0
  }
  return puzzle
}
