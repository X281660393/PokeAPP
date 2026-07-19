<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { STAT_ORDER, STAT_NAME_ZH } from '@/constants/pokemon'
import { ALL_POKEMON, spriteFor } from '@/data/pokemon/pokemon'
import { TypeBadge, SearchBox } from '@/components'

const MAX_EV_BASIC = 252
const TOTAL_EV_BASIC = 510
const MAX_EV_CHAMPION = 32
const TOTAL_EV_CHAMPION = 66
const MAX_IV = 31
const CHAMPION_LEVEL = 50

type StatKey = (typeof STAT_ORDER)[number]

/** 模式：基础（配点规划）/ 冠军（66 点分配，满个体 Lv.50 锁定） */
const mode = ref<'basic' | 'champion'>('basic')
const isChampion = computed(() => mode.value === 'champion')
const evMax = computed(() => (isChampion.value ? MAX_EV_CHAMPION : MAX_EV_BASIC))
const totalCap = computed(() => (isChampion.value ? TOTAL_EV_CHAMPION : TOTAL_EV_BASIC))

/** 6 项努力值（基础 0-252 / 冠军 0-32） */
const evs = reactive<Record<StatKey, number>>({
  hp: 0,
  attack: 0,
  defense: 0,
  'special-attack': 0,
  'special-defense': 0,
  speed: 0,
})

/** 切换模式时按「1 冠军点 = 8 努力值」把努力值换算携带过去 */
function convertEvsTo(to: 'basic' | 'champion') {
  for (const k of STAT_ORDER) {
    evs[k] =
      to === 'champion'
        ? Math.max(0, Math.min(MAX_EV_CHAMPION, Math.round(evs[k] / 8)))
        : Math.max(0, Math.min(MAX_EV_BASIC, Math.round((evs[k] * 8) / 4) * 4))
  }
}
watch(mode, (to, from) => {
  if (to === from) return
  convertEvsTo(to)
})

/** 6 项个体值（0-31，默认满值；冠军模式锁定为 31） */
const ivs = reactive<Record<StatKey, number>>({
  hp: 31,
  attack: 31,
  defense: 31,
  'special-attack': 31,
  'special-defense': 31,
  speed: 31,
})

const usedTotal = computed(() => STAT_ORDER.reduce((s, k) => s + evs[k], 0))
const remaining = computed(() => totalCap.value - usedTotal.value)
const isOver = computed(() => usedTotal.value > totalCap.value)

// ---------- 输入处理（实时） ----------
function clampEv(key: StatKey, v: number): number {
  if (Number.isNaN(v)) return 0
  const hard = Math.max(0, Math.min(evMax.value, Math.round(v)))
  // 总数已达上限时不再允许增加：把该项能取的最大值限制在「其余项已用后剩余」内
  const othersTotal = usedTotal.value - evs[key]
  const maxByCap = totalCap.value - othersTotal
  return Math.max(0, Math.min(hard, maxByCap))
}
function clampIv(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(MAX_IV, Math.round(v)))
}
function onEvSlide(key: StatKey, v: number | number[]) {
  evs[key] = clampEv(key, Array.isArray(v) ? v[0] : v)
}
function onEvInput(key: StatKey, e: Event) {
  evs[key] = clampEv(key, Number((e.target as HTMLInputElement).value))
}
function onIvInput(key: StatKey, e: Event) {
  if (isChampion.value) return
  ivs[key] = clampIv(Number((e.target as HTMLInputElement).value))
}
function onLevelInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') return
  const v = Number(raw)
  if (Number.isNaN(v)) return
  level.value = Math.max(1, Math.min(100, Math.round(v)))
}

