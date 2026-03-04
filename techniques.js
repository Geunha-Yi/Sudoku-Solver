/**
 * 스도쿠 풀이 기법 - 기초~초급
 * 각 기법은 (board, candidates)를 받아 적용 가능한 단계가 있으면 step 객체 반환
 */

import { getBox, getBoxCells, getRowCells, getColCells } from './candidates.js';

/** 기법 메타정보 (설명용) */
export const TECHNIQUE_INFO = {
  naked_single: {
    id: 'naked_single',
    name: '드러난 하나',
    category: '기초',
    desc: '한 칸에 넣을 수 있는 후보가 하나뿐일 때, 그 숫자를 확정합니다.',
  },
  hidden_single_box: {
    id: 'hidden_single_box',
    name: '숨겨진 하나 (상자)',
    category: '기초',
    desc: '3×3 박스 안에서 어떤 숫자의 후보가 한 칸에만 있을 때, 그 칸에 그 숫자를 놓습니다.',
  },
  hidden_single_row: {
    id: 'hidden_single_row',
    name: '숨겨진 하나 (행)',
    category: '기초',
    desc: '한 행에서 어떤 숫자의 후보가 한 칸에만 있을 때, 그 칸에 그 숫자를 놓습니다.',
  },
  hidden_single_col: {
    id: 'hidden_single_col',
    name: '숨겨진 하나 (열)',
    category: '기초',
    desc: '한 열에서 어떤 숫자의 후보가 한 칸에만 있을 때, 그 칸에 그 숫자를 놓습니다.',
  },
  pointing: {
    id: 'pointing',
    name: '교차로 (포인팅)',
    category: '초급',
    desc: '박스 안에서 숫자 N의 후보가 한 행(또는 열)에만 있으면, 그 행(열)의 다른 박스들에서는 N을 제거할 수 있습니다.',
  },
  claiming: {
    id: 'claiming',
    name: '교차로 (클레이밍)',
    category: '초급',
    desc: '한 행(열)에서 숫자 N의 후보가 한 박스 안에만 있으면, 그 박스의 다른 행(열)에서는 N을 제거할 수 있습니다.',
  },
  naked_pair: {
    id: 'naked_pair',
    name: '드러난 둘',
    category: '초급',
    desc: '한 유닛(행/열/박스)에서 두 칸이 같은 두 후보만 가지면, 그 유닛의 다른 칸에서 그 두 숫자를 제거할 수 있습니다.',
  },
  hidden_pair: {
    id: 'hidden_pair',
    name: '숨겨진 둘',
    category: '초급',
    desc: '한 유닛에서 두 숫자의 후보가 같은 두 칸에만 있으면, 그 두 칸의 다른 후보를 제거할 수 있습니다.',
  },
  xwing: {
    id: 'xwing',
    name: 'X-윙',
    category: '초급',
    desc: '두 행(열)에서 숫자 N의 후보가 같은 두 열(행)에만 있으면, 그 두 열(행)의 다른 행(열)에서 N을 제거할 수 있습니다.',
  },
  full_unit: {
    id: 'full_unit',
    name: '가득찬 유닛',
    category: '기초',
    desc: '행, 열, 박스 중 8칸이 채워져 한 칸만 비어 있으면, 남은 숫자 하나를 넣을 수 있습니다.',
  },
};

function getCandidates(board, candidates, r, c) {
  if (board[r][c] !== 0) return null;
  return candidates[r][c];
}

/** 3.1 가득찬 유닛 - 8칸 채워진 유닛에서 마지막 칸 채우기 */
function findFullUnit(board, candidates) {
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
    const digit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(n => !used.has(n));
    if (!digit) continue;
    return {
      techniqueId: 'full_unit',
      techniqueName: TECHNIQUE_INFO.full_unit.name,
      description: `${name}에서 8칸이 채워져 (${r + 1},${c + 1})에 ${digit}을 넣습니다.`,
      action: 'place',
      place: { row: r, col: c, digit },
      highlights: [{ r, c, type: 'place', unit: name }],
    };
  }
  return null;
}

