<script setup lang="ts">
import { computed } from 'vue'
import { getTypeColor, getTypeName, getTypeIconPath, getTextColorOn } from '@/constants/pokemon'

const props = withDefaults(defineProps<{
  type: string | null   // null = "全部"
  active?: boolean
  disabled?: boolean
}>(), {
  active: false,
  disabled: false,
})

const isAll = computed(() => props.type === null)

const label = computed(() => isAll.value ? '全部' : (props.type ? getTypeName(props.type) : ''))

/** 选中状态的背景 = 属性本色 */
const activeBgColor = computed(() => {
  if (isAll.value) return '#e8e8e8'
  return props.type ? getTypeColor(props.type) : ''
})

/** 选中状态的文字颜色 */
const activeTextColor = computed(() => {
  if (isAll.value) return '#666'
  return getTextColorOn(activeBgColor.value)
})

/** hover 状态的背景 = 属性淡色 */
const hoverBgColor = computed(() => {
  if (isAll.value) return '#f0f0f0'
  return props.type ? lightenColor(getTypeColor(props.type), 80) : ''
})

const iconPath = computed(() => {
  if (!props.type) return ''
  return getTypeIconPath(props.type)
})

/**
 * 将 hex 颜色变淡（混合白色）
 * @param hex 原始颜色 #RRGGBB
 * @param alpha 白色混合比例 (0-100)，越大越淡
 * @returns rgba 或 hex
 */
function lightenColor(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const a = alpha / 100
  const nr = Math.round(r + (255 - r) * a)
  const ng = Math.round(g + (255 - g) * a)
  const nb = Math.round(b + (255 - b) * a)
  return `rgb(${nr}, ${ng}, ${nb})`
}
</script>

<template>
  <span
    class="type-filter-tag"
    :class="{ active, 'is-all': isAll, disabled: disabled && !active }"
    :style="{
      ...(active ? {
        backgroundColor: activeBgColor,
        color: activeTextColor,
      } : {}),
      '--hover-bg': hoverBgColor,
      '--hover-color': isAll ? '#444' : getTypeColor(props.type || ''),
    } as any"
  >
    <!-- 全部的网格图标（灰色） -->
    <svg v-if="isAll" class="type-icon type-icon--grid" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
    <!-- 属性图标 -->
    <svg
      v-else-if="iconPath"
      class="type-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path :d="iconPath" />
    </svg>
    <span class="type-label">{{ label }}</span>
  </span>
</template>

<style scoped>
.type-filter-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 12px;
  width: 54px;
  height: 30px;
  padding: 0;
  border-radius: 12px;
  background: white;
  color: #555;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease,
              box-shadow 0.2s ease, transform 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  user-select: none;
  border: 1px solid transparent;
  position: relative;
}

/* 非选中 hover：淡属性色背景 */
.type-filter-tag:not(.is-all):not(.active):hover {
  background-color: var(--hover-bg, #f5f5f5);
  color: var(--hover-color, #555);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* 全部标签 hover */
.type-filter-tag.is-all:hover {
  background: #f0f0f0;
  color: #444;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 选中状态 */
.type-filter-tag.active:not(.is-all) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.type-filter-tag.is-all.active {
  font-weight: 600;
  background: #e8e8e8 !important;
  color: #666 !important;
  border-color: #ccc;
  transform: scale(1.03);
}

/* 图标默认灰色（未选中时） */
.type-filter-tag:not(.active) .type-icon {
  color: #bbb;
}

/* hover 时图标变为属性色 */
.type-filter-tag:not(.is-all):not(.active):hover .type-icon {
  color: var(--hover-color, #888);
}

/* 选中后图标跟随文字颜色 */
.type-filter-tag.active .type-icon {
  color: inherit;
  opacity: 0.9;
}

.type-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  stroke-width: 2.2;
  transition: color 0.2s ease;
}

.type-icon--grid {
  width: 13px;
  height: 13px;
}

.type-label {
  white-space: nowrap;
}

/* 已满不可选状态 */
.type-filter-tag.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.type-filter-tag.disabled:hover {
  background: white;
  color: #555;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