/** 常用配分预设（仅基础模式） */
const PRESETS: { label: string; spread: Partial<Record<StatKey, number>> }[] = [
  { label: '极限物攻', spread: { attack: 252, speed: 252, hp: 6 } },
  { label: '极限特攻', spread: { 'special-attack': 252, speed: 252, hp: 6 } },
  { label: '重盾', spread: { hp: 252, defense: 252, 'special-defense': 6 } },
  { label: '速耐', spread: { hp: 252, speed: 252, defense: 6 } },
]
function applyPreset(spread: Partial<Record<StatKey, number>>) {
  STAT_ORDER.forEach((k) => (evs[k] = 0))
  let room = TOTAL_EV_BASIC
  for (const k of STAT_ORDER) {
    const want = spread[k] ?? 0
    const give = Math.min(want, MAX_EV_BASIC, room)
    evs[k] = give
    room -= give
  }
}
function clearAll() {
  STAT_ORDER.forEach((k) => (evs[k] = 0))
}
/** 单项加满：在总上限允许范围内把该能力拉到可分配的最大值 */
function fillStat(key: StatKey) {
  const othersTotal = usedTotal.value - evs[key]
  const maxByCap = totalCap.value - othersTotal
  evs[key] = Math.max(0, Math.min(evMax.value, maxByCap))
}
/** 单项清空 */
function clearStat(key: StatKey) {
  evs[key] = 0
}

// ==================== 性格（完整 25 种） ====================
/** 性格只影响 5 项（不含 HP） */
const NATURE_STATS = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
const NATURE_STAT_ZH: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
}
const NATURE_STAT_SHORT: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
}
/** 行=提升项，列=下降项；对角线为无加成性格 */
const NATURE_GRID: Record<string, Record<string, string>> = {
  attack: {
    attack: '勤奋',
    defense: '孤僻',
    'special-attack': '固执',
    'special-defense': '顽皮',
    speed: '勇敢',
  },
  defense: {
    attack: '大胆',
    defense: '坦率',
    'special-attack': '淘气',
    'special-defense': '乐天',
    speed: '悠闲',
  },
  'special-attack': {
    attack: '内敛',
    defense: '慢吞吞',
    'special-attack': '害羞',
    'special-defense': '马虎',
    speed: '冷静',
  },
  'special-defense': {
    attack: '温和',
    defense: '温顺',
    'special-attack': '慎重',
    'special-defense': '浮躁',
    speed: '自大',
  },
  speed: {
    attack: '胆小',
    defense: '急躁',
    'special-attack': '爽朗',
    'special-defense': '天真',
    speed: '认真',
  },
}

const natureUp = ref<string>('attack')
const natureDown = ref<string>('attack')
const showNaturePicker = ref(false)

const isNeutralNature = computed(() => natureUp.value === natureDown.value)
const natureLabel = computed(() => {
  const name = NATURE_GRID[natureUp.value]?.[natureDown.value] ?? '勤奋'
  if (isNeutralNature.value) return `${name}（无加成）`
  return `${name} · ${NATURE_STAT_ZH[natureUp.value]}↑ ${NATURE_STAT_ZH[natureDown.value]}↓`
})
function selectNature(up: string, down: string) {
  natureUp.value = up
  natureDown.value = down
  showNaturePicker.value = false
}

// ==================== 最终数值计算 ====================
const level = ref(50)
const effectiveLevel = computed(() => (isChampion.value ? CHAMPION_LEVEL : level.value))

const selectedId = ref<number | null>(null)
/** 图片加载失败时隐藏 */
const spriteErr = ref<Set<number>>(new Set())
function onSpriteErr(id: number) {
  spriteErr.value.add(id)
}

const selectedPokemon = computed(() =>
  selectedId.value != null ? ALL_POKEMON.find((p) => p.id === selectedId.value) ?? null : null,
)

const baseMap = computed<Record<string, number>>(() => {
  const m: Record<string, number> = {}
  selectedPokemon.value?.stats.forEach((s) => (m[s.key!] = s.value))
  return m
})

function calcFinal(key: StatKey, base: number, ev: number): number {
  const iv = isChampion.value ? 31 : ivs[key]
  const lv = effectiveLevel.value
  // 冠军模式：1 点 = 普通的 8 点努力值
  const effEv = isChampion.value ? ev * 8 : ev
  const inner = Math.floor(((2 * base + iv + Math.floor(effEv / 4)) * lv) / 100)
  if (key === 'hp') return inner + lv + 10
  let val = inner + 5
  if (!isNeutralNature.value) {
    if (natureUp.value === key) val = Math.floor(val * 1.1)
    else if (natureDown.value === key) val = Math.floor(val * 0.9)
  }
  return val
}