/** 3.2 드러난 하나 */
function findNakedSingle(board, candidates) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cand = getCandidates(board, candidates, r, c);
      if (cand && cand.size === 1) {
        const digit = [...cand][0];
        return {
          techniqueId: 'naked_single',
          techniqueName: TECHNIQUE_INFO.naked_single.name,
          description: `(${r + 1},${c + 1}) 칸에 후보가 ${digit} 하나뿐이므로 ${digit}을 놓습니다.`,
          action: 'place',
          place: { row: r, col: c, digit },
          highlights: [{ r, c, type: 'place', digit }],
        };
      }
    }
  }
  return null;
}

/** 3.2.1 숨겨진 하나 (상자) */
function findHiddenSingleBox(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const cells = getBoxCells(box);
    for (let digit = 1; digit <= 9; digit++) {
      const withDigit = cells.filter(([r, c]) => {
        const cand = getCandidates(board, candidates, r, c);
        return cand && cand.has(digit);
      });
      if (withDigit.length === 1) {
        const [r, c] = withDigit[0];
        return {
          techniqueId: 'hidden_single_box',
          techniqueName: TECHNIQUE_INFO.hidden_single_box.name,
          description: `박스 ${box + 1}에서 ${digit}의 후보가 (${r + 1},${c + 1}) 한 칸에만 있어 ${digit}을 놓습니다.`,
          action: 'place',
          place: { row: r, col: c, digit },
          highlights: [{ r, c, type: 'place', digit, unit: `박스 ${box + 1}` }],
        };
      }
    }
  }
  return null;
}

/** 3.2.2 숨겨진 하나 (행/열) */
function findHiddenSingleRow(board, candidates) {
  for (let r = 0; r < 9; r++) {
    const cells = getRowCells(r);
    for (let digit = 1; digit <= 9; digit++) {
      const withDigit = cells.filter(([rr, cc]) => {
        const cand = getCandidates(board, candidates, rr, cc);
        return cand && cand.has(digit);
      });
      if (withDigit.length === 1) {
        const [rr, c] = withDigit[0];
        return {
          techniqueId: 'hidden_single_row',
          techniqueName: TECHNIQUE_INFO.hidden_single_row.name,
          description: `행 ${r + 1}에서 ${digit}의 후보가 (${r + 1},${c + 1}) 한 칸에만 있어 ${digit}을 놓습니다.`,
          action: 'place',
          place: { row: rr, col: c, digit },
          highlights: [{ r: rr, c, type: 'place', digit, unit: `행 ${r + 1}` }],
        };
      }
    }
  }
  return null;
}

function findHiddenSingleCol(board, candidates) {
  for (let c = 0; c < 9; c++) {
    const cells = getColCells(c);
    for (let digit = 1; digit <= 9; digit++) {
      const withDigit = cells.filter(([r, cc]) => {
        const cand = getCandidates(board, candidates, r, cc);
        return cand && cand.has(digit);
      });
      if (withDigit.length === 1) {
        const [r, cc] = withDigit[0];
        return {
          techniqueId: 'hidden_single_col',
          techniqueName: TECHNIQUE_INFO.hidden_single_col.name,
          description: `열 ${c + 1}에서 ${digit}의 후보가 (${r + 1},${c + 1}) 한 칸에만 있어 ${digit}을 놓습니다.`,
          action: 'place',
          place: { row: r, col: cc, digit },
          highlights: [{ r, c: cc, type: 'place', digit, unit: `열 ${c + 1}` }],
        };
      }
    }
  }
  return null;
}

