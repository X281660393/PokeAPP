<script setup lang="ts">
// 本地内联 SVG 箭头，不依赖 Vant 字体（避免 CSP 拦截字体导致图标不可见）
withDefaults(
  defineProps<{
    /** 方向：left / right / up / down */
    dir?: 'left' | 'right' | 'up' | 'down'
    size?: number | string
    color?: string
  }>(),
  {
    dir: 'right',
    size: 16,
    color: 'currentColor',
  },
)

const rotateMap: Record<string, number> = {
  left: 0,
  up: -90,
  right: 180,
  down: 90,
}
</script>

<template>
  <svg
    class="arrow-icon"
    :width="typeof size === 'number' ? size + 'px' : size"
    :height="typeof size === 'number' ? size + 'px' : size"
    viewBox="0 0 24 24"
    fill="none"
    :style="{ transform: `rotate(${rotateMap[dir] ?? 0}deg)` }"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 18l-6-6 6-6"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.arrow-icon {
  display: block;
  flex-shrink: 0;
  transition: transform 0.2s;
}
</style>
