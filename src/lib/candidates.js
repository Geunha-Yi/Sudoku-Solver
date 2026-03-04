export const getBox = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

export function getBoxCells(box) {
  const br = Math.floor(box / 3) * 3, bc = (box % 3) * 3;
  return Array.from({ length: 9 }, (_, i) => [br + Math.floor(i / 3), bc + (i % 3)]);
}

export const getRowCells = r => [...Array(9)].map((_, c) => [r, c]);
export const getColCells = c => [...Array(9)].map((_, r) => [r, c]);

export function getPeers(r, c) {
  const peers = new Set();
  getRowCells(r).forEach(([rr, cc]) => peers.add(rr * 9 + cc));
  getColCells(c).forEach(([rr, cc]) => peers.add(rr * 9 + cc));
  getBoxCells(getBox(r, c)).forEach(([rr, cc]) => peers.add(rr * 9 + cc));
  peers.delete(r * 9 + c);
  return peers;
}

export function computeCandidates(board) {
  const candidates = Array(9).fill(null).map(() => Array(9).fill(null));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
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

export function copyBoard(board) {
  return board.map(row => [...row]);
}