/** 4.1.1 교차로 (포인팅) - 박스 내 후보가 한 행/열에만 있으면 그 행/열의 다른 박스에서 제거 */
function findPointing(board, candidates) {
  for (let box = 0; box < 9; box++) {
    const boxCells = getBoxCells(box);
    const br = Math.floor(box / 3) * 3, bc = (box % 3) * 3;
    for (let digit = 1; digit <= 9; digit++) {
      const withDigit = boxCells.filter(([r, c]) => {
        const cand = getCandidates(board, candidates, r, c);
        return cand && cand.has(digit);
      });
      if (withDigit.length < 2) continue;
      const rows = new Set(withDigit.map(([r]) => r));
      const cols = new Set(withDigit.map(([, c]) => c));
      let eliminations = [];
      if (rows.size === 1) {
        const row = [...rows][0];
        for (let c = 0; c < 9; c++) {
          if (c >= bc && c < bc + 3) continue;
          const cand = getCandidates(board, candidates, row, c);
          if (cand && cand.has(digit)) eliminations.push({ r: row, c, digit });
        }
      }
      if (cols.size === 1) {
        const col = [...cols][0];
        for (let r = 0; r < 9; r++) {
          if (r >= br && r < br + 3) continue;
          const cand = getCandidates(board, candidates, r, col);
          if (cand && cand.has(digit)) eliminations.push({ r, c: col, digit });
        }
      }
      if (eliminations.length > 0) {
        const unit = rows.size === 1 ? `행 ${[...rows][0] + 1}` : `열 ${[...cols][0] + 1}`;
        return {
          techniqueId: 'pointing',
          techniqueName: TECHNIQUE_INFO.pointing.name,
          description: `박스 ${box + 1}에서 ${digit}의 후보가 ${unit}에만 있어, ${unit}의 다른 박스들에서 ${digit}을 제거합니다.`,
          action: 'eliminate',
          eliminations,
          highlights: withDigit.map(([r, c]) => ({ r, c, type: 'reason', digit })),
        };
      }
    }
  }
  return null;
}

/** 4.1.2 교차로 (클레이밍) - 행/열에서 후보가 한 박스에만 있으면 그 박스의 다른 행/열에서 제거 */
function findClaiming(board, candidates) {
  for (let i = 0; i < 9; i++) {
    for (let digit = 1; digit <= 9; digit++) {
      for (const { cells, name, exclude } of [
        { cells: getRowCells(i), name: `행 ${i + 1}`, exclude: (r, c) => r !== i },
        { cells: getColCells(i), name: `열 ${i + 1}`, exclude: (r, c) => c !== i },
      ]) {
        const withDigit = cells.filter(([r, c]) => {
          const cand = getCandidates(board, candidates, r, c);
          return cand && cand.has(digit);
        });
        if (withDigit.length < 2) continue;
        const boxes = new Set(withDigit.map(([r, c]) => getBox(r, c)));
        if (boxes.size !== 1) continue;
        const box = [...boxes][0];
        const boxCells = getBoxCells(box);
        const eliminations = boxCells
          .filter(([r, c]) => exclude(r, c) && board[r][c] === 0)
          .filter(([r, c]) => getCandidates(board, candidates, r, c)?.has(digit))
          .map(([r, c]) => ({ r, c, digit }));
        if (eliminations.length > 0) {
          return {
            techniqueId: 'claiming',
            techniqueName: TECHNIQUE_INFO.claiming.name,
            description: `${name}에서 ${digit}의 후보가 박스 ${box + 1}에만 있어, 박스 ${box + 1}의 ${name} 밖 칸들에서 ${digit}을 제거합니다.`,
            action: 'eliminate',
            eliminations,
            highlights: withDigit.map(([r, c]) => ({ r, c, type: 'reason', digit })),
          };
        }
      }
    }
  }
  return null;
}