const finalStats = computed(() => {
  if (!selectedPokemon.value) return []
  const base = baseMap.value
  return STAT_ORDER.map((key) => {
    const b = base[key] ?? 0
    const finalEv = calcFinal(key, b, evs[key])
    return {
      key,
      nameZh: STAT_NAME_ZH[key],
      base: b,
      ev: evs[key],
      iv: isChampion.value ? 31 : ivs[key],
      final: finalEv,
      up: !isNeutralNature.value && natureUp.value === key,
      down: !isNeutralNature.value && natureDown.value === key,
    }
  })
})

const maxFinal = computed(() => Math.max(1, ...finalStats.value.map((s) => s.final)))

// ==================== 宝可梦选择器 ====================
const showPicker = ref(false)
const pickerQuery = ref('')
const pickerList = computed(() => {
  const q = pickerQuery.value.trim().toLowerCase()
  const list = q
    ? ALL_POKEMON.filter(
        (p) =>
          p.nameZh.includes(pickerQuery.value.trim()) ||
          p.name.toLowerCase().includes(q) ||
          String(p.id) === q,
      )
    : ALL_POKEMON
  return list.slice(0, 60)
})
function pickPokemon(id: number) {
  selectedId.value = id
  showPicker.value = false
}
</script>

<template>
  <div class="ev-calc">
    <!-- 模式切换 -->
    <div class="mode-tabs">
      <button
        class="mode-tab"
        :class="{ active: mode === 'basic' }"
        @click="mode = 'basic'"
      >
        基础模式
      </button>
      <button
        class="mode-tab"
        :class="{ active: mode === 'champion' }"
        @click="mode = 'champion'"
      >
        冠军模式
      </button>
    </div>
    <p class="mode-hint">
      {{
        isChampion
          ? '共 66 点可分配，单项上限 32；个体值与等级锁定为满个体 50 级'
          : '按 510 总量规划配点，预览最终六维数值'
      }}
    </p>

    <!-- 总点数概览 -->
    <div
      class="ev-summary"
      :class="{ over: isOver }"
    >
      <div class="ev-summary-text">
        <span class="ev-summary-label">已分配</span>
        <span class="ev-summary-num">{{ usedTotal }} / {{ totalCap }}</span>
      </div>
      <div class="ev-bar">
        <div
          class="ev-bar-fill"
          :class="{ 'ev-bar-over': isOver }"
          :style="{ width: Math.min(100, (usedTotal / totalCap) * 100) + '%' }"
        ></div>
      </div>
      <div class="ev-remain">
        <template v-if="isOver">
          <b class="over-txt">超出 {{ -remaining }} 点</b>
        </template>
        <template v-else>
          剩余 <b>{{ remaining }}</b> 点<span class="ev-cap-hint">（单项上限 {{ evMax }}）</span>
        </template>
      </div>
    </div>

    <!-- 预设（仅基础模式） -->
    <div
      v-if="!isChampion"
      class="ev-presets"
    >
      <button
        v-for="p in PRESETS"
        :key="p.label"
        class="ev-preset-btn"
        @click="applyPreset(p.spread)"
      >
        {{ p.label }}
      </button>
      <button
        class="ev-preset-btn ev-preset-clear"
        @click="clearAll"
      >
        清零
      </button>
    </div>

    <!-- 清理（仅冠军模式） -->
    <div
      v-if="isChampion"
      class="ev-presets"
    >
      <button
        class="ev-preset-btn ev-preset-clear ev-clear-full"
        @click="clearAll"
      >
        清零分配
      </button>
    </div>

    <!-- 冠军模式锁定提示 -->
    <div
      v-if="isChampion"
      class="ev-lock-banner"
    >
      <svg class="lock-icon" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <span>已锁定：满个体（IV 31）· 等级 Lv.{{ CHAMPION_LEVEL }}</span>
    </div>

    <!-- EV / IV 列表 -->
    <div class="ev-list">
      <div
        v-for="key in STAT_ORDER"
        :key="key"
        class="ev-row"
      >
        <div class="ev-row-head">
          <span class="ev-name">{{ STAT_NAME_ZH[key] }}</span>
          <div class="ev-inputs">
            <label class="ev-mini">
              <span class="ev-mini-tag">{{ isChampion ? '加点' : '努力' }}</span>
              <input
                class="ev-mini-input"
                type="number"
                inputmode="numeric"
                :min="0"
                :max="evMax"
                :class="{ max: evs[key] === evMax }"
                :value="evs[key]"
                @input="onEvInput(key, $event)"
              />
            </label>
            <label
              v-if="!isChampion"
              class="ev-mini"
            >
              <span class="ev-mini-tag">个体</span>
              <input
                class="ev-mini-input iv"
                type="number"
                inputmode="numeric"
                :min="0"
                :max="MAX_IV"
                :value="ivs[key]"
                @input="onIvInput(key, $event)"
              />
            </label>
          </div>
        </div>
        <van-slider
          :model-value="evs[key]"
          :max="evMax"
          :min="0"
          :step="isChampion ? 1 : 4"
          active-color="#ff4459"
          @update:model-value="(v: number | number[]) => onEvSlide(key, v)"
        >
          <template #button>
            <div class="ev-slider-btn"></div>
          </template>
        </van-slider>
        <div class="ev-row-actions">
          <button
            class="ev-stat-fill"
            @click="fillStat(key)"
          >加满</button>
          <button
            class="ev-stat-clear"
            @click="clearStat(key)"
          >清空</button>
        </div>
      </div>
    </div>

    <!-- 数值预览 -->
    <div class="ev-preview">
      <h3 class="block-title">最终数值预览</h3>
      <div
        v-if="!selectedPokemon"
        class="ev-pick-empty"
      >
        <button
          class="ev-pick-btn"
          @click="showPicker = true"
        >
          + 选择宝可梦预览
        </button>
      </div>

      <template v-else>
        <div class="ev-pick-head">
          <img
            v-if="!spriteErr.has(selectedPokemon!.id)"
            class="ev-pick-sprite"
            :src="spriteFor(selectedPokemon.id)"
            :alt="selectedPokemon.nameZh"
            loading="lazy"
            @error="onSpriteErr(selectedPokemon!.id)"
          />
          <div class="ev-pick-info">
            <div class="ev-pick-name">
              #{{ selectedPokemon.id }} {{ selectedPokemon.nameZh }}
            </div>
            <div class="ev-pick-types">
              <TypeBadge
                v-for="t in selectedPokemon.types"
                :key="t"
                :type="t"
              />
            </div>
          </div>
          <button
            class="ev-pick-change"
            @click="showPicker = true"
          >
            更换
          </button>
        </div>

        <!-- 性格（浮窗表格选择） -->
        <div class="ev-nature-row">
          <span class="ev-nature-label">性格</span>
          <button
            class="ev-nature-select"
            @click="showNaturePicker = true"
          >
            <span>{{ natureLabel }}</span>
            <svg class="arrow-down" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

        <!-- 等级（基础模式可调，冠军模式锁定） -->
        <div class="ev-level-row">
          <span class="ev-nature-label">等级</span>
          <template v-if="isChampion">
            <span class="ev-lock-level">Lv.{{ CHAMPION_LEVEL }}</span>
          </template>
          <template v-else>
            <van-slider
              v-model="level"
              :min="1"
              :max="100"
              :step="1"
              active-color="#4dabf7"
              class="ev-level-slider"
            />
            <input
              class="ev-level-input"
              type="number"
              inputmode="numeric"
              min="1"
              max="100"
              :value="level"
              @input="onLevelInput($event)"
            />
          </template>
        </div>

        <!-- 最终数值条（性格加成显色） -->
        <div class="ev-final-list">
          <div
            v-for="s in finalStats"
            :key="s.key"
            class="ev-final-row"
          >
            <span class="ev-final-name">{{ s.nameZh }}</span>
            <div class="ev-final-bar">
              <div
                class="ev-final-fill"
                :style="{ width: (s.final / maxFinal) * 100 + '%' }"
              ></div>
            </div>
            <span
              class="ev-final-val"
              :class="{ up: s.up, down: s.down }"
              >{{ s.final }}</span
            >
          </div>
        </div>

        <p class="ev-note">
          {{
            isChampion
              ? '* 冠军模式：共 66 点、单项上限 32；个体值固定满值、等级固定 50。最终数值按性格加成显色（提升红 / 降低蓝）。'
              : '* 依据所填个体值与性格计算；单项努力值上限 252、总量上限 510。'
          }}
        </p>
      </template>
    </div>

    <!-- 宝可梦选择弹层 -->
    <van-popup
      v-model:show="showPicker"
      position="bottom"
      round
      class="ev-picker-popup"
    >
      <div class="ev-picker">
        <div class="ev-picker-head">
          <span>选择宝可梦</span>
          <svg class="close-btn" viewBox="0 0 24 24" fill="none" @click="showPicker = false"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <SearchBox
          v-model="pickerQuery"
          placeholder="搜索名称或编号"
        />
        <div class="ev-picker-list">
          <button
            v-for="p in pickerList"
            :key="p.id"
            class="ev-picker-item"
            @click="pickPokemon(p.id)"
          >
            <img
              v-if="!spriteErr.has(p.id)"
              class="ev-picker-sprite"
              :src="spriteFor(p.id)"
              :alt="p.nameZh"
              loading="lazy"
              @error="onSpriteErr(p.id)"
            />
            <span class="ev-picker-id">#{{ p.id }}</span>
            <span class="ev-picker-name">{{ p.nameZh }}</span>
          </button>
          <p
            v-if="pickerList.length === 0"
            class="no-data"
          >
            未找到匹配的宝可梦
          </p>
        </div>
      </div>
    </van-popup>

    <!-- 性格选择弹层（5×5 表格） -->
    <van-popup
      v-model:show="showNaturePicker"
      position="bottom"
      round
      class="nature-popup"
    >
      <div class="nature-panel">
        <div class="ev-picker-head">
          <span>选择性格</span>
          <svg class="close-btn" viewBox="0 0 24 24" fill="none" @click="showNaturePicker = false"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <p class="nature-tip">行 = 提升项 ↑，列 = 下降项 ↓，对角线为无加成</p>
        <div class="nature-table">
          <!-- 表头 -->
          <div class="nt-row nt-head">
            <div class="nt-corner">↑ \ ↓</div>
            <div
              v-for="d in NATURE_STATS"
              :key="'h-' + d"
              class="nt-col-head"
            >
              {{ NATURE_STAT_SHORT[d] }}↓
            </div>
          </div>
          <!-- 数据行 -->
          <div
            v-for="u in NATURE_STATS"
            :key="'r-' + u"
            class="nt-row"
          >
            <div class="nt-row-head">{{ NATURE_STAT_SHORT[u] }}↑</div>
            <button
              v-for="d in NATURE_STATS"
              :key="u + '-' + d"
              class="nt-cell"
              :class="{
                neutral: u === d,
                active: natureUp === u && natureDown === d,
              }"
              @click="selectNature(u, d)"
            >
              {{ NATURE_GRID[u][d] }}
            </button>
          </div>
        </div>
        <button
          class="nature-neutral-btn"
          @click="selectNature('attack', 'attack')"
        >
          使用无加成性格（勤奋）
        </button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.ev-calc {
  padding: 14px 12px 16px;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  gap: 4px;
  background: #eef0f3;
  border-radius: var(--radius-pill);
  padding: 4px;
  margin-bottom: 8px;
}
.mode-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--poke-ink-2);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 0;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.18s;
}
.mode-tab.active {
  background: var(--poke-red);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 68, 89, 0.35);
}
.mode-hint {
  font-size: 12px;
  color: var(--poke-ink-3);
  margin: 0 0 12px 2px;
}

