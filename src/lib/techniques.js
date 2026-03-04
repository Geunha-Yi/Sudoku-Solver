/**
 * Sudoku Techniques Module - Complete implementation of solving techniques
 */
import { getBox, getBoxCells, getRowCells, getColCells, getPeers } from './candidates.js';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const RC = (r, c) => r * 9 + c;

/** Returns null if cell is filled, else Set of candidates */
export function getCandidates(board, candidates, r, c) {
  if (board[r][c] !== 0) return null;
  if (candidates) {
    const cands = candidates[r]?.[c];
    return cands ? new Set(cands) : null;
  }
  const used = new Set();
  getPeers(r, c).forEach(idx => {
    const v = board[Math.floor(idx / 9)][idx % 9];
    if (v) used.add(v);
  });
  return new Set(DIGITS.filter(n => !used.has(n)));
}

// ─── Basic ───────────────────────────────────────────────────────────────

function full_unit(board, candidates) {
  const units = [];
  for (let i = 0; i < 9; i++) {
    units.push({ cells: getRowCells(i), name: `행 ${i + 1}` });
    units.push({ cells: getColCells(i), name: `열 ${i + 1}` });
    units.push({ cells: getBoxCells(i), name: `박스 ${i + 1}` });
  }
  for (const { cells, name } of units) {
    const empty = cells.filter(([r, c]) => board[r][c] === 0);
    if (empty.length !== 1) continue;
    const [r, c] = empty[0];
    const used = new Set(cells.map(([rr, cc]) => board[rr][cc]).filter(Boolean));
    const digit = DIGITS.find(n => !used.has(n));
    if (!digit) continue;
    return {
      techniqueId: 'full_unit',
      techniqueName: '가득찬 유닛',
      description: `${name}에서 8칸이 채워져 (${r + 1},${c + 1})에 ${digit}을 넣습니다.`,
      action: 'place',
      place: { row: r, col: c, digit },
      highlights: [{ r, c, type: 'place', digit }],
    };
  }
  return null;
}

function naked_single(board, candidates) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 1) {
        const digit = [...cands][0];
        return {
          techniqueId: 'naked_single',
          techniqueName: 'Naked Single',
          description: `셀 (${r + 1},${c + 1})에 ${digit}만 남아 있습니다.`,
          action: 'place',
          place: { r, c, digit },
          highlights: [{ r, c, digit }],
        };
      }
    }
  }
  return null;
}

function _hidden_single_in_unit(board, candidates, cells, unitName) {
  for (const digit of DIGITS) {
    const poss = cells.filter(([r, c]) => {
      const cands = getCandidates(board, candidates, r, c);
      return cands && cands.has(digit);
    });
    if (poss.length === 1) {
      const [r, c] = poss[0];
      return { r, c, digit, unitName };
    }
  }
  return null;
}

function hidden_single(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const r = _hidden_single_in_unit(board, candidates, getBoxCells(box), `박스 ${box + 1}`);
    if (r) return {
      techniqueId: 'hidden_single',
      techniqueName: 'Hidden Single (Box)',
      description: `박스에서 ${r.digit}가 (${r.r + 1},${r.c + 1})에만 가능합니다.`,
      action: 'place',
      place: { r: r.r, c: r.c, digit: r.digit },
      highlights: [{ r: r.r, c: r.c, digit: r.digit }],
    };
  }
  for (let r = 0; r < 9; r++) {
    const res = _hidden_single_in_unit(board, candidates, getRowCells(r), `행 ${r + 1}`);
    if (res) return {
      techniqueId: 'hidden_single',
      techniqueName: 'Hidden Single (Row)',
      description: `행 ${r + 1}에서 ${res.digit}가 (${res.r + 1},${res.c + 1})에만 가능합니다.`,
      action: 'place',
      place: { r: res.r, c: res.c, digit: res.digit },
      highlights: [{ r: res.r, c: res.c, digit: res.digit }],
    };
  }
  for (let c = 0; c < 9; c++) {
    const res = _hidden_single_in_unit(board, candidates, getColCells(c), `열 ${c + 1}`);
    if (res) return {
      techniqueId: 'hidden_single',
      techniqueName: 'Hidden Single (Col)',
      description: `열 ${c + 1}에서 ${res.digit}가 (${res.r + 1},${res.c + 1})에만 가능합니다.`,
      action: 'place',
      place: { r: res.r, c: res.c, digit: res.digit },
      highlights: [{ r: res.r, c: res.c, digit: res.digit }],
    };
  }
  return null;
}

// ─── Elementary: Pointing & Claiming ──────────────────────────────────────

function pointing(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const cells = getBoxCells(box);
    for (const digit of DIGITS) {
      const poss = cells.filter(([r, c]) => {
        const cands = getCandidates(board, candidates, r, c);
        return cands && cands.has(digit);
      });
      if (poss.length < 2) continue;
      const rows = [...new Set(poss.map(([r]) => r))];
      const cols = [...new Set(poss.map(([, c]) => c))];
      if (rows.length === 1) {
        const row = rows[0];
        const elims = [];
        for (let c = 0; c < 9; c++) {
          if (poss.some(([, cc]) => cc === c)) continue;
          const cands = getCandidates(board, candidates, row, c);
          if (cands && cands.has(digit)) elims.push({ r: row, c, digit });
        }
        if (elims.length) return {
          techniqueId: 'pointing',
          techniqueName: 'Pointing',
          description: `박스 ${box + 1}에서 ${digit}가 행 ${row + 1}에만 있어, 행의 다른 칸에서 제거됩니다.`,
          action: 'eliminate',
          eliminations: elims,
          highlights: [...poss.map(([r, c]) => ({ r, c, digit })), ...elims.map(e => ({ r: e.r, c: e.c, digit }))],
        };
      }
      if (cols.length === 1) {
        const col = cols[0];
        const elims = [];
        for (let r = 0; r < 9; r++) {
          if (poss.some(([rr]) => rr === r)) continue;
          const cands = getCandidates(board, candidates, r, col);
          if (cands && cands.has(digit)) elims.push({ r, c: col, digit });
        }
        if (elims.length) return {
          techniqueId: 'pointing',
          techniqueName: 'Pointing',
          description: `박스 ${box + 1}에서 ${digit}가 열 ${col + 1}에만 있어, 열의 다른 칸에서 제거됩니다.`,
          action: 'eliminate',
          eliminations: elims,
          highlights: [...poss.map(([r, c]) => ({ r, c, digit })), ...elims.map(e => ({ r: e.r, c: e.c, digit }))],
        };
      }
    }
  }
  return null;
}

