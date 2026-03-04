/**
 * 단계별 스도쿠 솔버
 * 기법을 하나씩 적용하며 풀이 절차를 생성합니다.
 */

import { computeCandidates, copyBoard } from './candidates.js';
import { findNextStep } from './techniques.js';
import { solveSudoku } from './solver.js';

/**
 * 단계별 풀이 실행 - 각 단계를 배열로 반환
 * @param {number[][]} board - 초기 보드
 * @returns {{ steps: object[], boards: number[][][], finalBoard: number[][], solved: boolean }}
 */
export function solveStepByStep(board) {
  const steps = [];
  const boards = [copyBoard(board)];
  let state = copyBoard(board);
  let candidates = computeCandidates(state);

  while (true) {
    const step = findNextStep(state, candidates);
    if (!step) break;

    steps.push(step);

    if (step.action === 'place' && step.place) {
      const { row, col, digit } = step.place;
      state[row][col] = digit;
      boards.push(copyBoard(state));
      candidates = computeCandidates(state);
    } else if (step.action === 'eliminate') {
      for (const { r, c, digit } of step.eliminations) {
        if (candidates[r][c]) candidates[r][c].delete(digit);
      }
      boards.push(copyBoard(state));
    }

    const isComplete = state.every(row => row.every(c => c !== 0));
    if (isComplete) return { steps, boards, finalBoard: state, solved: true };
  }

  const isComplete = state.every(row => row.every(c => c !== 0));
  if (!isComplete) {
    const solvedBoard = copyBoard(state);
    if (solveSudoku(solvedBoard)) {
      steps.push({
        techniqueId: 'backtracking',
        techniqueName: '백트래킹',
        description: '현재 구현된 논리적 기법으로는 더 진행할 수 없어, 시행착오(백트래킹)로 나머지를 풀었습니다.',
        action: 'place',
        place: null,
        highlights: [],
        isBacktrack: true,
      });
      boards.push(solvedBoard);
      return { steps, boards, finalBoard: solvedBoard, solved: true };
    }
  }

  return { steps, boards, finalBoard: state, solved: isComplete };
}

/**
 * 풀이 가능 여부만 빠르게 확인 (백트래킹)
 */
export function canSolve(board) {
  const copy = copyBoard(board);
  return solveSudoku(copy);
}
