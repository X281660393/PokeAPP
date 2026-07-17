<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="info-card">
    <h3 v-if="title" class="card-title">{{ title }}</h3>
    <slot />
  </div>
</template>

<style scoped>
.info-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 18px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--poke-ink);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title::before {
  content: "";
  width: 4px;
  height: 15px;
  border-radius: 2px;
  background: var(--poke-red);
}
</style>