function claiming(board, candidates) {
  for (let r = 0; r < 9; r++) {
    const rowCells = getRowCells(r);
    for (const digit of DIGITS) {
      const poss = rowCells.filter(([rr, cc]) => {
        const cands = getCandidates(board, candidates, rr, cc);
        return cands && cands.has(digit);
      });
      if (poss.length < 2) continue;
      const boxes = [...new Set(poss.map(([rr, cc]) => getBox(rr, cc)))];
      if (boxes.length === 1) {
        const box = boxes[0];
        const boxCells = getBoxCells(box);
        const elims = [];
        for (const [rr, cc] of boxCells) {
          if (rr === r) continue;
          if (poss.some(([pr, pc]) => pr === rr && pc === cc)) continue;
          const cands = getCandidates(board, candidates, rr, cc);
          if (cands && cands.has(digit)) elims.push({ r: rr, c: cc, digit });
        }
        if (elims.length) return {
          techniqueId: 'claiming',
          techniqueName: 'Claiming',
          description: `행 ${r + 1}에서 ${digit}가 박스 ${box + 1}에만 있어, 박스의 다른 칸에서 제거됩니다.`,
          action: 'eliminate',
          eliminations: elims,
          highlights: [...poss.map(([rr, cc]) => ({ r: rr, c: cc, digit })), ...elims.map(e => ({ r: e.r, c: e.c, digit }))],
        };
      }
    }
  }
  for (let c = 0; c < 9; c++) {
    const colCells = getColCells(c);
    for (const digit of DIGITS) {
      const poss = colCells.filter(([rr, cc]) => {
        const cands = getCandidates(board, candidates, rr, cc);
        return cands && cands.has(digit);
      });
      if (poss.length < 2) continue;
      const boxes = [...new Set(poss.map(([rr, cc]) => getBox(rr, cc)))];
      if (boxes.length === 1) {
        const box = boxes[0];
        const boxCells = getBoxCells(box);
        const elims = [];
        for (const [rr, cc] of boxCells) {
          if (cc === c) continue;
          if (poss.some(([pr, pc]) => pr === rr && pc === cc)) continue;
          const cands = getCandidates(board, candidates, rr, cc);
          if (cands && cands.has(digit)) elims.push({ r: rr, c: cc, digit });
        }
        if (elims.length) return {
          techniqueId: 'claiming',
          techniqueName: 'Claiming',
          description: `열 ${c + 1}에서 ${digit}가 박스 ${box + 1}에만 있어, 박스의 다른 칸에서 제거됩니다.`,
          action: 'eliminate',
          eliminations: elims,
          highlights: [...poss.map(([rr, cc]) => ({ r: rr, c: cc, digit })), ...elims.map(e => ({ r: e.r, c: e.c, digit }))],
        };
      }
    }
  }
  return null;
}

// ─── Naked / Hidden sets ──────────────────────────────────────────────────

function* _subsets(arr, k) {
  if (k === 0) { yield []; return; }
  if (k > arr.length) return;
  for (let i = 0; i <= arr.length - k; i++) {
    for (const tail of _subsets(arr.slice(i + 1), k - 1)) {
      yield [arr[i], ...tail];
    }
  }
}

function _naked_set(board, candidates, cells, setName, setSize) {
  const emptyCells = cells.filter(([r, c]) => board[r][c] === 0);
  if (emptyCells.length < setSize) return null;
  const cellCands = emptyCells.map(([r, c]) => ({ r, c, cands: getCandidates(board, candidates, r, c) })).filter(x => x.cands);
  for (const subset of _subsets(cellCands, setSize)) {
    const union = new Set();
    subset.forEach(s => s.cands.forEach(d => union.add(d)));
    if (union.size !== setSize) continue;
    const elims = [];
    for (const { r, c, cands } of cellCands) {
      if (subset.some(s => s.r === r && s.c === c)) continue;
      for (const d of union) if (cands.has(d)) elims.push({ r, c, digit: d });
    }
    if (elims.length) {
      const digits = [...union];
      return {
        techniqueId: `naked_${setName}`,
        techniqueName: `Naked ${setName}`,
        description: `셀들 ${subset.map(s => `(${s.r + 1},${s.c + 1})`).join(', ')}에 ${digits.join(',')}만 있어 다른 칸에서 제거합니다.`,
        action: 'eliminate',
        eliminations: elims,
        highlights: subset.flatMap(s => digits.map(d => ({ r: s.r, c: s.c, digit: d }))),
      };
    }
  }
  return null;
}

function naked_pair(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const r = _naked_set(board, candidates, getBoxCells(box), 'pair', 2);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _naked_set(board, candidates, getRowCells(i), 'pair', 2);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _naked_set(board, candidates, getColCells(i), 'pair', 2);
    if (r) return r;
  }
  return null;
}

function naked_triple(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const r = _naked_set(board, candidates, getBoxCells(box), 'triple', 3);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _naked_set(board, candidates, getRowCells(i), 'triple', 3);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _naked_set(board, candidates, getColCells(i), 'triple', 3);
    if (r) return r;
  }
  return null;
}

function naked_quad(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const r = _naked_set(board, candidates, getBoxCells(box), 'quad', 4);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _naked_set(board, candidates, getRowCells(i), 'quad', 4);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _naked_set(board, candidates, getColCells(i), 'quad', 4);
    if (r) return r;
  }
  return null;
}

function _hidden_set(board, candidates, cells, setName, setSize) {
  const emptyCells = cells.filter(([r, c]) => board[r][c] === 0);
  if (emptyCells.length < setSize) return null;
  const cellCands = emptyCells.map(([r, c]) => ({ r, c, cands: getCandidates(board, candidates, r, c) })).filter(x => x.cands);
  for (const digits of _subsets([...DIGITS], setSize)) {
    const digitSet = new Set(digits);
    const poss = cellCands.filter(({ cands }) => [...cands].some(d => digitSet.has(d)));
    if (poss.length !== setSize) continue;
    const union = new Set(poss.flatMap(p => [...p.cands]));
    if (union.size !== setSize) continue;
    const elims = [];
    for (const { r, c, cands } of poss) {
      for (const d of cands) if (!digitSet.has(d)) elims.push({ r, c, digit: d });
    }
    if (elims.length) {
      return {
        techniqueId: `hidden_${setName}`,
        techniqueName: `Hidden ${setName}`,
        description: `숫자 ${digits.join(',')}가 ${poss.map(p => `(${p.r + 1},${p.c + 1})`).join(', ')}에만 있어 다른 후보를 제거합니다.`,
        action: 'eliminate',
        eliminations: elims,
        highlights: poss.flatMap(p => [...digitSet].map(d => ({ r: p.r, c: p.c, digit: d }))),
      };
    }
  }
  return null;
}

function hidden_pair(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const r = _hidden_set(board, candidates, getBoxCells(box), 'pair', 2);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _hidden_set(board, candidates, getRowCells(i), 'pair', 2);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _hidden_set(board, candidates, getColCells(i), 'pair', 2);
    if (r) return r;
  }
  return null;
}

function hidden_triple(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const r = _hidden_set(board, candidates, getBoxCells(box), 'triple', 3);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _hidden_set(board, candidates, getRowCells(i), 'triple', 3);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _hidden_set(board, candidates, getColCells(i), 'triple', 3);
    if (r) return r;
  }
  return null;
}

function hidden_quad(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const r = _hidden_set(board, candidates, getBoxCells(box), 'quad', 4);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _hidden_set(board, candidates, getRowCells(i), 'quad', 4);
    if (r) return r;
  }
  for (let i = 0; i < 9; i++) {
    const r = _hidden_set(board, candidates, getColCells(i), 'quad', 4);
    if (r) return r;
  }
  return null;
}

// ─── X-Wing, Swordfish, Jellyfish ──────────────────────────────────────────