/** 4.2.1.1 드러난 둘 */
function findNakedPair(board, candidates) {
  const checkUnit = (cells, unitName) => {
    const empty = cells.filter(([r, c]) => board[r][c] === 0);
    for (let i = 0; i < empty.length; i++) {
      for (let j = i + 1; j < empty.length; j++) {
        const [r1, c1] = empty[i], [r2, c2] = empty[j];
        const c1Set = getCandidates(board, candidates, r1, c1);
        const c2Set = getCandidates(board, candidates, r2, c2);
        if (!c1Set || !c2Set) continue;
        if (c1Set.size !== 2 || c2Set.size !== 2) continue;
        const arr1 = [...c1Set].sort(), arr2 = [...c2Set].sort();
        if (arr1[0] !== arr2[0] || arr1[1] !== arr2[1]) continue;
        const eliminations = empty
          .filter(([r, c]) => (r !== r1 || c !== c1) && (r !== r2 || c !== c2))
          .filter(([r, c]) => {
            const cand = getCandidates(board, candidates, r, c);
            return cand && (cand.has(arr1[0]) || cand.has(arr1[1]));
          })
          .map(([r, c]) => {
            const cand = getCandidates(board, candidates, r, c);
            const el = [];
            if (cand?.has(arr1[0])) el.push({ r, c, digit: arr1[0] });
            if (cand?.has(arr1[1])) el.push({ r, c, digit: arr1[1] });
            return el;
          })
          .flat();
        if (eliminations.length > 0) {
          return {
            techniqueId: 'naked_pair',
            techniqueName: TECHNIQUE_INFO.naked_pair.name,
            description: `${unitName}에서 (${r1 + 1},${c1 + 1})과 (${r2 + 1},${c2 + 1})이 후보 {${arr1.join(',')}}만 가지므로, 같은 ${unitName}의 다른 칸에서 ${arr1.join(', ')}를 제거합니다.`,
            action: 'eliminate',
            eliminations,
            highlights: [
              { r: r1, c: c1, type: 'reason', digits: arr1 },
              { r: r2, c: c2, type: 'reason', digits: arr2 },
            ],
          };
        }
      }
    }
    return null;
  };
  for (let i = 0; i < 9; i++) {
    let s = checkUnit(getRowCells(i), `행 ${i + 1}`);
    if (s) return s;
    s = checkUnit(getColCells(i), `열 ${i + 1}`);
    if (s) return s;
    s = checkUnit(getBoxCells(i), `박스 ${i + 1}`);
    if (s) return s;
  }
  return null;
}

/** 4.2.2.1 숨겨진 둘 */
function findHiddenPair(board, candidates) {
  const checkUnit = (cells, unitName) => {
    for (let d1 = 1; d1 <= 8; d1++) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const withD1 = cells.filter(([r, c]) => getCandidates(board, candidates, r, c)?.has(d1));
        const withD2 = cells.filter(([r, c]) => getCandidates(board, candidates, r, c)?.has(d2));
        const both = withD1.filter(([r, c]) => withD2.some(([rr, cc]) => r === rr && c === cc));
        if (both.length !== 2) continue;
        const [[r1, c1], [r2, c2]] = both;
        const c1Set = getCandidates(board, candidates, r1, c1);
        const c2Set = getCandidates(board, candidates, r2, c2);
        if (!c1Set || !c2Set) continue;
        const toRemove1 = [...c1Set].filter(x => x !== d1 && x !== d2);
        const toRemove2 = [...c2Set].filter(x => x !== d1 && x !== d2);
        if (toRemove1.length === 0 && toRemove2.length === 0) continue;
        const eliminations = [];
        toRemove1.forEach(d => eliminations.push({ r: r1, c: c1, digit: d }));
        toRemove2.forEach(d => eliminations.push({ r: r2, c: c2, digit: d }));
        if (eliminations.length > 0) {
          return {
            techniqueId: 'hidden_pair',
            techniqueName: TECHNIQUE_INFO.hidden_pair.name,
            description: `${unitName}에서 ${d1}, ${d2}의 후보가 (${r1 + 1},${c1 + 1})과 (${r2 + 1},${c2 + 1}) 두 칸에만 있으므로, 그 두 칸에서 ${d1}, ${d2} 외의 후보를 제거합니다.`,
            action: 'eliminate',
            eliminations,
            highlights: [
              { r: r1, c: c1, type: 'reason', digits: [d1, d2] },
              { r: r2, c: c2, type: 'reason', digits: [d1, d2] },
            ],
          };
        }
      }
    }
    return null;
  };
  for (let i = 0; i < 9; i++) {
    let s = checkUnit(getRowCells(i), `행 ${i + 1}`);
    if (s) return s;
    s = checkUnit(getColCells(i), `열 ${i + 1}`);
    if (s) return s;
    s = checkUnit(getBoxCells(i), `박스 ${i + 1}`);
    if (s) return s;
  }
  return null;
}

