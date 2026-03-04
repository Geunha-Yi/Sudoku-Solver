import { computeCandidates, copyBoard } from './candidates.js';
import { findNextStep } from './techniques.js';
import { solveSudoku } from './solver.js';

function normalizePlace(place) {
  if (!place) return null;
  return {
    row: place.row ?? place.r,
    col: place.col ?? place.c,
    digit: place.digit,
  };
}

export function solveStepByStep(board) {
  const steps = [];
  const boards = [copyBoard(board)];
  let state = copyBoard(board);
  let candidates = computeCandidates(state);

  while (true) {
    const step = findNextStep(state, candidates);
    if (!step) break;

    if (step.place) {
      step.place = normalizePlace(step.place);
    }
    steps.push(step);

    if (step.action === 'place' && step.place) {
      const { row, col, digit } = step.place;
      state[row][col] = digit;
      boards.push(copyBoard(state));
      candidates = computeCandidates(state);
    } else if (step.action === 'eliminate') {
      for (const e of step.eliminations) {
        const r = e.r ?? e.row, c = e.c ?? e.col;
        if (candidates[r]?.[c]) candidates[r][c].delete(e.digit);
      }
      boards.push(copyBoard(state));
    }

    if (state.every(row => row.every(c => c !== 0))) {
      return { steps, boards, finalBoard: state, solved: true };
    }
  }

  const solvedBoard = copyBoard(state);
  if (solveSudoku(solvedBoard)) {
    steps.push({
      techniqueId: 'backtracking',
      techniqueName: '백트래킹',
      description: '논리적 기법으로 더 진행할 수 없어 시행착오로 나머지를 풀었습니다.',
      action: 'place',
      place: null,
      highlights: [],
      isBacktrack: true,
    });
    boards.push(solvedBoard);
    return { steps, boards, finalBoard: solvedBoard, solved: true };
  }

  return { steps, boards, finalBoard: state, solved: false };
}