function _fish(board, candidates, digit, nBase, fishName) {
  const rowPoss = {};
  const colPoss = {};
  for (let r = 0; r < 9; r++) {
    const poss = [];
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.has(digit)) poss.push(c);
    }
    if (poss.length > 0 && poss.length <= nBase) rowPoss[r] = poss;
  }
  for (let c = 0; c < 9; c++) {
    const poss = [];
    for (let r = 0; r < 9; r++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.has(digit)) poss.push(r);
    }
    if (poss.length > 0 && poss.length <= nBase) colPoss[c] = poss;
  }
  const rowKeys = Object.keys(rowPoss).map(Number);
  const colKeys = Object.keys(colPoss).map(Number);
  if (rowKeys.length < nBase || colKeys.length < nBase) return null;

  const _try_rows = (rows, start) => {
    if (rows.length === nBase) {
      const cols = [...new Set(rows.flatMap(r => rowPoss[r]))];
      if (cols.length !== nBase) return null;
      const elims = [];
      for (const c of cols) {
        for (let r = 0; r < 9; r++) {
          if (rows.includes(r)) continue;
          const cands = getCandidates(board, candidates, r, c);
          if (cands && cands.has(digit)) elims.push({ r, c, digit });
        }
      }
      if (elims.length) return { rows, cols, elims };
      return null;
    }
    for (let i = start; i < rowKeys.length; i++) {
      const res = _try_rows([...rows, rowKeys[i]], i + 1);
      if (res) return res;
    }
    return null;
  };
  let res = _try_rows([], 0);
  if (res) return {
    techniqueId: fishName.toLowerCase(),
    techniqueName: fishName,
    description: `${digit}에 대한 ${fishName}: 행 ${res.rows.map(r => r + 1).join(',')}에서 열 ${res.cols.map(c => c + 1).join(',')}의 ${digit} 제거`,
    action: 'eliminate',
    eliminations: res.elims,
    highlights: res.rows.flatMap(r => res.cols.map(c => ({ r, c, digit }))),
  };

  const _try_cols = (cols, start) => {
    if (cols.length === nBase) {
      const rows = [...new Set(cols.flatMap(c => colPoss[c]))];
      if (rows.length !== nBase) return null;
      const elims = [];
      for (const r of rows) {
        for (let c = 0; c < 9; c++) {
          if (cols.includes(c)) continue;
          const cands = getCandidates(board, candidates, r, c);
          if (cands && cands.has(digit)) elims.push({ r, c, digit });
        }
      }
      if (elims.length) return { rows, cols, elims };
      return null;
    }
    for (let i = start; i < colKeys.length; i++) {
      const res = _try_cols([...cols, colKeys[i]], i + 1);
      if (res) return res;
    }
    return null;
  };
  res = _try_cols([], 0);
  if (res) return {
    techniqueId: fishName.toLowerCase(),
    techniqueName: fishName,
    description: `${digit}에 대한 ${fishName}: 열 ${res.cols.map(c => c + 1).join(',')}에서 행 ${res.rows.map(r => r + 1).join(',')}의 ${digit} 제거`,
    action: 'eliminate',
    eliminations: res.elims,
    highlights: res.rows.flatMap(r => res.cols.map(c => ({ r, c, digit }))),
  };
  return null;
}

function xwing(board, candidates) {
  for (const d of DIGITS) {
    const r = _fish(board, candidates, d, 2, 'X-Wing');
    if (r) return r;
  }
  return null;
}

function swordfish(board, candidates) {
  for (const d of DIGITS) {
    const r = _fish(board, candidates, d, 3, 'Swordfish');
    if (r) return r;
  }
  return null;
}

function jellyfish(board, candidates) {
  for (const d of DIGITS) {
    const r = _fish(board, candidates, d, 4, 'Jellyfish');
    if (r) return r;
  }
  return null;
}

// ─── XY-Wing, XYZ-Wing, WXYZ-Wing ──────────────────────────────────────────

function xy_wing(board, candidates) {
  const bicells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 2) bicells.push({ r, c, cands: [...cands] });
    }
  }
  for (let pivot of bicells) {
    const [x, z] = pivot.cands;
    for (const p1 of bicells) {
      if (p1.r === pivot.r && p1.c === pivot.c) continue;
      if (!p1.cands.includes(x) || p1.cands[0] === p1.cands[1]) continue;
      const y = p1.cands.find(d => d !== x);
      if (!p1.cands.includes(z)) continue;
      const sharesPivot = (r, c) => (r === pivot.r || c === pivot.c) || getBox(r, c) === getBox(pivot.r, pivot.c);
      const sharesP1 = (r, c) => (r === p1.r || c === p1.c) || getBox(r, c) === getBox(p1.r, p1.c);
      if (!sharesPivot(p1.r, p1.c)) continue;
      for (const p2 of bicells) {
        if (p2.r === pivot.r && p2.c === pivot.c) continue;
        if (p2.r === p1.r && p2.c === p1.c) continue;
        if (!p2.cands.includes(z) || !p2.cands.includes(y)) continue;
        if (!sharesPivot(p2.r, p2.c) || !sharesP1(p2.r, p2.c)) continue;
        const elims = [];
        const seesBoth = (r, c) => {
          const s1 = r === pivot.r || c === pivot.c || getBox(r, c) === getBox(pivot.r, pivot.c);
          const s2 = (r === p1.r || c === p1.c || getBox(r, c) === getBox(p1.r, p1.c)) &&
            (r === p2.r || c === p2.c || getBox(r, c) === getBox(p2.r, p2.c));
          return s1 && (s2 || (r === p1.r || c === p1.c) || (r === p2.r || c === p2.c));
        };
        for (let rr = 0; rr < 9; rr++) {
          for (let cc = 0; cc < 9; cc++) {
            if ((rr === pivot.r && cc === pivot.c) || (rr === p1.r && cc === p1.c) || (rr === p2.r && cc === p2.c)) continue;
            const cands = getCandidates(board, candidates, rr, cc);
            if (!cands || !cands.has(z)) continue;
            const seesP1 = rr === p1.r || cc === p1.c || getBox(rr, cc) === getBox(p1.r, p1.c);
            const seesP2 = rr === p2.r || cc === p2.c || getBox(rr, cc) === getBox(p2.r, p2.c);
            if (seesP1 && seesP2) elims.push({ r: rr, c: cc, digit: z });
          }
        }
        if (elims.length) return {
          techniqueId: 'xy_wing',
          techniqueName: 'XY-Wing',
          description: `피벗 (${pivot.r + 1},${pivot.c + 1}), 날개 (${p1.r + 1},${p1.c + 1}), (${p2.r + 1},${p2.c + 1}) → ${z} 제거`,
          action: 'eliminate',
          eliminations: elims,
          highlights: [
            { r: pivot.r, c: pivot.c, digit: x }, { r: pivot.r, c: pivot.c, digit: z },
            { r: p1.r, c: p1.c, digit: x }, { r: p1.r, c: p1.c, digit: y },
            { r: p2.r, c: p2.c, digit: y }, { r: p2.r, c: p2.c, digit: z },
          ],
        };
      }
    }
  }
  return null;
}