/* 总点数概览 */
.ev-summary {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 12px;
}
.ev-summary.over {
  box-shadow: 0 0 0 2px #ff4459, var(--shadow-sm);
}
.ev-summary-text {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.ev-summary-label {
  font-size: 13px;
  color: var(--poke-ink-2);
}
.ev-summary-num {
  font-size: 18px;
  font-weight: 800;
  color: var(--poke-ink);
}
/* 单项操作按钮（加满 / 清空） */
.ev-row-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}
.ev-stat-fill,
.ev-stat-clear {
  flex: 1;
  border: none;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 0;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: transform 0.12s;
}
.ev-stat-fill {
  background: var(--poke-red-soft);
  color: var(--poke-red);
}
.ev-stat-clear {
  background: #f1f2f5;
  color: var(--poke-ink-3);
}
.ev-stat-fill:active,
.ev-stat-clear:active {
  transform: scale(0.97);
}
.ev-bar {
  height: 8px;
  background: #eef0f3;
  border-radius: 4px;
  overflow: hidden;
}
.ev-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff7a8a, #ff4459);
  border-radius: 4px;
  transition: width 0.2s;
}
.ev-bar-over {
  background: #ff4459;
}
.ev-remain {
  margin-top: 8px;
  font-size: 12px;
  color: var(--poke-ink-3);
  text-align: right;
}
.ev-remain b {
  color: var(--poke-red);
  font-size: 14px;
}
.ev-cap-hint {
  color: var(--poke-ink-3);
}
.over-txt {
  color: #ff4459;
}

