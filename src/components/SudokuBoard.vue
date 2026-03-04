<template>
  <div class="board-wrapper">
    <div class="sudoku-board">
      <div
        v-for="(cell, idx) in 81"
        :key="idx"
        class="cell"
        :class="cellClasses(idx)"
      >
        <input
          type="text"
          class="cell-input"
          :value="cellValue(idx)"
          :readonly="readOnly"
          maxlength="1"
          inputmode="numeric"
          @input="onInput($event, idx)"
          @keydown="onKeydown($event, idx)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  board: { type: Array, required: true },
  givenCells: { type: Set, default: () => new Set() },
  highlights: { type: Array, default: () => [] },
  eliminations: { type: Array, default: () => [] },
  readOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['input'])

function cellValue(idx) {
  const r = Math.floor(idx / 9), c = idx % 9
  const v = props.board[r]?.[c]
  return v > 0 ? String(v) : ''
}

function cellClasses(idx) {
  const r = Math.floor(idx / 9), c = idx % 9
  const classes = []
  if (props.givenCells.has(idx)) classes.push('given')
  else if (props.board[r]?.[c] > 0) classes.push('solved')
  const h = props.highlights.find(x => (x.r ?? x.row) === r && (x.c ?? x.col) === c)
  if (h) classes.push('highlight-reason')
  const e = props.eliminations.find(x => (x.r ?? x.row) === r && (x.c ?? x.col) === c)
  if (e) classes.push('highlight-eliminate')
  const placeHighlight = props.highlights.find(x => x.type === 'place' && (x.r ?? x.row) === r && (x.c ?? x.col) === c)
  if (placeHighlight) classes.push('highlight-place')
  return classes
}

function onInput(e, idx) {
  let val = e.target.value.replace(/[^1-9]/g, '')
  if (val.length > 1) val = val.slice(-1)
  emit('input', Math.floor(idx / 9), idx % 9, val)
}

function onKeydown(e, idx) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    const next = Math.min(idx + 1, 80)
    document.querySelector(`.sudoku-board .cell:nth-child(${next + 1}) input`)?.focus()
    e.preventDefault()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    const prev = Math.max(idx - 1, 0)
    document.querySelector(`.sudoku-board .cell:nth-child(${prev + 1}) input`)?.focus()
    e.preventDefault()
  }
}
</script>