function xyz_wing(board, candidates) {
  const tricells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 3) tricells.push({ r, c, cands: [...cands] });
    }
  }
  const bicells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 2) bicells.push({ r, c, cands: [...cands] });
    }
  }
  for (const pivot of tricells) {
    const [x, y, z] = pivot.cands;
    for (const p1 of bicells) {
      if (p1.r === pivot.r && p1.c === pivot.c) continue;
      const shares = (r, c) => r === pivot.r || c === pivot.c || getBox(r, c) === getBox(pivot.r, pivot.c);
      if (!shares(p1.r, p1.c)) continue;
      if (!p1.cands.includes(x) && !p1.cands.includes(z)) continue;
      const py = p1.cands.find(d => d !== x && d !== z);
      if (!py || py !== y) continue;
      for (const p2 of bicells) {
        if (p2.r === pivot.r && p2.c === pivot.c || p2.r === p1.r && p2.c === p1.c) continue;
        if (!shares(p2.r, p2.c)) continue;
        const sp1 = (r, c) => r === p1.r || c === p1.c || getBox(r, c) === getBox(p1.r, p1.c);
        if (!sp1(p2.r, p2.c)) continue;
        if (!p2.cands.includes(y) || !p2.cands.includes(z)) continue;
        const elims = [];
        for (let rr = 0; rr < 9; rr++) {
          for (let cc = 0; cc < 9; cc++) {
            if ((rr === pivot.r && cc === pivot.c) || (rr === p1.r && cc === p1.c) || (rr === p2.r && cc === p2.c)) continue;
            const cands = getCandidates(board, candidates, rr, cc);
            if (!cands || !cands.has(z)) continue;
            if (shares(rr, cc) && sp1(rr, cc)) elims.push({ r: rr, c: cc, digit: z });
          }
        }
        if (elims.length) return {
          techniqueId: 'xyz_wing',
          techniqueName: 'XYZ-Wing',
          description: `피벗 (${pivot.r + 1},${pivot.c + 1}), 날개 (${p1.r + 1},${p1.c + 1}), (${p2.r + 1},${p2.c + 1}) → ${z} 제거`,
          action: 'eliminate',
          eliminations: elims,
          highlights: [
            { r: pivot.r, c: pivot.c, digit: x }, { r: pivot.r, c: pivot.c, digit: y }, { r: pivot.r, c: pivot.c, digit: z },
            { r: p1.r, c: p1.c, digit: x }, { r: p1.r, c: p1.c, digit: y },
            { r: p2.r, c: p2.c, digit: y }, { r: p2.r, c: p2.c, digit: z },
          ],
        };
      }
    }
  }
  return null;
}

function wxyz_wing(board, candidates) {
  const quadCells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 4) quadCells.push({ r, c, cands: [...cands] });
    }
  }
  const triCells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 3) triCells.push({ r, c, cands: [...cands] });
    }
  }
  for (const pivot of quadCells) {
    const pset = new Set(pivot.cands);
    for (const p1 of triCells) {
      if (p1.r === pivot.r && p1.c === pivot.c) continue;
      const shares = (r, c) => r === pivot.r || c === pivot.c || getBox(r, c) === getBox(pivot.r, pivot.c);
      if (!shares(p1.r, p1.c)) continue;
      const common = pivot.cands.filter(d => p1.cands.includes(d));
      if (common.length < 2) continue;
      const elimDigit = common[common.length - 1];
      const elims = [];
      for (let rr = 0; rr < 9; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          if (rr === pivot.r && cc === pivot.c || rr === p1.r && cc === p1.c) continue;
          const cands = getCandidates(board, candidates, rr, cc);
          if (!cands || !cands.has(elimDigit)) continue;
          if (shares(rr, cc)) elims.push({ r: rr, c: cc, digit: elimDigit });
        }
      }
      if (elims.length) return {
        techniqueId: 'wxyz_wing',
        techniqueName: 'WXYZ-Wing',
        description: `피벗 (${pivot.r + 1},${pivot.c + 1}), 날개 (${p1.r + 1},${p1.c + 1}) → ${elimDigit} 제거`,
        action: 'eliminate',
        eliminations: elims,
        highlights: pivot.cands.flatMap(d => [{ r: pivot.r, c: pivot.c, digit: d }]).concat(
          p1.cands.map(d => ({ r: p1.r, c: p1.c, digit: d })),
        ),
      };
    }
  }
  return null;
}

// ─── Simple Coloring ───────────────────────────────────────────────────────

function simple_coloring(board, candidates) {
  for (const digit of DIGITS) {
    const cells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cands = getCandidates(board, candidates, r, c);
        if (cands && cands.has(digit)) cells.push([r, c]);
      }
    }
    if (cells.length < 4) continue;
    const color = {};
    const getColor = (r, c) => color[RC(r, c)];
    const setColor = (r, c, c1) => { color[RC(r, c)] = c1; };
    const sees = (r1, c1, r2, c2) =>
      r1 === r2 || c1 === c2 || getBox(r1, c1) === getBox(r2, c2);
    const graph = {};
    for (const [r, c] of cells) graph[RC(r, c)] = cells.filter(([rr, cc]) => (r !== rr || c !== cc) && sees(r, c, rr, cc) && (r === rr || c === cc || getBox(r, c) === getBox(rr, cc)));
    let colored = 0;
    for (const [r, c] of cells) {
      if (getColor(r, c) != null) continue;
      const stack = [[r, c, 0]];
      setColor(r, c, 0);
      colored++;
      while (stack.length) {
        const [rr, cc, col] = stack.pop();
        for (const [nr, nc] of graph[RC(rr, cc)] || []) {
          const ncol = 1 - col;
          if (getColor(nr, nc) == null) {
            setColor(nr, nc, ncol);
            colored++;
            stack.push([nr, nc, ncol]);
          } else if (getColor(nr, nc) === col) {
            const elims = cells.filter(([a, b]) => getColor(a, b) === col).map(([a, b]) => ({ r: a, c: b, digit }));
            if (elims.length) return {
              techniqueId: 'simple_coloring',
              techniqueName: 'Simple Coloring',
              description: `${digit}에 대해 같은 색의 연쇄가 충돌하여 제거`,
              action: 'eliminate',
              eliminations: elims,
              highlights: cells.map(([a, b]) => ({ r: a, c: b, digit })),
            };
          }
        }
      }
    }
    const sameUnit = (arr) => {
      const rows = [...new Set(arr.map(([r]) => r))];
      const cols = [...new Set(arr.map(([, c]) => c))];
      const boxes = [...new Set(arr.map(([r, c]) => getBox(r, c)))];
      return rows.length === 1 || cols.length === 1 || boxes.length === 1;
    };
    const color0 = cells.filter(([r, c]) => getColor(r, c) === 0);
    const color1 = cells.filter(([r, c]) => getColor(r, c) === 1);
    if (sameUnit(color0)) {
      const elims = color0.map(([r, c]) => ({ r, c, digit }));
      if (elims.length) return {
        techniqueId: 'simple_coloring',
        techniqueName: 'Simple Coloring',
        description: `${digit}에 대해 한 색이 한 유닛을 차지하여 제거`,
        action: 'eliminate',
        eliminations: elims,
        highlights: cells.map(([a, b]) => ({ r: a, c: b, digit })),
      };
    }
    if (sameUnit(color1)) {
      const elims = color1.map(([r, c]) => ({ r, c, digit }));
      if (elims.length) return {
        techniqueId: 'simple_coloring',
        techniqueName: 'Simple Coloring',
        description: `${digit}에 대해 한 색이 한 유닛을 차지하여 제거`,
        action: 'eliminate',
        eliminations: elims,
        highlights: cells.map(([a, b]) => ({ r: a, c: b, digit })),
      };
    }
  }
  return null;
}

