<script setup lang="ts">
import { computed, ref } from "vue";
import type { PokemonListItem } from "@/types";
import TypeBadge from "./TypeBadge.vue";
import { useSettingsStore } from "@/stores/settings";

const props = defineProps<{
  pokemon: PokemonListItem;
  /** 是否被过滤掉（显示为灰色不可用状态） */
  dimmed?: boolean;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();

const settings = useSettingsStore();

const idText = computed(() => `#${String(props.pokemon.id).padStart(3, "0")}`);
// 图片在线加载失败时隐藏，避免裂图（保留编号+名称）
const imgFailed = ref(false);

function handleClick() {
  emit("click", props.pokemon.id);
}
function onImgError() {
  imgFailed.value = true;
}
</script>

<template>
  <div
    class="pk-card"
    :class="{ 'pk-card--dimmed': dimmed }"
    @click="handleClick"
  >
    <!-- 编号 -->
    <span class="pk-card__id">{{ idText }}</span>

    <!-- 图片区域（仅开启时显示） -->
    <div
      v-if="settings.state.showImages"
      class="pk-card__img-wrap"
    >
      <img
        v-if="!imgFailed"
        class="pk-card__sprite"
        :src="pokemon.spriteUrl"
        :alt="pokemon.nameZh"
        loading="lazy"
        draggable="false"
        @error="onImgError"
      />
      <span
        v-else
        class="pk-card__fallback"
        >{{ idText }}</span
      >
    </div>

    <!-- 名称 -->
    <div class="pk-card__name">{{ pokemon.nameZh }}</div>

    <!-- 属性标签 -->
    <div class="pk-card__types">
      <TypeBadge
        v-for="t in pokemon.types"
        :key="t"
        :type="t"
        size="sm"
      />
    </div>
  </div>
</template>

<style scoped>
.pk-card {
  position: relative;
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--poke-surface);
  padding: 18px 8px 12px;
  box-shadow: var(--shadow-sm);
  will-change: transform;
}

/* 顶部品牌色细条 */
.pk-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--poke-red), #ff8a5c);
  opacity: 0.85;
}

/* ---- hover 效果 ---- */
@media (hover: hover) {
  .pk-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.25s ease;
  }
  .pk-card:not(:hover) {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
}

.pk-card:active {
  transform: scale(0.97);
  transition: transform 0.1s ease;
}

/* ---- 编号 ---- */
.pk-card__id {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--poke-ink-3);
  letter-spacing: 0.5px;
  z-index: 2;
  font-variant-numeric: tabular-nums;
}

/* ---- 图片区域 ---- */
.pk-card__img-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  background: radial-gradient(circle at 50% 40%, #fef0e8 0%, #f7f8fb 75%);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}

.pk-card__sprite {
  width: 78px;
  height: 78px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(43, 45, 66, 0.12));
}

.pk-card__fallback {
  font-size: 20px;
  font-weight: 800;
  color: var(--poke-ink-3);
  letter-spacing: 1px;
}

/* ---- 名称 ---- */
.pk-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--poke-ink);
  text-align: center;
  margin-top: 4px;
  line-height: 1.3;
}

/* ---- 属性标签 ---- */
.pk-card__types {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 8px;
}

/* ---- 版本范围外：灰色蒙版覆盖（颜色不变，仅加半透明灰层） ---- */
.pk-card--dimmed {
  pointer-events: none;
}
.pk-card--dimmed::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(245, 246, 248, 0.66);
  border-radius: inherit;
  z-index: 3;
  pointer-events: none;
}
</style>