/* 预设 */
.ev-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.ev-preset-btn {
  flex: 1;
  min-width: 64px;
  border: none;
  background: var(--poke-red-soft);
  color: var(--poke-red);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 4px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: transform 0.12s;
}
.ev-preset-btn:active {
  transform: scale(0.94);
}
.ev-preset-clear {
  background: #f1f2f5;
  color: var(--poke-ink-3);
}
.ev-clear-full {
  flex-basis: 100%;
}

/* 冠军模式锁定提示 */
.ev-lock-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--poke-blue-soft, #e7f1ff);
  color: var(--poke-blue, #4dabf7);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  margin-bottom: 14px;
}
.lock-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.close-btn {
  width: 22px;
  height: 22px;
  color: var(--poke-ink-3);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}
.close-btn:active {
  color: var(--poke-red);
}
.arrow-down {
  width: 16px;
  height: 16px;
  color: var(--poke-ink-3);
  flex-shrink: 0;
}

/* EV / IV 列表 */
.ev-list {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 14px 16px 6px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
}
.ev-row {
  margin-bottom: 16px;
}
.ev-row-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.ev-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink);
}
.ev-inputs {
  display: flex;
  gap: 8px;
}
.ev-mini {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ev-mini-tag {
  font-size: 11px;
  color: var(--poke-ink-3);
}
.ev-mini-input {
  width: 44px;
  height: 26px;
  border: 1px solid var(--poke-line);
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--poke-ink);
  background: #fff;
  -moz-appearance: textfield;
}
.ev-mini-input:focus {
  outline: none;
  border-color: var(--poke-red);
}
.ev-mini-input.max {
  color: var(--poke-red);
  border-color: #ffb3bd;
}
.ev-mini-input.iv:focus {
  border-color: var(--poke-blue);
}
.ev-mini-input::-webkit-outer-spin-button,
.ev-mini-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ev-slider-btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  border: 2px solid #ff4459;
}