// ─── X-Chain, XY-Chain ────────────────────────────────────────────────────

function x_chain(board, candidates) {
  for (const digit of DIGITS) {
    const cells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cands = getCandidates(board, candidates, r, c);
        if (cands && cands.has(digit)) cells.push([r, c]);
      }
    }
    const sees = (r1, c1, r2, c2) =>
      r1 === r2 || c1 === c2 || getBox(r1, c1) === getBox(r2, c2);
    const buildChain = (start, len) => {
      const chain = [start];
      const used = new Set([RC(start[0], start[1])]);
      const dfs = () => {
        if (chain.length >= len) {
          const first = chain[0], last = chain[chain.length - 1];
          if (first[0] !== last[0] && first[1] !== last[1] && getBox(first[0], first[1]) !== getBox(last[0], last[1])) return null;
          for (let rr = 0; rr < 9; rr++) {
            for (let cc = 0; cc < 9; cc++) {
              const cands = getCandidates(board, candidates, rr, cc);
              if (!cands || !cands.has(digit)) continue;
              if (chain.some(([r, c]) => r === rr && c === cc)) continue;
              const seesOdd = chain.filter((_, i) => i % 2 === 1).some(([r, c]) => sees(r, c, rr, cc));
              const seesEven = chain.filter((_, i) => i % 2 === 0).some(([r, c]) => sees(r, c, rr, cc));
              if (seesOdd && seesEven) return { chain, elim: { r: rr, c: cc } };
            }
          }
          return null;
        }
        const [lr, lc] = chain[chain.length - 1];
        const parity = chain.length % 2;
        for (const [r, c] of cells) {
          if (used.has(RC(r, c))) continue;
          if (!sees(lr, lc, r, c)) continue;
          chain.push([r, c]);
          used.add(RC(r, c));
          const res = dfs();
          chain.pop();
          used.delete(RC(r, c));
          if (res) return res;
        }
        return null;
      };
      return dfs();
    };
    for (const [r, c] of cells) {
      for (let len = 4; len <= 8; len += 2) {
        const res = buildChain([r, c], len);
        if (res) return {
          techniqueId: 'x_chain',
          techniqueName: 'X-Chain',
          description: `${digit}에 대한 X-Chain (길이 ${len})`,
          action: 'eliminate',
          eliminations: [{ ...res.elim, digit }],
          highlights: res.chain.flatMap(([rr, cc]) => [{ r: rr, c: cc, digit }]),
        };
      }
    }
  }
  return null;
}

function xy_chain(board, candidates) {
  const bicells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 2) bicells.push({ r, c, cands: [...cands] });
    }
  }
  const sees = (r1, c1, r2, c2) =>
    r1 === r2 || c1 === c2 || getBox(r1, c1) === getBox(r2, c2);
  for (let i = 0; i < bicells.length; i++) {
    for (let j = i + 1; j < bicells.length; j++) {
      const a = bicells[i], b = bicells[j];
      if (!sees(a.r, a.c, b.r, b.c)) continue;
      const common = a.cands.filter(d => b.cands.includes(d));
      if (common.length !== 1) continue;
      const z = common[0];
      const ax = a.cands.find(d => d !== z);
      const bx = b.cands.find(d => d !== z);
      if (ax === bx) continue;
      const elims = [];
      for (let rr = 0; rr < 9; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          const cands = getCandidates(board, candidates, rr, cc);
          if (!cands || !cands.has(z)) continue;
          if ((rr === a.r && cc === a.c) || (rr === b.r && cc === b.c)) continue;
          if (sees(rr, cc, a.r, a.c) && sees(rr, cc, b.r, b.c)) elims.push({ r: rr, c: cc, digit: z });
        }
      }
      if (elims.length) return {
        techniqueId: 'xy_chain',
        techniqueName: 'XY-Chain',
        description: `체인 (${a.r + 1},${a.c + 1})-(${b.r + 1},${b.c + 1}) → ${z} 제거`,
        action: 'eliminate',
        eliminations: elims,
        highlights: [
          { r: a.r, c: a.c, digit: ax }, { r: a.r, c: a.c, digit: z },
          { r: b.r, c: b.c, digit: bx }, { r: b.r, c: b.c, digit: z },
        ],
      };
    }
  }
  return null;
}

// ─── Finned X-Wing, Finned Swordfish ───────────────────────────────────────

function _finned_fish(board, candidates, digit, nBase, fishName) {
  const rowPoss = {};
  for (let r = 0; r < 9; r++) {
    const poss = [];
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.has(digit)) poss.push(c);
    }
    if (poss.length >= 1 && poss.length <= nBase + 1) rowPoss[r] = poss;
  }
  const rowKeys = Object.keys(rowPoss).map(Number);
  if (rowKeys.length < nBase) return null;

  const _try = (rows, start) => {
    if (rows.length === nBase) {
      const allCols = [...new Set(rows.flatMap(r => rowPoss[r]))];
      if (allCols.length > nBase + 1) return null;
      const baseCols = allCols.filter(c => rows.every(r => rowPoss[r].includes(c)));
      if (baseCols.length !== nBase) return null;
      const finCells = rows.flatMap(r => rowPoss[r]
        .filter(c => !baseCols.includes(c))
        .map(c => [r, c]));
      if (finCells.length === 0) return null;
      const elims = [];
      for (const [fr, fc] of finCells) {
        const box = getBox(fr, fc);
        for (const [rr, cc] of getBoxCells(box)) {
          if (rows.includes(rr) && baseCols.includes(cc)) continue;
          if (fr === rr && fc === cc) continue;
          const cands = getCandidates(board, candidates, rr, cc);
          if (cands && cands.has(digit)) elims.push({ r: rr, c: cc, digit });
        }
      }
      if (elims.length) return { rows, cols: baseCols, finCells, elims };
      return null;
    }
    for (let i = start; i < rowKeys.length; i++) {
      const res = _try([...rows, rowKeys[i]], i + 1);
      if (res) return res;
    }
    return null;
  };
  const res = _try([], 0);
  if (res) return {
    techniqueId: `finned_${fishName.toLowerCase()}`,
    techniqueName: `Finned ${fishName}`,
    description: `${digit}에 대한 Finned ${fishName}`,
    action: 'eliminate',
    eliminations: res.elims,
    highlights: res.rows.flatMap(r => res.cols.map(c => ({ r, c, digit }))).concat(res.finCells.map(([r, c]) => ({ r, c, digit }))),
  };
  return null;
}

function finned_xwing(board, candidates) {
  for (const d of DIGITS) {
    const r = _finned_fish(board, candidates, d, 2, 'X-Wing');
    if (r) return r;
  }
  return null;
}

