<script setup lang="ts">
import { computed } from 'vue'
import type { PokemonStat } from '@/types'
import { MAX_STAT_VALUE, statColor } from '@/constants/pokemon'

const props = defineProps<{
  stat: PokemonStat
}>()

const barWidth = computed(() => `${(props.stat.value / MAX_STAT_VALUE) * 100}%`)

const barColor = computed(() => statColor(props.stat.value))
</script>

<template>
  <div class="stat-row">
    <span class="stat-name">{{ stat.nameZh }}</span>
    <span class="stat-value">{{ stat.value }}</span>
    <div class="stat-bar-bg">
      <div class="stat-bar-fill" :style="{ width: barWidth, backgroundColor: barColor }"></div>
    </div>
  </div>
</template>

<style scoped>
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-name {
  width: 40px;
  font-size: 13px;
  color: var(--poke-ink-2);
  font-weight: 500;
}

.stat-value {
  width: 32px;
  font-size: 13px;
  color: var(--poke-ink);
  font-weight: 600;
  text-align: right;
}

.stat-bar-bg {
  flex: 1;
  height: 8px;
  background: #eef0f3;
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
</style>
