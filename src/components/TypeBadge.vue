<script setup lang="ts">
import { computed } from 'vue'
import { getTypeColor, getTypeName } from '@/constants/pokemon'

const props = withDefaults(defineProps<{
  type: string
  size?: 'sm' | 'md'
}>(), {
  size: 'sm',
})

const color = computed(() => getTypeColor(props.type))
const label = computed(() => getTypeName(props.type))
</script>

<template>
  <span class="type-badge" :class="`type-badge--${size}`" :style="{ backgroundColor: color }">
    {{ label }}
  </span>
</template>

<style scoped>
.type-badge {
  display: inline-block;
  color: white;
  font-weight: 600;
  border-radius: 8px;
  white-space: nowrap;
  letter-spacing: 0.5px;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.12);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}

.type-badge--sm {
  font-size: 11px;
  padding: 3px 10px;
}

.type-badge--md {
  font-size: 13px;
  padding: 5px 14px;
  border-radius: 10px;
}
</style>
