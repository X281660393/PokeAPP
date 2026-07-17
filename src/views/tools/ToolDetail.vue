<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePokedexStore } from "@/stores/pokedex";
import {
  TOOL_MAP,
  CHART_ORDER,
  getMatchupCell,
  getMatchupCellClass,
} from "@/data/battle/tools";
import { DetailNav } from "@/components";
import { getTextColorOn } from "@/constants/pokemon";
import EvCalc from "./EvCalc.vue";
import MoveSearch from "./MoveSearch.vue";
import AbilitySearch from "./AbilitySearch.vue";
import ItemSearch from "./ItemSearch.vue";
import WeatherSearch from "./WeatherSearch.vue";
import TerrainSearch from "./TerrainSearch.vue";
import StatusSearch from "./StatusSearch.vue";
import TeamBuilder from "./TeamBuilder.vue";

const route = useRoute();
const router = useRouter();
const store = usePokedexStore();

const toolId = computed(() => route.params.toolId as string);
const tool = computed(() => TOOL_MAP[toolId.value]);

function goBack() {
  router.back();
}

// ==================== 相克表点击高亮 ====================
// 记录当前选中的攻击方 / 防御方属性，高亮对应行与列
const selectedAtk = ref<string | null>(null);
const selectedDef = ref<string | null>(null);

function selectCell(atk: string, def: string) {
  // 再次点击已选中的同一格 → 取消高亮
  if (selectedAtk.value === atk && selectedDef.value === def) {
    selectedAtk.value = null;
    selectedDef.value = null;
    return;
  }
  selectedAtk.value = atk;
  selectedDef.value = def;
}

function isAtkRow(type: string) {
  return selectedAtk.value === type;
}
function isDefCol(type: string) {
  return selectedDef.value === type;
}
// 是否处于高亮选中态（至少选了一边）
const hasSelection = computed(
  () => selectedAtk.value !== null || selectedDef.value !== null,
);

// ==================== 相克表滚轮横向滚动 ====================
// 鼠标在表格区域内滚动时，将竖向滚轮转为横向滚动，避免触发整页纵向滚动
function onChartWheel(e: WheelEvent) {
  const el = e.currentTarget as HTMLElement;
  // 仅在确有横向溢出时拦截（否则放行正常滚动）
  if (el.scrollWidth <= el.clientWidth) return;
  // 优先处理竖向滚轮；有 shift 键时横向 deltaX 也累加
  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (delta === 0) return;
  e.preventDefault();
  el.scrollLeft += delta;
}
</script>