function finned_swordfish(board, candidates) {
  for (const d of DIGITS) {
    const r = _finned_fish(board, candidates, d, 3, 'Swordfish');
    if (r) return r;
  }
  return null;
}

// ─── BUG (BUG+1) ──────────────────────────────────────────────────────────

function bug(board, candidates) {
  let nc = 0;
  let ur = -1, uc = -1;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands) {
        if (cands.size !== 2 && cands.size !== 3) return null;
        if (cands.size === 3) { nc++; ur = r; uc = c; }
      }
    }
  }
  if (nc !== 1) return null;
  const cands = getCandidates(board, candidates, ur, uc);
  if (!cands || cands.size !== 3) return null;
  const peerDigits = {};
  for (const d of DIGITS) peerDigits[d] = 0;
  const peers = [...getRowCells(ur), ...getColCells(uc), ...getBoxCells(getBox(ur, uc))];
  const peerSet = new Set(peers.map(([r, c]) => RC(r, c)));
  peerSet.delete(RC(ur, uc));
  for (const [r, c] of peerSet) {
    const pc = getCandidates(board, candidates, r, c);
    if (pc) for (const d of pc) peerDigits[d]++;
  }
  for (const d of cands) {
    if (peerDigits[d] === 0) {
      return {
        techniqueId: 'bug',
        techniqueName: 'BUG (BUG+1)',
        description: `BUG+1: (${ur + 1},${uc + 1})에서 ${d}만 유일하게 가능`,
        action: 'place',
        place: { r: ur, c: uc, digit: d },
        highlights: [{ r: ur, c: uc, digit: d }],
      };
    }
  }
  return null;
}

// ─── Unique Rectangle ──────────────────────────────────────────────────────

function unique_rectangle_box(board, candidates) {
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells = [];
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          cells.push([br * 3 + dr, bc * 3 + dc]);
        }
      }
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const [r1, c1] = cells[i], [r2, c2] = cells[j];
          if (r1 !== r2 && c1 !== c2) continue;
          const other1 = cells.find(([r, c]) => r !== r1 && c !== c1 && (r === r2 || c === c2));
          const other2 = cells.find(([r, c]) => r !== r2 && c !== c2 && (r === r1 || c === c1));
          if (!other1 || !other2) continue;
          const [r3, c3] = other1, [r4, c4] = other2;
          const cand1 = getCandidates(board, candidates, r1, c1);
          const cand2 = getCandidates(board, candidates, r2, c2);
          const cand3 = getCandidates(board, candidates, r3, c3);
          const cand4 = getCandidates(board, candidates, r4, c4);
          if (!cand1 || !cand2 || !cand3 || !cand4) continue;
          const pair = [...cand1];
          if (pair.length !== 2 || !cand2.has(pair[0]) || !cand2.has(pair[1])) continue;
          const type2 = [...cand3];
          const type3 = [...cand4];
          if (type2.length === 2 && new Set([...type2, ...pair]).size === 2) {
            const elim = pair.find(d => cand4.has(d) && type3.includes(d));
            if (elim !== undefined && cand4.has(elim)) {
              const corners = [[r1, c1], [r1, c2], [r2, c1], [r2, c2]];
              return {
                techniqueId: 'unique_rectangle',
                techniqueName: 'Unique Rectangle',
                description: `고유 직사각형 (${r1 + 1},${c1 + 1})-(${r2 + 1},${c2 + 1})-(${r3 + 1},${c3 + 1})-(${r4 + 1},${c4 + 1}) → ${elim} 제거`,
                action: 'eliminate',
                eliminations: [{ r: r4, c: c4, digit: elim }],
                highlights: corners.flatMap(([rr, cc]) => pair.map(d => ({ r: rr, c: cc, digit: d }))),
              };
            }
          }
        }
      }
    }
  }
  return null;
}

// Simplified Unique Rectangle - type 1
function _unique_rect_simple(board, candidates) {
  for (let r1 = 0; r1 < 9; r1++) {
    for (let c1 = 0; c1 < 9; c1++) {
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        if (getBox(r1, c1) !== getBox(r1, c2)) continue;
        for (let r2 = r1 + 1; r2 < 9; r2++) {
          if (getBox(r2, c1) !== getBox(r1, c1)) continue;
          const cand1 = getCandidates(board, candidates, r1, c1);
          const cand2 = getCandidates(board, candidates, r1, c2);
          const cand3 = getCandidates(board, candidates, r2, c1);
          const cand4 = getCandidates(board, candidates, r2, c2);
          if (!cand1 || !cand2 || !cand3 || !cand4) continue;
          const p = [...cand1];
          if (p.length !== 2 || !cand2.has(p[0]) || !cand2.has(p[1]) || !cand3.has(p[0]) || !cand3.has(p[1])) continue;
          const extra = [...cand4].filter(d => !p.includes(d));
          if (extra.length === 0) return null;
          const elim = extra.find(d => {
            const peerCount = [...getRowCells(r2), ...getColCells(c2), ...getBoxCells(getBox(r2, c2))]
              .filter(([r, c]) => !(r === r1 && c === c1) && !(r === r1 && c === c2) && !(r === r2 && c === c1))
              .reduce((cnt, [r, c]) => {
                const ccc = getCandidates(board, candidates, r, c);
                return cnt + (ccc && ccc.has(d) ? 1 : 0);
              }, 0);
            return peerCount === 0;
          });
          if (elim) return {
            techniqueId: 'unique_rectangle',
            techniqueName: 'Unique Rectangle',
            description: `고유 직사각형 Type 1: (${r2 + 1},${c2 + 1})에서 ${elim} 제거`,
            action: 'eliminate',
            eliminations: [{ r: r2, c: c2, digit: elim }],
            highlights: [{ r: r1, c: c1 }, { r: r1, c: c2 }, { r: r2, c: c1 }, { r: r2, c: c2 }].flatMap(({ r, c }) => p.map(d => ({ r, c, digit: d }))),
          };
        }
      }
    }
  }
  return null;
}

// ─── ALS-XZ ───────────────────────────────────────────────────────────────

