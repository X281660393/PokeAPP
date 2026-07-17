<script setup lang="ts">
import { computed, ref } from "vue";
import { usePokedexStore } from "@/stores/pokedex";
import { useSettingsStore } from "@/stores/settings";
import { MEGA_EVOLUTIONS } from "@/data/pokemon/pokemon-mega";
import type { EvoNode, MegaForm } from "@/types";
import { ArrowIcon } from "@/components";

const props = defineProps<{
  node: EvoNode;
  currentId: number;
}>();
const emit = defineEmits<{ (e: "pick", id: number): void }>();

const store = usePokedexStore();
const settings = useSettingsStore();

const info = computed(() => store.getPokemonDetail(props.node.id));
// 是否显示图片（遵循设置）
const showImages = computed(() => settings.state.showImages);
/** 图片加载失败时隐藏 */
const imgFailed = ref(false);
function onImgError() {
  imgFailed.value = true;
}

// 当前节点是否有超进化形态
const megaForms = computed<MegaForm[]>(() => {
  return MEGA_EVOLUTIONS[props.node.id] || [];
});

function onClick(id: number) {
  if (id !== props.currentId) emit("pick", id);
}
</script>

<template>
  <div class="evo-chain">
    <!-- 横向主链：当前节点 + 连接符 + 后代 -->
    <div class="evo-main">
      <button
        class="evo-node"
        :class="{ current: node.id === currentId }"
        type="button"
        @click="onClick(node.id)"
      >
        <img
          v-if="info.spriteUrl && showImages && !imgFailed"
          :src="info.spriteUrl"
          :alt="info.nameZh"
          class="evo-sprite"
          loading="lazy"
          @error="onImgError"
        />
        <span v-else class="evo-fallback">#{{ String(node.id).padStart(3, "0") }}</span>
        <span class="evo-name">{{ info.nameZh }}</span>
        <span class="evo-id">#{{ String(node.id).padStart(3, "0") }}</span>
      </button>

      <!-- 有后代时：连接线 + 子级区域（仅进化后代，超进化单独成行） -->
      <div v-if="node.evolvesTo.length" class="evo-next">
        <div
          v-for="child in node.evolvesTo"
          :key="child.id"
          class="evo-branch"
        >
          <span class="evo-arrow-wrap">
            <ArrowIcon dir="right" :size="14" color="#c8cdd2" />
            <i class="evo-method">{{ child.method }}</i>
          </span>
          <EvoChain
            :node="child"
            :current-id="currentId"
            @pick="(id) => emit('pick', id)"
          />
        </div>
      </div>
    </div>

    <!-- 超进化：单独起一行 -->
    <div v-if="megaForms.length" class="evo-mega-row">
      <div class="evo-mega-rowhead">
        <ArrowIcon dir="right" :size="13" color="#f5a623" />
        <span>超进化</span>
      </div>
      <div class="evo-mega-list">
        <div v-for="m in megaForms" :key="m.nameEn" class="mega-card">
          <div class="mega-head-text">
            <span class="mega-name">{{ m.nameZh }}</span>
            <span class="mega-stone">{{ m.stoneZh }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ====== 横向进化链 ====== */
.evo-chain {
  width: fit-content;
}

.evo-main {
  display: flex;
  align-items: center;
}

/* ====== 节点卡片 ====== */
.evo-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: 2px solid transparent;
  background: var(--poke-cream);
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 80px;
}
.evo-node:active {
  background: #eceef1;
}
.evo-node.current {
  border-color: var(--poke-red);
  background: #fff0f0;
}
.evo-sprite {
  width: 52px;
  height: 52px;
  object-fit: contain;
}
.evo-fallback {
  font-size: 16px;
  font-weight: 800;
  color: var(--poke-ink-3);
}
.evo-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--poke-ink);
  text-align: center;
  line-height: 1.3;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.evo-id {
  font-size: 10px;
  color: var(--poke-ink-3);
}

/* ====== 连接区 ====== */
.evo-next {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
}
.evo-branch {
  display: flex;
  align-items: center;
  gap: 0;
}
.evo-arrow-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  flex-shrink: 0;
}
.evo-method {
  font-size: 11px;
  color: var(--poke-ink-3);
  background: var(--poke-cream);
  border-radius: 8px;
  padding: 1px 6px;
  white-space: nowrap;
}

/* ====== 超进化单独成行 ====== */
.evo-mega-row {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.evo-mega-rowhead {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #d4880a;
}
.evo-mega-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.mega-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffaf0;
  border: 1px solid #f5c06a;
  border-radius: 14px;
  padding: 8px 12px 8px 8px;
}
.mega-head-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.mega-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--poke-ink);
  line-height: 1.2;
}
.mega-stone {
  font-size: 10px;
  color: #d4880a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
