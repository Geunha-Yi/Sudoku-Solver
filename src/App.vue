<template>
  <div class="container">
    <header class="header">
      <h1>스도쿠 솔버</h1>
      <p class="subtitle">기초 ~ 최후의 수단까지 전체 기법 지원 · Vue</p>
    </header>

    <main class="main">
      <div class="main-grid">
        <div class="game-area">
          <SudokuBoard
            ref="boardRef"
            :board="displayBoard"
            :given-cells="givenCells"
            :highlights="currentHighlights"
            :eliminations="currentEliminations"
            :read-only="isSolving"
            @input="onBoardInput"
          />

          <div class="controls">
            <button class="btn btn-solve" @click="solve" :disabled="isSolving && steps.length > 0">
              단계별 풀기
            </button>
            <button class="btn btn-nav" @click="prevStep" :disabled="!canPrev">◀ 이전</button>
            <button class="btn btn-nav" @click="nextStep" :disabled="!canNext">다음 ▶</button>
            <button class="btn btn-clear" @click="clear">초기화</button>
            <button class="btn btn-example" @click="loadRandom">랜덤 예제</button>
          </div>

          <div class="message" :class="messageType">{{ message }}</div>
        </div>

        <StepLog
          class="step-log-wrap"
          :steps="steps"
          :current-index="currentStepIndex"
          @select="selectStep"
        />
      </div>
    </main>

    <footer class="footer">
      <p>기초(가득찬유닛, 드러난/숨겨진 하나) · 초급(포인팅, 클레이밍, 부분집합, 물고기) · 중급(윙, 체인, 핀드피쉬, BUG) · 고급(ALS, Sue de Coq) · 최후(강제 체인)</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SudokuBoard from './components/SudokuBoard.vue'
import StepLog from './components/StepLog.vue'
import { isBoardValid } from './lib/solver.js'
import { solveStepByStep } from './lib/stepSolver.js'
import { generatePuzzle } from './lib/puzzleGenerator.js'

const boardRef = ref(null)
const board = ref(Array(9).fill(null).map(() => Array(9).fill(0)))
const givenCells = ref(new Set())
const steps = ref([])
const boards = ref([])
const currentStepIndex = ref(0)
const message = ref('')
const messageType = ref('')

const isSolving = computed(() => steps.value.length > 0)
const displayBoard = computed(() => {
  if (boards.value.length === 0) return board.value
  const idx = currentStepIndex.value + 1
  return boards.value[Math.min(idx, boards.value.length - 1)] ?? boards.value[0]
})

const currentStep = computed(() => steps.value[currentStepIndex.value] ?? null)
const techniqueInfo = computed(() => {
  const s = currentStep.value
  if (!s) return null
  return TECHNIQUE_INFO[s.techniqueId] ?? null
})

const currentHighlights = computed(() => {
  const s = currentStep.value
  if (!s?.highlights) return []
  return s.highlights.filter(h => h.type !== 'eliminate')
})
const currentEliminations = computed(() => currentStep.value?.eliminations ?? [])

const canPrev = computed(() => currentStepIndex.value > 0)
const canNext = computed(() => currentStepIndex.value < steps.value.length - 1)

function onBoardInput(r, c, val) {
  const v = val === '' ? 0 : parseInt(val, 10)
  const num = isNaN(v) || v < 1 || v > 9 ? 0 : v
  board.value = board.value.map((row, ri) =>
    row.map((cell, ci) => (ri === r && ci === c) ? num : cell))
}

function solve() {
  const data = board.value.map(row => [...row])
  if (!data.some(row => row.some(v => v > 0))) {
    message.value = '숫자를 입력해주세요.'
    messageType.value = 'error'
    return
  }
  if (!isBoardValid(data)) {
    message.value = '스도쿠 규칙에 맞지 않습니다.'
    messageType.value = 'error'
    return
  }

  const { steps: s, boards: b, solved } = solveStepByStep(data)
  steps.value = s
  boards.value = b
  currentStepIndex.value = 0

  const initialGiven = new Set()
  data.forEach((row, r) => row.forEach((val, c) => { if (val > 0) initialGiven.add(r * 9 + c) }))
  givenCells.value = initialGiven

  if (!solved) {
    message.value = '해결할 수 없는 퍼즐입니다.'
    messageType.value = 'error'
    return
  }
  message.value = `총 ${s.length}단계로 풀이 완료`
  messageType.value = 'success'
}

function selectStep(idx) {
  currentStepIndex.value = Math.max(0, Math.min(idx, steps.value.length - 1))
}
function prevStep() {
  if (canPrev.value) currentStepIndex.value--
}
function nextStep() {
  if (canNext.value) currentStepIndex.value++
}

function clear() {
  board.value = Array(9).fill(null).map(() => Array(9).fill(0))
  givenCells.value = new Set()
  steps.value = []
  boards.value = []
  currentStepIndex.value = 0
  message.value = ''
  messageType.value = ''
}

function loadRandom() {
  const keepCount = 25 + Math.floor(Math.random() * 20)
  const puzzle = generatePuzzle(keepCount)
  board.value = puzzle.map(row => [...row])
  givenCells.value = new Set()
  puzzle.forEach((row, r) => row.forEach((val, c) => { if (val > 0) givenCells.value.add(r * 9 + c) }))
  steps.value = []
  boards.value = []
  message.value = '랜덤 퍼즐 생성됨. 단계별 풀기를 눌러보세요.'
  messageType.value = ''
}
</script>
