/**
 * 스도쿠 솔버 앱 - 단계별 풀이 및 기법 설명
 */

import { isBoardValid } from './solver.js';
import { solveStepByStep } from './stepSolver.js';
import { TECHNIQUE_INFO } from './techniques.js';

const board = document.getElementById('sudoku-board');
const cells = [];
const givenCells = new Set();

let solutionSteps = [];
let solutionBoards = [];
let currentStepIndex = 0;
let initialBoard = null;

function createBoard() {
  board.innerHTML = '';
  cells.length = 0;
  givenCells.clear();

  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-input';
    input.maxLength = 1;
    input.inputMode = 'numeric';
    input.dataset.index = i;

    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val === '' || val === '0') { e.target.value = ''; return; }
      const num = parseInt(val, 10);
      e.target.value = (num >= 1 && num <= 9) ? String(num) : '';
    });

    input.addEventListener('keydown', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        document.querySelector(`[data-index="${Math.min(idx + 1, 80)}"]`)?.focus();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        document.querySelector(`[data-index="${Math.max(idx - 1, 0)}"]`)?.focus();
        e.preventDefault();
      }
    });

    cell.appendChild(input);
    board.appendChild(cell);
    cells.push({ cell, input });
  }
}

function getBoardData() {
  const data = Array(9).fill(null).map(() => Array(9).fill(0));
  cells.forEach(({ input }, i) => {
    const r = Math.floor(i / 9), c = i % 9;
    const val = parseInt(input.value, 10);
    data[r][c] = isNaN(val) ? 0 : val;
  });
  return data;
}

function setBoardData(data, markGiven = false) {
  if (markGiven) givenCells.clear();
  data.forEach((row, r) => {
    row.forEach((val, c) => {
      const idx = r * 9 + c;
      cells[idx].input.value = val > 0 ? String(val) : '';
      cells[idx].input.readOnly = false;
      cells[idx].cell.classList.remove('solved', 'error', 'highlight-place', 'highlight-reason', 'highlight-eliminate');
      if (markGiven && val > 0) {
        givenCells.add(idx);
        cells[idx].cell.classList.add('given');
      } else if (!markGiven) {
        if (givenCells.has(idx)) cells[idx].cell.classList.add('given');
        else {
          cells[idx].cell.classList.remove('given');
          if (val > 0) cells[idx].cell.classList.add('solved');
        }
      }
    });
  });
}

function showBoardOnly(data) {
  data.forEach((row, r) => {
    row.forEach((val, c) => {
      const idx = r * 9 + c;
      cells[idx].input.value = val > 0 ? String(val) : '';
    });
  });
}

function showMessage(text, type = '') {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = `message ${type}`;
}

function clearHighlights() {
  cells.forEach(({ cell }) => {
    cell.classList.remove('highlight-place', 'highlight-reason', 'highlight-eliminate');
  });
}

function applyHighlights(step) {
  clearHighlights();
  if (!step || !step.highlights) return;
  for (const h of step.highlights) {
    const idx = h.r * 9 + h.c;
    if (step.action === 'place' && h.type === 'place') {
      cells[idx].cell.classList.add('highlight-place');
    } else if (h.type === 'reason') {
      cells[idx].cell.classList.add('highlight-reason');
    }
  }
  if (step.eliminations) {
    for (const { r, c } of step.eliminations) {
      cells[r * 9 + c].cell.classList.add('highlight-eliminate');
    }
  }
}

function updateStepPanel() {
  const panel = document.getElementById('step-panel');
  if (solutionSteps.length === 0) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');

  const step = solutionSteps[currentStepIndex];
  document.getElementById('step-current').textContent = currentStepIndex + 1;
  document.getElementById('step-total').textContent = solutionSteps.length;
  document.getElementById('technique-badge').textContent = step.techniqueName;
  document.getElementById('step-description').textContent = step.description;

  const info = TECHNIQUE_INFO[step.techniqueId];
  const reasonEl = document.getElementById('step-reason');
  if (info?.desc) {
    reasonEl.textContent = `[${info.category}] ${info.desc}`;
    reasonEl.style.display = 'block';
  } else if (step.isBacktrack) {
    reasonEl.textContent = '[최후의 수단] 논리적 기법으로 풀 수 없는 부분을 시행착오로 해결합니다.';
    reasonEl.style.display = 'block';
  } else {
    reasonEl.style.display = 'none';
  }

  applyHighlights(step);
}

function setStepIndex(index) {
  currentStepIndex = Math.max(0, Math.min(index, solutionSteps.length - 1));
  const boardData = solutionBoards[currentStepIndex + 1] ?? solutionBoards[currentStepIndex];
  showBoardOnly(boardData);
  cells.forEach(({ input }) => { input.readOnly = solutionSteps.length > 0; });
  setBoardData(boardData, false);
  updateStepPanel();

  document.getElementById('btn-prev').disabled = currentStepIndex <= 0;
  document.getElementById('btn-next').disabled = currentStepIndex >= solutionSteps.length - 1;
}

function solve() {
  const data = getBoardData();
  const hasInput = data.some(row => row.some(v => v > 0));
  if (!hasInput) {
    showMessage('숫자를 입력해주세요.', 'error');
    return;
  }
  if (!isBoardValid(data)) {
    showMessage('입력한 스도쿠 규칙에 맞지 않습니다.', 'error');
    return;
  }

  const { steps, boards, finalBoard, solved } = solveStepByStep(data);
  solutionSteps = steps;
  solutionBoards = boards;
  initialBoard = data.map(row => [...row]);

  if (!solved) {
    showMessage('해결할 수 없는 퍼즐입니다.', 'error');
    return;
  }

  currentStepIndex = 0;
  givenCells.clear();
  data.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val > 0) givenCells.add(r * 9 + c);
    });
  });

  setStepIndex(0);
  showMessage(`총 ${steps.length}단계로 풀이 완료. 이전/다음으로 각 단계를 확인하세요.`, 'success');
}

function prevStep() {
  if (currentStepIndex > 0) setStepIndex(currentStepIndex - 1);
}

function nextStep() {
  if (currentStepIndex < solutionSteps.length - 1) setStepIndex(currentStepIndex + 1);
}

function clear() {
  solutionSteps = [];
  solutionBoards = [];
  currentStepIndex = 0;
  setBoardData(Array(9).fill(null).map(() => Array(9).fill(0)));
  givenCells.clear();
  cells.forEach(({ cell, input }) => {
    cell.classList.remove('given', 'solved', 'error');
    input.readOnly = false;
  });
  clearHighlights();
  document.getElementById('step-panel').classList.add('hidden');
  document.getElementById('btn-prev').disabled = true;
  document.getElementById('btn-next').disabled = true;
  showMessage('');
}

const examplePuzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

function loadExample() {
  setBoardData(examplePuzzle, true);
  showMessage('예제 퍼즐을 불러왔습니다. "단계별 풀기"를 눌러보세요!');
}

document.getElementById('btn-solve').addEventListener('click', solve);
document.getElementById('btn-prev').addEventListener('click', prevStep);
document.getElementById('btn-next').addEventListener('click', nextStep);
document.getElementById('btn-clear').addEventListener('click', clear);
document.getElementById('btn-example').addEventListener('click', loadExample);

createBoard();
