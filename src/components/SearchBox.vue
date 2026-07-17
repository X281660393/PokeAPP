<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  { placeholder: '搜索' },
)
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const value = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

function onInput(e: Event) {
  value.value = (e.target as HTMLInputElement).value
}
function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="search-box">
    <svg
      class="sb-search-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z"
      />
    </svg>
    <input
      class="sb-input"
      type="text"
      inputmode="search"
      :placeholder="placeholder"
      :value="value"
      @input="onInput"
    />
    <button
      v-if="value"
      type="button"
      class="sb-clear"
      aria-label="清空"
      @click="clear"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          d="M6 6l12 12M18 6L6 18"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f2f5;
  border-radius: var(--radius-pill, 999px);
  padding: 0 12px;
  height: 36px;
}
.sb-search-icon {
  color: var(--poke-ink-3, #adb5bd);
  flex-shrink: 0;
}
.sb-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--poke-ink, #333);
}
.sb-input::placeholder {
  color: var(--poke-ink-3, #adb5bd);
}
.sb-clear {
  flex-shrink: 0;
  border: none;
  background: #ced4da;
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.sb-clear:active {
  transform: scale(0.9);
}
</style>