<template>
  <div
    class="tool-detail-page"
    v-if="tool"
  >
    <!-- 顶部导航 -->
    <DetailNav
      :title="`${tool.icon} ${tool.name}`"
      @back="goBack"
    />

    <!-- ======== 1. 属性相克表（18×18 矩阵） ======== -->
    <div
      v-if="toolId === 'type-matchup'"
      class="matchup-section"
    >
      <!-- 标题 -->
      <h3 class="chart-title">防守方的宝可梦属性</h3>

      <!-- 矩阵表格（横向滚动适配移动端） -->
      <div class="chart-layout">
        <!-- 表格左侧竖排总标签 -->
        <div class="chart-side-label">攻击方宝可梦技能属性</div>

        <div
          class="chart-scroll-wrap"
          @wheel="onChartWheel"
        >
          <table class="chart-table">
            <!-- 列头：防御方属性（带颜色背景） -->
            <thead>
              <tr>
                <!-- 左上角空白占位，对齐下方行头 -->
                <th class="chart-corner-empty"></th>
                <th
                  v-for="defType in CHART_ORDER"
                  :key="'col-' + defType"
                  class="chart-col-header"
                  :class="{ 'col-highlight': isDefCol(defType) }"
                  :style="{
                    backgroundColor: store.getTypeColor(defType),
                    color: getTextColorOn(store.getTypeColor(defType)),
                  }"
                >
                  {{ store.getTypeName(defType) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="atkType in CHART_ORDER"
                :key="'row-' + atkType"
              >
                <!-- 行头：攻击方属性（带颜色背景） -->
                <td
                  class="chart-row-header"
                  :class="{ 'row-highlight': isAtkRow(atkType) }"
                  :style="{
                    backgroundColor: store.getTypeColor(atkType),
                    color: getTextColorOn(store.getTypeColor(atkType)),
                  }"
                >
                  {{ store.getTypeName(atkType) }}
                </td>
                <!-- 数据格 -->
                <td
                  v-for="defType in CHART_ORDER"
                  :key="'cell-' + atkType + '-' + defType"
                  class="chart-cell"
                  :class="[
                    getMatchupCellClass(getMatchupCell(atkType, defType).value),
                    {
                      'cell-highlight': isAtkRow(atkType) && isDefCol(defType),
                      'col-active': isDefCol(defType),
                    },
                  ]"
                  @click="selectCell(atkType, defType)"
                >
                  {{ getMatchupCell(atkType, defType).label }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 图例说明 -->
      <div class="chart-legend">
        <span class="legend-item"><i class="dot super"></i> 效果绝佳 2×</span>
        <span class="legend-item"><i class="dot normal"></i> 效果一般 1×</span>
        <span class="legend-item"><i class="dot not"></i> 效果不佳 ½×</span>
        <span class="legend-item"><i class="dot immune"></i> 无效 0×</span>
      </div>

      <!-- 点击高亮提示 -->
      <div
        class="chart-hint"
        :class="{ show: hasSelection }"
        @click="
          selectedAtk = null;
          selectedDef = null;
        "
      >
        已高亮
        <b>{{ selectedAtk ? store.getTypeName(selectedAtk) : "—" }}</b> 攻击 →
        <b>{{ selectedDef ? store.getTypeName(selectedDef) : "—" }}</b> 防御
        <span class="hint-clear">点击清除</span>
      </div>
    </div>

    <!-- ======== 2. 努力值计算 ======== -->
    <EvCalc v-else-if="toolId === 'ev-calc'" />

    <!-- ======== 3. 招式查询 ======== -->
    <MoveSearch v-else-if="toolId === 'move-search'" />

    <!-- ======== 4. 特性查询 ======== -->
    <AbilitySearch v-else-if="toolId === 'ability-search'" />

    <!-- ======== 5. 道具查询 ======== -->
    <ItemSearch v-else-if="toolId === 'item-search'" />

    <!-- ======== 6. 天气查询 ======== -->
    <WeatherSearch v-else-if="toolId === 'weather-search'" />

    <!-- ======== 7. 场地查询 ======== -->
    <TerrainSearch v-else-if="toolId === 'terrain-search'" />

    <!-- ======== 8. 异常状态查询 ======== -->
    <StatusSearch v-else-if="toolId === 'status-search'" />

    <!-- ======== 9. 队伍组建 ======== -->
    <TeamBuilder v-else-if="toolId === 'team-builder'" />
  </div>

  <div
    v-else
    class="tool-not-found"
  >
    <p>未找到该工具</p>
    <van-button
      type="primary"
      size="small"
      @click="goBack"
      >返回</van-button
    >
  </div>
</template>

<style scoped>
.tool-detail-page {
  min-height: calc(100vh - 56px - env(safe-area-inset-bottom, 0px) - 8px);
  background: var(--poke-cream);
  padding-bottom: 16px;
  box-sizing: border-box;
}

/* ========== 属性相克表（18×18 矩阵） ========== */
.matchup-section {
  padding: 14px 10px 16px;
}

/* 顶部轴标签：与左侧竖排标签对称呼应 */
.chart-title {
  display: block;
  width: fit-content;
  margin: 0 auto 12px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--poke-red);
  background: var(--poke-red-soft);
  border-radius: var(--radius-pill);
  text-align: center;
}

/* 表格 + 左侧竖排标签的外层布局 */
.chart-layout {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

/* 表格左侧竖排总标签（攻击方） */
.chart-side-label {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--poke-red);
  background: var(--poke-red-soft);
  border-radius: var(--radius-sm);
  padding: 10px 4px;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(255, 68, 89, 0.15);
}

.chart-scroll-wrap {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-md);
  border: none;
  background: var(--poke-surface);
  box-shadow: var(--shadow-sm);
  padding: 8px;
}

/* 隐藏滚动条但保持可滚动 */
.chart-scroll-wrap::-webkit-scrollbar {
  height: 4px;
}
.chart-scroll-wrap::-webkit-scrollbar-thumb {
  background: #dcdee5;
  border-radius: 2px;
}

.chart-table {
  width: max-content; /* 表格按内容撑开，由外层滚动 */
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 2px;
  table-layout: fixed;
  font-size: 13px;
}

/* 左上角空白占位格（让列头与下方行头对齐） */
.chart-corner-empty {
  min-width: 48px;
  width: 48px;
  padding: 0;
  border-radius: 7px;
}

/* 列头 / 行头：属性色块 */
.chart-col-header,
.chart-row-header {
  min-width: 48px;
  width: 48px;
  padding: 6px 2px;
  font-size: 11px !important;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  border-radius: 7px;
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.12);
  user-select: none;
}

/* 数据格 */
.chart-cell {
  min-width: 48px;
  width: 48px;
  padding: 5px 2px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  border-radius: 7px;
  white-space: nowrap;
  transition: opacity 0.12s, transform 0.12s;
}