function als_xz(board, candidates) {
  const units = [];
  for (let box = 0; box < 9; box++) units.push({ name: `box${box}`, cells: getBoxCells(box) });
  for (let i = 0; i < 9; i++) units.push({ name: `row${i}`, cells: getRowCells(i) });
  for (let i = 0; i < 9; i++) units.push({ name: `col${i}`, cells: getColCells(i) });

  for (const U of units) {
    const empty = U.cells.filter(([r, c]) => board[r][c] === 0);
    if (empty.length < 2 || empty.length > 5) continue;
    const sets = [];
    for (let k = 2; k <= Math.min(5, empty.length); k++) {
      for (const subset of _subsets(empty, k)) {
        const union = new Set();
        subset.forEach(([r, c]) => {
          const cands = getCandidates(board, candidates, r, c);
          if (cands) cands.forEach(d => union.add(d));
        });
        if (union.size === k + 1) sets.push({ cells: subset, digits: [...union] });
      }
    }
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const A = sets[i], B = sets[j];
        const overlap = A.cells.filter(([r, c]) => B.cells.some(([rr, cc]) => rr === r && cc === c));
        if (overlap.length > 0) continue;
        const shared = A.digits.filter(d => B.digits.includes(d));
        const restrictZ = shared.find(z => {
          const aOnly = A.digits.filter(d => d !== z);
          const bOnly = B.digits.filter(d => d !== z);
          const seesA = (r, c) => A.cells.some(([ar, ac]) => ar === r || ac === c || getBox(ar, ac) === getBox(r, c));
          const seesB = (r, c) => B.cells.some(([br, bc]) => br === r || bc === c || getBox(br, bc) === getBox(r, c));
          let elims = [];
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              const cands = getCandidates(board, candidates, r, c);
              if (!cands || !cands.has(z)) continue;
              if (A.cells.some(([ar, ac]) => ar === r && ac === c) || B.cells.some(([br, bc]) => br === r && bc === c)) continue;
              if (seesA(r, c) && seesB(r, c)) elims.push({ r, c, digit: z });
            }
          }
          return elims.length > 0;
        });
        if (restrictZ) {
          const elims = [];
          const seesA = (r, c) => A.cells.some(([ar, ac]) => ar === r || ac === c || getBox(ar, ac) === getBox(r, c));
          const seesB = (r, c) => B.cells.some(([br, bc]) => br === r || bc === c || getBox(br, bc) === getBox(r, c));
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              const cands = getCandidates(board, candidates, r, c);
              if (!cands || !cands.has(restrictZ)) continue;
              if (A.cells.some(([ar, ac]) => ar === r && ac === c) || B.cells.some(([br, bc]) => br === r && bc === c)) continue;
              if (seesA(r, c) && seesB(r, c)) elims.push({ r, c, digit: restrictZ });
            }
          }
          if (elims.length) return {
            techniqueId: 'als_xz',
            techniqueName: 'ALS-XZ',
            description: `ALS-XZ: 연결 집합에서 ${restrictZ} 제거`,
            action: 'eliminate',
            eliminations: elims,
            highlights: A.cells.flatMap(([r, c]) => A.digits.map(d => ({ r, c, digit: d }))).concat(B.cells.flatMap(([r, c]) => B.digits.map(d => ({ r, c, digit: d })))),
          };
        }
      }
    }
  }
  return null;
}

// ─── Sue de Coq ────────────────────────────────────────────────────────────

function su_de_coq(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const boxCells = getBoxCells(box);
    const [br, bc] = [Math.floor(box / 3) * 3, (box % 3) * 3];
    for (const line of ['row', 'col']) {
      for (let idx = 0; idx < 3; idx++) {
        const lineCells = line === 'row' ? getRowCells(br + idx) : getColCells(bc + idx);
        const intersect = boxCells.filter(([r, c]) => lineCells.some(([lr, lc]) => lr === r && lc === c));
        const onlyBox = boxCells.filter(([r, c]) => !intersect.some(([ir, ic]) => ir === r && ic === c));
        const onlyLine = lineCells.filter(([r, c]) => !intersect.some(([ir, ic]) => ir === r && ic === c));
        if (intersect.length < 2 || onlyBox.length < 1 || onlyLine.length < 1) continue;
        for (const k of [2, 3]) {
          if (intersect.length < k) continue;
          for (const intSub of _subsets(intersect, k)) {
            const intDigits = new Set();
            intSub.forEach(([r, c]) => {
              const cands = getCandidates(board, candidates, r, c);
              if (cands) cands.forEach(d => intDigits.add(d));
            });
            if (intDigits.size > k + 2) continue;
            const boxDigits = new Set();
            onlyBox.forEach(([r, c]) => {
              const cands = getCandidates(board, candidates, r, c);
              if (cands) cands.forEach(d => boxDigits.add(d));
            });
            const lineDigits = new Set();
            onlyLine.forEach(([r, c]) => {
              const cands = getCandidates(board, candidates, r, c);
              if (cands) cands.forEach(d => lineDigits.add(d));
            });
            const bOnly = [...boxDigits].filter(d => !intDigits.has(d) && !lineDigits.has(d));
            const lOnly = [...lineDigits].filter(d => !intDigits.has(d) && !boxDigits.has(d));
            if (bOnly.length === 0 && lOnly.length === 0) continue;
            const elims = [];
            const remBox = onlyBox.filter(([r, c]) => {
              const cands = getCandidates(board, candidates, r, c);
              return cands && lOnly.some(d => cands.has(d));
            });
            const remLine = onlyLine.filter(([r, c]) => {
              const cands = getCandidates(board, candidates, r, c);
              return cands && bOnly.some(d => cands.has(d));
            });
            remBox.forEach(([r, c]) => lOnly.forEach(d => elims.push({ r, c, digit: d })));
            remLine.forEach(([r, c]) => bOnly.forEach(d => elims.push({ r, c, digit: d })));
            if (elims.length) return {
              techniqueId: 'su_de_coq',
              techniqueName: 'Sue de Coq',
              description: `Sue de Coq: 박스 ${box + 1}와 ${line} 교차`,
              action: 'eliminate',
              eliminations: elims,
              highlights: intSub.flatMap(([r, c]) => {
                const cands = getCandidates(board, candidates, r, c);
                return cands ? [...cands].map(d => ({ r, c, digit: d })) : [];
              }),
            };
          }
        }
      }
    }
  }
  return null;
}

// ─── Forcing Chain (Digit Forcing) ──────────────────────────────────────────

function forcing_chain(board, candidates) {
  const empty = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cands = getCandidates(board, candidates, r, c);
      if (cands && cands.size === 2) empty.push({ r, c, cands: [...cands] });
    }
  }
  const copyB = () => board.map(row => [...row]);
  const propagate = (b) => {
    let changed = true;
    while (changed) {
      changed = false;
      for (let rr = 0; rr < 9; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          if (b[rr][cc] !== 0) continue;
          const cands = getCandidates(b, null, rr, cc);
          if (!cands || cands.size === 0) return false;
          if (cands.size === 1) {
            b[rr][cc] = [...cands][0];
            changed = true;
          }
        }
      }
    }
    return true;
  };
  for (const { r, c, cands } of empty) {
    for (const d of cands) {
      const b1 = copyB();
      b1[r][c] = d;
      if (!propagate(b1)) continue;
      const other = cands.find(x => x !== d);
      const b2 = copyB();
      b2[r][c] = other;
      if (!propagate(b2)) continue;
      for (let rr = 0; rr < 9; rr++) {
        for (let cc = 0; cc < 9; cc++) {
          if (b1[rr][cc] === 0 || b2[rr][cc] === 0) continue;
          if (b1[rr][cc] === b2[rr][cc]) continue;
          const origCands = getCandidates(board, candidates, rr, cc);
          if (!origCands || origCands.size < 2) continue;
          const elims = [...origCands].filter(x => x !== b1[rr][cc] && x !== b2[rr][cc]);
          if (elims.length > 0) return {
            techniqueId: 'forcing_chain',
            techniqueName: 'Forcing Chain',
            description: `강제 체인: (${r + 1},${c + 1})에서 ${d}/${other} 시도 → (${rr + 1},${cc + 1})에서 ${elims.join(',')} 제거`,
            action: 'eliminate',
            eliminations: elims.map(digit => ({ r: rr, c: cc, digit })),
            highlights: [{ r, c, digit: d }, { r, c, digit: other }, ...elims.map(digit => ({ r: rr, c: cc, digit }))],
          };
        }
      }
    }
  }
  return null;
}