/** 4.3.1 X-윙 */
function findXWing(board, candidates) {
  for (let digit = 1; digit <= 9; digit++) {
    for (let r1 = 0; r1 < 8; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        const cols1 = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(c => getCandidates(board, candidates, r1, c)?.has(digit));
        const cols2 = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(c => getCandidates(board, candidates, r2, c)?.has(digit));
        if (cols1.length !== 2 || cols2.length !== 2) continue;
        const set1 = new Set(cols1), set2 = new Set(cols2);
        if (set1.size !== 2 || !cols1.every(c => set2.has(c))) continue;
        const [c1, c2] = cols1;
        const eliminations = [];
        for (let r = 0; r < 9; r++) {
          if (r === r1 || r === r2) continue;
          for (const c of [c1, c2]) {
            if (getCandidates(board, candidates, r, c)?.has(digit)) eliminations.push({ r, c, digit });
          }
        }
        if (eliminations.length > 0) {
          return {
            techniqueId: 'xwing',
            techniqueName: TECHNIQUE_INFO.xwing.name,
            description: `행 ${r1 + 1}과 행 ${r2 + 1}에서 ${digit}의 후보가 열 ${c1 + 1}, ${c2 + 1}에만 있어, 그 두 열의 다른 행들에서 ${digit}을 제거합니다.`,
            action: 'eliminate',
            eliminations,
            highlights: [
              { r: r1, c: c1, type: 'reason', digit },
              { r: r1, c: c2, type: 'reason', digit },
              { r: r2, c: c1, type: 'reason', digit },
              { r: r2, c: c2, type: 'reason', digit },
            ],
          };
        }
      }
    }
    for (let c1 = 0; c1 < 8; c1++) {
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        const rows1 = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(r => getCandidates(board, candidates, r, c1)?.has(digit));
        const rows2 = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(r => getCandidates(board, candidates, r, c2)?.has(digit));
        if (rows1.length !== 2 || rows2.length !== 2) continue;
        const set1 = new Set(rows1), set2 = new Set(rows2);
        if (!rows1.every(r => set2.has(r))) continue;
        const [r1, r2] = rows1;
        const eliminations = [];
        for (let c = 0; c < 9; c++) {
          if (c === c1 || c === c2) continue;
          for (const r of [r1, r2]) {
            if (getCandidates(board, candidates, r, c)?.has(digit)) eliminations.push({ r, c, digit });
          }
        }
        if (eliminations.length > 0) {
          return {
            techniqueId: 'xwing',
            techniqueName: TECHNIQUE_INFO.xwing.name,
            description: `열 ${c1 + 1}과 열 ${c2 + 1}에서 ${digit}의 후보가 행 ${r1 + 1}, ${r2 + 1}에만 있어, 그 두 행의 다른 열들에서 ${digit}을 제거합니다.`,
            action: 'eliminate',
            eliminations,
            highlights: [
              { r: r1, c: c1, type: 'reason', digit },
              { r: r1, c: c2, type: 'reason', digit },
              { r: r2, c: c1, type: 'reason', digit },
              { r: r2, c: c2, type: 'reason', digit },
            ],
          };
        }
      }
    }
  }
  return null;
}

/** 적용할 기법 목록 (쉬운 순) */
const TECHNIQUE_FUNCTIONS = [
  findFullUnit,
  findNakedSingle,
  findHiddenSingleBox,
  findHiddenSingleRow,
  findHiddenSingleCol,
  findPointing,
  findClaiming,
  findNakedPair,
  findHiddenPair,
  findXWing,
];

/**
 * 다음 적용 가능한 기법 찾기
 */
export function findNextStep(board, candidates) {
  for (const fn of TECHNIQUE_FUNCTIONS) {
    const step = fn(board, candidates);
    if (step) return step;
  }
  return null;
}

export { TECHNIQUE_FUNCTIONS };
