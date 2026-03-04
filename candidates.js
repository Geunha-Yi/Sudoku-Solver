/**
 * 스도쿠 후보 숫자(Candidates) 관리
 * 각 빈 칸에 들어갈 수 있는 숫자들을 추적합니다.
 */

/** 행/열/박스 인덱스 유틸 */
const getBox = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
const getBoxCells = (box) => {
  const br = Math.floor(box / 3) * 3, bc = (box % 3) * 3;
  const cells = [];
  for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) cells.push([r, c]);
  return cells;
};
const getRowCells = (r) => [...Array(9)].map((_, c) => [r, c]);
const getColCells = (c) => [...Array(9)].map((_, r) => [r, c]);

function getPeers(r, c) {
  const peers = new Set();
  getRowCells(r).forEach(([rr, cc]) => peers.add(rr * 9 + cc));
  getColCells(c).forEach(([rr, cc]) => peers.add(rr * 9 + cc));
  getBoxCells(getBox(r, c)).forEach(([rr, cc]) => peers.add(rr * 9 + cc));
  peers.delete(r * 9 + c);
  return peers;
}

/**
 * 보드에서 각 셀의 후보 숫자 계산
 */
function computeCandidates(board) {
  const candidates = Array(9).fill(null).map(() => Array(9).fill(null));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) {
        candidates[r][c] = null;
        continue;
      }
      const used = new Set();
      getPeers(r, c).forEach(idx => {
        const v = board[Math.floor(idx / 9)][idx % 9];
        if (v) used.add(v);
      });
      candidates[r][c] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n)));
    }
  }
  return candidates;
}

/**
 * 보드 복사
 */
function copyBoard(board) {
  return board.map(row => [...row]);
}

/**
 * 후보 복사 (Set → 새 Set)
 */
function copyCandidates(cands) {
  return cands.map(row => row.map(s => s ? new Set(s) : null));
}

export { computeCandidates, copyBoard, copyCandidates, getBox, getBoxCells, getRowCells, getColCells, getPeers };
