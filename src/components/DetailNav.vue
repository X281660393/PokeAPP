<script setup lang="ts">
import { ArrowIcon } from '@/components'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  back: []
}>()
</script>

<template>
  <div class="detail-nav">
    <ArrowIcon
      dir="left"
      :size="22"
      color="#2b2d42"
      class="detail-nav-back"
      @click="emit('back')"
    />
    <span class="detail-nav-title">{{ title }}</span>
    <slot name="right">
      <span></span>
    </slot>
  </div>
</template>

<style scoped>
.detail-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--poke-surface);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 10;
}

.detail-nav-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--poke-ink);
}

.detail-nav-back {
  cursor: pointer;
  padding: 4px;
  margin: -4px;
}
</style>
