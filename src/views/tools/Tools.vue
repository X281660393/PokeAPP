<script setup lang="ts">
defineOptions({ name: "Tools" });

import { useRouter } from "vue-router";
import { TOOLS } from "@/data/battle/tools";
import { ArrowIcon } from "@/components";

const router = useRouter();

function goTool(toolId: string) {
  router.push(`/tools/${toolId}`);
}
</script>

<template>
  <div class="tools-page page-gradient">
    <div class="tools-header">
      <h1 class="tools-title">小工具</h1>
      <p class="tools-subtitle">冠军训练家的必备工具箱</p>
    </div>

    <!-- 已上线工具 -->
    <div class="tools-section">
      <h3 class="section-label">可用工具</h3>
      <div class="tools-grid">
        <div
          v-for="tool in TOOLS.filter((t) => t.ready)"
          :key="tool.id"
          class="tool-card tool-card--active"
          @click="goTool(tool.id)"
        >
          <div
            class="tool-icon-wrapper"
            :style="{ backgroundColor: tool.color }"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
          </div>
          <span class="tool-name">{{ tool.name }}</span>
          <span class="tool-desc">{{ tool.desc }}</span>
          <span class="tool-action">
            进入
            <ArrowIcon
              dir="right"
              :size="12"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- 开发中工具 -->
    <div
      v-if="TOOLS.some((t) => !t.ready)"
      class="tools-section"
    >
      <h3 class="section-label">即将上线</h3>
      <div class="tools-grid tools-grid--disabled">
        <div
          v-for="tool in TOOLS.filter((t) => !t.ready)"
          :key="tool.id"
          class="tool-card tool-card--disabled"
        >
          <div
            class="tool-icon-wrapper"
            :style="{ backgroundColor: tool.color + '44' }"
          >
            <span
              class="tool-icon"
              style="opacity: 0.5"
              >{{ tool.icon }}</span
            >
          </div>
          <span class="tool-name">{{ tool.name }}</span>
          <span class="tool-desc">{{ tool.desc }}</span>
          <span class="tool-badge">开发中</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tools-page {
  padding: 16px 12px 16px;
  min-height: calc(100vh - 56px - env(safe-area-inset-bottom, 0px) - 8px);
  background: var(--poke-cream);
  position: relative;
  overscroll-behavior: contain;
  box-sizing: border-box;
}
.tools-page > * {
  position: relative;
  z-index: 1;
}

.tools-header {
  text-align: center;
  padding: 22px 0 20px;
  color: #fff;
}

.tools-title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.tools-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.tools-section {
  margin-bottom: 8px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  padding: 6px 16px 4px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 2px;
}

.tool-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 14px 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: var(--shadow-sm);
  position: relative;
}

.tool-card--active:active {
  transform: scale(0.95);
}

.tool-card--active:hover {
  box-shadow: var(--shadow-md);
}

.tool-card--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tools-grid--disabled .tool-card {
  box-shadow: none;
  border: 1.5px dashed #e2e3e8;
}

.tool-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.12);
}

.tool-icon {
  font-size: 22px;
}

.tool-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink);
  text-align: center;
}

.tool-desc {
  font-size: 10px;
  color: var(--poke-ink-3);
  text-align: center;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 28px;
}

/* 进入按钮 */
.tool-action {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--poke-red);
  font-weight: 600;
  margin-top: 2px;
}

/* 开发中标签 */
.tool-badge {
  display: inline-block;
  font-size: 10px;
  color: var(--poke-ink-3);
  background: #f1f2f5;
  padding: 2px 10px;
  border-radius: 10px;
  margin-top: 2px;
}
</style>