/* 预览 */
.ev-preview {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 14px 16px 16px;
  box-shadow: var(--shadow-sm);
}
.ev-pick-empty {
  text-align: center;
  padding: 10px 0 4px;
}
.ev-pick-btn {
  border: 1.5px dashed #ffb3bd;
  background: var(--poke-cream);
  color: var(--poke-red);
  font-size: 14px;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.ev-pick-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.ev-pick-sprite {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
.ev-pick-info {
  flex: 1;
}
.ev-pick-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--poke-ink);
  margin-bottom: 4px;
}
.ev-pick-types {
  display: flex;
  gap: 4px;
}
.ev-pick-change {
  border: none;
  background: #f1f2f5;
  color: var(--poke-ink-2);
  font-size: 12px;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
}
.ev-nature-row,
.ev-level-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.ev-nature-label {
  font-size: 13px;
  color: var(--poke-ink-2);
  width: 34px;
  flex-shrink: 0;
}
.ev-nature-select {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--poke-line);
  background: #fff;
  color: var(--poke-ink);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.ev-nature-select:active {
  background: var(--poke-cream);
}
.ev-level-slider {
  flex: 1;
}
.ev-level-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--poke-blue);
  width: 42px;
  text-align: right;
}
.ev-level-input {
  width: 52px;
  height: 28px;
  border: 1px solid var(--poke-line);
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--poke-blue);
  background: #fff;
  -moz-appearance: textfield;
}
.ev-level-input:focus {
  outline: none;
  border-color: var(--poke-blue);
}
.ev-level-input::-webkit-outer-spin-button,
.ev-level-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ev-lock-level {
  font-size: 13px;
  font-weight: 700;
  color: var(--poke-blue);
  background: var(--poke-blue-soft, #e7f1ff);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
}

/* 最终数值 */
.ev-final-list {
  margin-top: 4px;
}
.ev-final-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ev-final-name {
  width: 36px;
  font-size: 12px;
  color: var(--poke-ink-2);
}
.ev-final-bar {
  flex: 1;
  height: 10px;
  background: #eef0f3;
  border-radius: 5px;
  overflow: hidden;
}
.ev-final-fill {
  height: 100%;
  background: linear-gradient(90deg, #74c0fc, #4dabf7);
  border-radius: 5px;
  transition: width 0.12s;
}
.ev-final-val {
  width: 38px;
  font-size: 14px;
  font-weight: 700;
  color: var(--poke-ink);
  text-align: right;
}
.ev-final-val.up {
  color: #ff4459;
}
.ev-final-val.down {
  color: #4dabf7;
}
.ev-note {
  font-size: 11px;
  color: var(--poke-ink-3);
  margin-top: 6px;
  line-height: 1.5;
}

/* 选择器弹层 */
.ev-picker-popup {
  height: 78vh;
}
.ev-picker {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.ev-picker-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  color: var(--poke-ink);
}
.ev-picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px;
}
.ev-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 6px;
  border-bottom: 1px solid var(--poke-line);
  cursor: pointer;
  text-align: left;
}
.ev-picker-item:active {
  background: var(--poke-cream);
}
.ev-picker-sprite {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.ev-picker-id {
  font-size: 12px;
  color: var(--poke-ink-3);
  width: 44px;
}
.ev-picker-name {
  font-size: 14px;
  color: var(--poke-ink);
  font-weight: 500;
}

/* 性格表格弹层 */
.nature-popup {
  padding-bottom: 16px;
}
.nature-panel {
  display: flex;
  flex-direction: column;
}
.nature-tip {
  font-size: 12px;
  color: var(--poke-ink-3);
  margin: 0 16px 12px;
}
.nature-table {
  padding: 0 12px;
}
.nt-row {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
}
.nt-head {
  margin-bottom: 6px;
}
.nt-corner {
  width: 48px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--poke-ink-3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nt-col-head {
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--poke-red);
  padding: 4px 0;
}
.nt-row-head {
  width: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--poke-blue);
}
.nt-cell {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--poke-line);
  background: #fff;
  color: var(--poke-ink);
  font-size: 12px;
  font-weight: 600;
  padding: 10px 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}
.nt-cell:active {
  transform: scale(0.94);
}
.nt-cell.neutral {
  background: #f1f2f5;
  color: var(--poke-ink-3);
}
.nt-cell.active {
  background: var(--poke-red);
  color: #fff;
  border-color: var(--poke-red);
  box-shadow: 0 2px 8px rgba(255, 68, 89, 0.35);
}
.nature-neutral-btn {
  margin: 14px 16px 0;
  border: 1px solid var(--poke-line);
  background: #fff;
  color: var(--poke-ink-2);
  font-size: 13px;
  font-weight: 600;
  padding: 10px 0;
  border-radius: var(--radius-md);
  cursor: pointer;
}
</style>
