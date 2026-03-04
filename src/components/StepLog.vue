<template>
  <div class="step-log">
    <div class="log-header">
      <span class="log-title">풀이 로그</span>
      <span class="log-count" v-if="steps.length > 0">{{ steps.length }}단계</span>
    </div>
    <div class="log-messages" ref="logRef">
      <div v-if="steps.length === 0" class="log-empty">
        단계별 풀기를 실행하면 풀이 과정이 여기에 기록됩니다.
      </div>
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="log-message"
        :class="{ active: idx === currentIndex, 'is-backtrack': step?.isBacktrack }"
        :data-index="idx"
        @click="goToStep(idx)"
      >
        <div class="message-avatar">{{ idx + 1 }}</div>
        <div class="message-body">
          <div class="message-meta">
            <span class="message-technique">{{ step.techniqueName }}</span>
            <span class="message-step">#{{ idx + 1 }}</span>
          </div>
          <div class="message-text">{{ step.description }}</div>
          <div v-if="getTechniqueInfo(step)?.desc" class="message-reason">
            [{{ categoryLabel(getTechniqueInfo(step)?.category) }}] {{ getTechniqueInfo(step).desc }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { TECHNIQUE_INFO } from '../lib/techniques.js'

const props = defineProps({
  steps: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: 0 },
})

const emit = defineEmits(['select'])
const logRef = ref(null)

const CATEGORY_MAP = { basic: '기초', elementary: '초급', intermediate: '중급', advanced: '고급', lastResort: '최후의 수단' }
function getTechniqueInfo(step) {
  return step?.techniqueId ? TECHNIQUE_INFO[step.techniqueId] : null
}
function categoryLabel(cat) {
  return cat ? (CATEGORY_MAP[cat] ?? cat) : ''
}
function goToStep(idx) {
  emit('select', idx)
}

watch(
  () => [props.currentIndex, props.steps.length],
  async () => {
    await nextTick()
    const el = logRef.value?.querySelector(`.log-message[data-index="${props.currentIndex}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
)
</script>
