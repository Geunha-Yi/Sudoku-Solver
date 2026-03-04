<template>
  <div class="step-panel">
    <div class="step-header">
      <span class="step-number">단계 {{ stepNumber }} / {{ totalSteps }}</span>
      <span class="technique-badge">{{ step?.techniqueName ?? '-' }}</span>
    </div>
    <div class="step-description">{{ step?.description ?? '' }}</div>
    <div v-if="techniqueInfo?.desc" class="step-reason">[{{ categoryName }}] {{ techniqueInfo.desc }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stepNumber: { type: Number, default: 0 },
  totalSteps: { type: Number, default: 0 },
  step: { type: Object, default: null },
  techniqueInfo: { type: Object, default: null },
})

const categoryName = computed(() => {
  const c = props.techniqueInfo?.category
  const map = { basic: '기초', elementary: '초급', intermediate: '중급', advanced: '고급', lastResort: '최후의 수단' }
  return map[c] ?? c ?? ''
})
</script>