.chart-cell:hover {
  opacity: 0.82;
  transform: scale(1.06);
}

/* ===== 点击高亮：行/列/交叉格子（品牌红系） ===== */
/* 选中的攻击方行、防御方列：红色描边 + 轻微提亮，引导视线 */
.chart-row-header.row-highlight,
.chart-col-header.col-highlight {
  position: relative;
  z-index: 3;
  box-shadow: 0 0 0 2px var(--poke-red), 0 0 10px rgba(255, 68, 89, 0.45);
  transform: scale(1.08);
  filter: saturate(1.15);
}

/* 整行（被选择攻击方）数据格微弱红边提示 */
tbody tr:has(.chart-row-header.row-highlight) .chart-cell {
  box-shadow: inset 0 0 0 1px rgba(255, 68, 89, 0.25);
}

/* 整列（被选择防御方）数据格左右红边 */
.chart-cell.col-active {
  box-shadow: inset 2px 0 0 0 rgba(255, 68, 89, 0.35),
    inset -2px 0 0 0 rgba(255, 68, 89, 0.35);
}

/* 交叉格子（攻击方∩防守方）强高亮：粗红环 + 红晕 + 放大 */
/* 双层红色描边确保在任何底色上都清晰可见 */
.chart-cell.cell-highlight {
  position: relative;
  z-index: 4;
  outline: 3px solid var(--poke-red);
  outline-offset: -3px;
  box-shadow: 0 0 0 2.5px var(--poke-red), 0 0 18px rgba(255, 68, 89, 0.55);
  transform: scale(1.12);
}

/* 白格（效果一般）上的高亮：改用深色内描边 + 外红环，避免白色覆盖 */
.cell-normal.cell-highlight {
  outline: none;
  box-shadow: inset 0 0 0 2.5px #e0314a, 0 0 0 2px var(--poke-red),
    0 0 14px rgba(255, 68, 89, 0.5);
}

/* 倍率颜色 —— 对齐截图，改用更柔和的色值 */
.cell-super {
  background-color: #ff5a6e;
  color: #ffffff;
} /* 效果绝佳 2× 柔红 */
.cell-not {
  background-color: #51cf66;
  color: #ffffff;
} /* 效果不佳 ½× 柔绿 */
.cell-immune {
  background-color: #343a40;
  color: #ffffff;
} /* 无效 0× 深灰黑 */
.cell-normal {
  background-color: #f5f6f8;
  color: #868e96;
} /* 效果一般 1× 浅灰底 */

/* 图例 */
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 12px;
  flex-wrap: wrap;
  padding: 0 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--poke-ink-2);
  font-weight: 500;
}

.legend-item .dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.legend-item .dot.super {
  background: #ff5a6e;
}
.legend-item .dot.normal {
  background: #f5f6f8;
}
.legend-item .dot.not {
  background: #51cf66;
}
.legend-item .dot.immune {
  background: #343a40;
}

/* 点击高亮提示条 */
.chart-hint {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  margin: 0 8px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--poke-ink-2);
  background: var(--poke-red-soft);
  border-radius: var(--radius-pill);
  text-align: center;
  transition: all 0.25s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.chart-hint.show {
  max-height: 40px;
  opacity: 1;
  margin-top: 10px;
  padding: 8px 12px;
}
.chart-hint b {
  color: var(--poke-red);
}
.chart-hint .hint-clear {
  display: inline-block;
  margin-left: 6px;
  color: var(--poke-ink-3);
  text-decoration: underline;
}

/* 移动端适配：缩小字体和单元格宽度 */
@media (max-width: 420px) {
  .chart-col-header,
  .chart-row-header,
  .chart-cell,
  .chart-corner-empty {
    min-width: 40px;
    width: 40px;
    font-size: 10px !important;
    padding: 4px 1px;
  }
  .chart-side-label {
    font-size: 11px;
    letter-spacing: 2px;
    padding: 8px 3px;
  }
}

/* ========== 工具占位页 ========== */
.tool-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 14px;
}

.placeholder-icon {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
  box-shadow: var(--shadow-md);
}

.tool-placeholder h2 {
  font-size: 19px;
  color: var(--poke-ink);
  font-weight: 700;
}

.placeholder-text {
  color: var(--poke-ink-3);
  font-size: 14px;
  max-width: 240px;
  text-align: center;
  line-height: 1.6;
}

.placeholder-tags {
  display: flex;
  gap: 8px;
}

.back-btn {
  margin-top: 8px;
}

.tool-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 12px;
  color: var(--poke-ink-3);
}
</style>