// ─── Backtracking ─────────────────────────────────────────────────────────

function backtracking(board, candidates) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      const cands = getCandidates(board, candidates, r, c);
      if (!cands || cands.size === 0) return null;
      const digit = [...cands][0];
      return {
        techniqueId: 'backtracking',
        techniqueName: 'Backtracking',
        description: `추측: (${r + 1},${c + 1})에 ${digit} 시도`,
        action: 'place',
        place: { r, c, digit },
        highlights: [{ r, c, digit }],
      };
    }
  }
  return null;
}

function unique_rectangle(board, candidates) {
  const res = _unique_rect_simple(board, candidates);
  if (res) return res;
  return unique_rectangle_box(board, candidates);
}

// ─── Exports ──────────────────────────────────────────────────────────────

export const TECHNIQUE_FUNCTIONS = [
  full_unit, naked_single, hidden_single,
  pointing, claiming,
  naked_pair, naked_triple, naked_quad,
  hidden_pair, hidden_triple, hidden_quad,
  xwing, swordfish, jellyfish,
  xy_wing, xyz_wing, wxyz_wing,
  simple_coloring, x_chain, xy_chain,
  finned_xwing, finned_swordfish,
  bug, unique_rectangle,
  als_xz, su_de_coq,
  forcing_chain,
];

export const TECHNIQUE_INFO = {
  full_unit:      { id: 'full_unit',      name: '가득찬 유닛',    category: 'basic',    desc: '행/열/박스에 8칸이 채워져 한 칸만 비었을 때 남은 숫자를 넣습니다.' },
  naked_single:   { id: 'naked_single',   name: '드러난 하나',   category: 'basic',    desc: '한 칸에 넣을 수 있는 후보가 하나뿐일 때 그 숫자를 확정합니다.' },
  hidden_single:  { id: 'hidden_single',  name: '숨겨진 하나',   category: 'basic',    desc: '유닛(행/열/박스) 안에서 숫자의 후보가 한 칸에만 있을 때 그 칸에 넣습니다.' },
  pointing:       { id: 'pointing',       name: '교차로(포인팅)', category: 'elementary', desc: '박스 안에서 숫자 후보가 한 행(열)에만 있으면 그 행(열)의 다른 박스에서 제거합니다.' },
  claiming:       { id: 'claiming',       name: '교차로(클레이밍)', category: 'elementary', desc: '행(열)에서 숫자 후보가 한 박스에만 있으면 그 박스의 다른 행(열)에서 제거합니다.' },
  naked_pair:     { id: 'naked_pair',     name: '드러난 둘',     category: 'elementary', desc: '두 칸이 같은 두 후보만 가지면 그 유닛의 다른 칸에서 그 숫자들을 제거합니다.' },
  naked_triple:   { id: 'naked_triple',   name: '드러난 셋',     category: 'elementary', desc: '세 칸에 세 후보만 있으면 다른 칸에서 제거합니다.' },
  naked_quad:     { id: 'naked_quad',     name: '드러난 넷',     category: 'elementary', desc: '네 칸에 네 후보만 있으면 다른 칸에서 제거합니다.' },
  hidden_pair:    { id: 'hidden_pair',    name: '숨겨진 둘',     category: 'elementary', desc: '두 숫자의 후보가 두 칸에만 있으면 그 두 칸의 다른 후보를 제거합니다.' },
  hidden_triple:  { id: 'hidden_triple',  name: '숨겨진 셋',     category: 'elementary', desc: '세 숫자의 후보가 세 칸에만 있으면 제거합니다.' },
  hidden_quad:    { id: 'hidden_quad',    name: '숨겨진 넷',     category: 'elementary', desc: '네 숫자의 후보가 네 칸에만 있으면 제거합니다.' },
  xwing:          { id: 'xwing',          name: 'X-윙',          category: 'elementary', desc: '두 행(열)에서 숫자 후보가 같은 두 열(행)에만 있으면 제거합니다.' },
  swordfish:      { id: 'swordfish',      name: '황새치',        category: 'elementary', desc: '세 행(열)에서 같은 패턴으로 후보 제거합니다.' },
  jellyfish:      { id: 'jellyfish',      name: '해파리',        category: 'elementary', desc: '네 행(열)에서 같은 패턴으로 후보 제거합니다.' },
  xy_wing:        { id: 'xy_wing',        name: 'XY-윙',         category: 'intermediate', desc: '피벗 셀과 두 날개 셀의 후보 조합으로 제거합니다.' },
  xyz_wing:       { id: 'xyz_wing',       name: 'XYZ-윙',        category: 'intermediate', desc: 'XY-윙의 확장, 세 후보 피벗 셀을 사용합니다.' },
  wxyz_wing:      { id: 'wxyz_wing',      name: 'WXYZ-윙',       category: 'intermediate', desc: '네 후보 날개로 제거합니다.' },
  simple_coloring:{ id: 'simple_coloring', name: '심플 컬러링',   category: 'intermediate', desc: '한 숫자의 후보를 두 색으로 나누어 제거합니다.' },
  x_chain:        { id: 'x_chain',        name: 'X-사슬',        category: 'intermediate', desc: '한 숫자의 연쇄적 추론으로 제거합니다.' },
  xy_chain:       { id: 'xy_chain',       name: 'XY-사슬',        category: 'intermediate', desc: 'XY 셀들의 연쇄로 제거합니다.' },
  finned_xwing:   { id: 'finned_xwing',   name: '핀드 X-윙',     category: 'intermediate', desc: '지느러미가 있는 X-윙 패턴입니다.' },
  finned_swordfish:{ id: 'finned_swordfish', name: '핀드 스워드피쉬', category: 'intermediate', desc: '지느러미가 있는 스워드피쉬입니다.' },
  bug:            { id: 'bug',            name: 'BUG',           category: 'intermediate', desc: 'BUG+1: 한 칸에만 여분 후보가 있으면 그 칸에 넣습니다.' },
  unique_rectangle:{ id: 'unique_rectangle', name: '유일성 직사각형', category: 'intermediate', desc: '직사각형 패턴에서 유일해를 위해 후보를 제거합니다.' },
  als_xz:         { id: 'als_xz',         name: 'ALS-XZ',         category: 'advanced',   desc: '거의 잠긴 집합의 연결로 후보를 제거합니다.' },
  su_de_coq:      { id: 'su_de_coq',      name: 'Sue de Coq',     category: 'advanced',   desc: '박스와 행(열)의 교차 부분을 이용합니다.' },
  forcing_chain:  { id: 'forcing_chain',  name: '강제 사슬',      category: 'lastResort', desc: '두 가지 가정이 같은 결과를 만들 때 그 결과를 확정합니다.' },
  backtracking:   { id: 'backtracking',   name: '백트래킹',      category: 'lastResort', desc: '논리적 기법으로 풀 수 없을 때 시행착오로 풉니다.' },
};

export function findNextStep(board, candidates) {
  for (const fn of TECHNIQUE_FUNCTIONS) {
    const result = fn(board, candidates);
    if (result) return result;
  }
  return null;
}
