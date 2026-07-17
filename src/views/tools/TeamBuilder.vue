<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getTypeName } from '@/constants/pokemon'
import { ALL_POKEMON, spriteFor } from '@/data/pokemon/pokemon'
import { DEFENSE_MATRIX, CHART_ORDER } from '@/data/battle/tools'
import { TypeBadge, SearchBox } from '@/components'

const MAX_TEAM = 6
const STORAGE_KEY = 'poke_team_builder'

function multFor(types: string[], def: string): number {
  let m = 1
  for (const t of types) m *= DEFENSE_MATRIX[t]?.[def] ?? 1
  return m
}

// 队伍（宝可梦编号列表）
const saved = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as number[]
      if (Array.isArray(arr)) return arr.filter((id) => ALL_POKEMON.some((p) => p.id === id)).slice(0, MAX_TEAM)
    }
  } catch {
    /* ignore */
  }
  return []
})()
const team = ref<number[]>(saved)
/** 图片加载失败时隐藏 */
const spriteErr = ref<Set<number>>(new Set())
function onSpriteErr(id: number) {
  spriteErr.value.add(id)
}
watch(
  team,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

const teamPokemons = computed(() =>
  team.value
    .map((id) => ALL_POKEMON.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p),
)

// ==================== 防御弱点聚合 ====================
type DefLevel = 'immune' | 'x4' | 'x2' | 'resist' | 'neutral'
const DEF_STYLE: Record<DefLevel, { bg: string; fg: string; tag: string }> = {
  immune: { bg: '#343a40', fg: '#fff', tag: '免疫' },
  x4: { bg: '#ff4459', fg: '#fff', tag: '×4' },
  x2: { bg: '#ffa8b0', fg: '#7a1020', tag: '×2' },
  resist: { bg: '#51cf66', fg: '#fff', tag: '抗' },
  neutral: { bg: '#f1f2f5', fg: '#868e96', tag: '·' },
}

function defLevel(def: string): DefLevel {
  let immune = 0
  let weak4 = 0
  let weak2 = 0
  let resist = 0
  for (const p of teamPokemons.value) {
    const m = multFor(p.types, def)
    if (m === 0) immune++
    else if (m >= 4) weak4++
    else if (m === 2) weak2++
    else if (m <= 0.5) resist++
  }
  if (immune > 0) return 'immune'
  if (weak4 > 0) return 'x4'
  if (weak2 > 0) return 'x2'
  if (resist > 0) return 'resist'
  return 'neutral'
}

const defCells = computed(() =>
  CHART_ORDER.map((def) => {
    const level = defLevel(def)
    const count =
      level === 'x4' || level === 'x2'
        ? teamPokemons.value.filter((p) => {
            const m = multFor(p.types, def)
            return m === 2 || m >= 4
          }).length
        : level === 'immune'
          ? teamPokemons.value.filter((p) => multFor(p.types, def) === 0).length
          : level === 'resist'
            ? teamPokemons.value.filter((p) => multFor(p.types, def) <= 0.5).length
            : 0
    return { def, name: getTypeName(def), level, count }
  }),
)

const weakTypes = computed(() => defCells.value.filter((c) => c.level === 'x4' || c.level === 'x2').map((c) => c.name))
const immuneTypes = computed(() => defCells.value.filter((c) => c.level === 'immune').map((c) => c.name))
const resistTypes = computed(() => defCells.value.filter((c) => c.level === 'resist').map((c) => c.name))

// ==================== 进攻覆盖 ====================
const offCells = computed(() =>
  CHART_ORDER.map((def) => {
    const covered = teamPokemons.value.some((p) =>
      p.types.some((t) => (DEFENSE_MATRIX[t]?.[def] ?? 1) === 2),
    )
    return { def, name: getTypeName(def), covered }
  }),
)
const coveredCount = computed(() => offCells.value.filter((c) => c.covered).length)

// ==================== 选择 / 增删 ====================
function addPokemon(id: number) {
  if (team.value.includes(id)) return
  if (team.value.length >= MAX_TEAM) return
  team.value.push(id)
  showPicker.value = false
}
function removePokemon(id: number) {
  team.value = team.value.filter((t) => t !== id)
}
function clearTeam() {
  team.value = []
}

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
</script>

<template>
  <div class="team-builder">
    <!-- 队伍槽位 -->
    <div class="tb-slots">
      <div
        v-for="i in MAX_TEAM"
        :key="i"
        class="tb-slot"
        :class="{ filled: team[i - 1] != null }"
      >
        <template v-if="team[i - 1] != null">
          <img
            v-if="!spriteErr.has(team[i - 1]!)"
            class="tb-slot-sprite"
            :src="spriteFor(team[i - 1]!)"
            :alt="teamPokemons[i - 1]?.nameZh"
            loading="lazy"
            @error="onSpriteErr(team[i - 1]!)"
          />
          <button
            class="tb-slot-remove"
            @click="removePokemon(team[i - 1]!)"
          >
            ×
          </button>
        </template>
        <span
          v-else
          class="tb-slot-empty"
          >空</span
        >
      </div>
    </div>

    <div class="tb-actions">
      <button
        class="tb-add"
        :disabled="team.length >= MAX_TEAM"
        @click="showPicker = true"
      >
        + 添加宝可梦（{{ team.length }}/{{ MAX_TEAM }}）
      </button>
      <button
        v-if="team.length > 0"
        class="tb-clear"
        @click="clearTeam"
      >
        清空
      </button>
    </div>

    <!-- 空状态 -->
    <div
      v-if="team.length === 0"
      class="tb-empty"
    >
      <div class="tb-empty-icon">👥</div>
      <p>还没有成员，点击上方添加最多 6 只宝可梦</p>
      <p class="tb-empty-tip">系统会自动分析队伍的属性防守弱点与进攻覆盖</p>
    </div>

    <template v-else>
      <!-- 成员明细 -->
      <div class="tb-members">
        <div
          v-for="p in teamPokemons"
          :key="p.id"
          class="tb-member"
        >
          <img
            v-if="!spriteErr.has(p.id)"
            class="tb-member-sprite"
            :src="spriteFor(p.id)"
            :alt="p.nameZh"
            loading="lazy"
            @error="onSpriteErr(p.id)"
          />
          <div class="tb-member-info">
            <span class="tb-member-name">#{{ p.id }} {{ p.nameZh }}</span>
            <div class="tb-member-types">
              <TypeBadge
                v-for="t in p.types"
                :key="t"
                :type="t"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 防守弱点 -->
      <h3 class="block-title">防守弱点分析</h3>
      <div class="tb-grid">
        <div
          v-for="c in defCells"
          :key="'def-' + c.def"
          class="tb-cell"
          :style="{ backgroundColor: DEF_STYLE[c.level].bg, color: DEF_STYLE[c.level].fg }"
        >
          <span class="tb-cell-name">{{ c.name }}</span>
          <span class="tb-cell-tag">
            {{ c.count > 0 && c.level !== 'neutral' ? DEF_STYLE[c.level].tag + c.count : DEF_STYLE[c.level].tag }}
          </span>
        </div>
      </div>
      <div class="tb-summary">
        <span
          v-if="weakTypes.length"
          class="tb-sum-tag tb-sum-weak"
          >弱点：{{ weakTypes.join('、') }}</span
        >
        <span
          v-if="immuneTypes.length"
          class="tb-sum-tag tb-sum-immune"
          >免疫：{{ immuneTypes.join('、') }}</span
        >
        <span
          v-if="resistTypes.length"
          class="tb-sum-tag tb-sum-resist"
          >抗性：{{ resistTypes.join('、') }}</span
        >
      </div>

      <!-- 进攻覆盖 -->
      <h3 class="block-title">
        进攻属性覆盖
        <span class="tb-sub">已覆盖 {{ coveredCount }}/18</span>
      </h3>
      <div class="tb-grid">
        <div
          v-for="c in offCells"
          :key="'off-' + c.def"
          class="tb-cell"
          :style="
            c.covered
              ? { backgroundColor: '#51cf66', color: '#fff' }
              : { backgroundColor: '#f1f2f5', color: '#868e96' }
          "
        >
          <span class="tb-cell-name">{{ c.name }}</span>
          <span class="tb-cell-tag">{{ c.covered ? '✓' : '·' }}</span>
        </div>
      </div>
    </template>

    <!-- 选择器 -->
    <van-popup
      v-model:show="showPicker"
      position="bottom"
      round
      class="tb-picker-popup"
    >
      <div class="tb-picker">
        <div class="tb-picker-head">
          <span>添加宝可梦</span>
          <svg class="close-btn" viewBox="0 0 24 24" fill="none" @click="showPicker = false"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <SearchBox
          v-model="pickerQuery"
          placeholder="搜索名称或编号"
        />
        <div class="tb-picker-list">
          <button
            v-for="p in pickerList"
            :key="p.id"
            class="tb-picker-item"
            :disabled="team.includes(p.id)"
            @click="addPokemon(p.id)"
          >
            <img
              v-if="!spriteErr.has(p.id)"
              class="tb-picker-sprite"
              :src="spriteFor(p.id)"
              :alt="p.nameZh"
              loading="lazy"
              @error="onSpriteErr(p.id)"
            />
            <span class="tb-picker-id">#{{ p.id }}</span>
            <span class="tb-picker-name">{{ p.nameZh }}</span>
            <span
              v-if="team.includes(p.id)"
              class="tb-picker-added"
              >已加入</span
            >
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
  </div>
</template>

<style scoped>
.team-builder {
  padding: 14px 12px 16px;
}

/* 槽位 */
.tb-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.tb-slot {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed var(--poke-line);
}
.tb-slot.filled {
  border-style: solid;
  border-color: transparent;
}
.tb-slot-sprite {
  width: 68%;
  height: 68%;
  object-fit: contain;
}
.tb-slot-empty {
  font-size: 14px;
  color: var(--poke-ink-3);
}
.tb-slot-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

/* 操作 */
.tb-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.tb-add {
  flex: 1;
  border: none;
  background: var(--poke-red);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.tb-add:disabled {
  background: #f1c4ca;
  cursor: not-allowed;
}
.tb-clear {
  border: none;
  background: #f1f2f5;
  color: var(--poke-ink-2);
  font-size: 13px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* 空状态 */
.tb-empty {
  text-align: center;
  padding: 30px 16px;
  color: var(--poke-ink-3);
}
.tb-empty-icon {
  font-size: 44px;
  margin-bottom: 10px;
}
.tb-empty p {
  font-size: 14px;
}
.tb-empty-tip {
  font-size: 12px !important;
  margin-top: 6px;
  color: var(--poke-ink-3);
}

/* 成员 */
.tb-members {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.tb-member {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  box-shadow: var(--shadow-sm);
}
.tb-member-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.tb-member-info {
  flex: 1;
}
.tb-member-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink);
  margin-bottom: 4px;
}
.tb-member-types {
  display: flex;
  gap: 4px;
}

/* 标题 */
.block-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--poke-ink);
  margin: 4px 0 10px;
  padding-left: 10px;
  border-left: 4px solid var(--poke-red);
}
.tb-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--poke-ink-3);
}

/* 网格 */
.tb-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}
.tb-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 2px;
  border-radius: var(--radius-sm);
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.1);
}
.tb-cell-name {
  font-size: 12px;
  font-weight: 700;
}
.tb-cell-tag {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.9;
}

.tb-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.tb-sum-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-weight: 600;
}
.tb-sum-weak {
  color: #e0314a;
  background: #ffe3e7;
}
.tb-sum-immune {
  color: #495057;
  background: #e9ecef;
}
.tb-sum-resist {
  color: #2b8a3e;
  background: #ebfbee;
}

/* 选择器 */
.tb-picker-popup {
  height: 78vh;
}
.tb-picker {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.tb-picker-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  color: var(--poke-ink);
}
.tb-picker-head .close-btn {
  width: 22px;
  height: 22px;
  color: var(--poke-ink-3);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}
.tb-picker-head .close-btn:active {
  color: var(--poke-red);
}
.tb-picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px;
}
.tb-picker-item {
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
.tb-picker-item:disabled {
  opacity: 0.5;
  cursor: default;
}
.tb-picker-item:active:not(:disabled) {
  background: var(--poke-cream);
}
.tb-picker-sprite {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.tb-picker-id {
  font-size: 12px;
  color: var(--poke-ink-3);
  width: 44px;
}
.tb-picker-name {
  font-size: 14px;
  color: var(--poke-ink);
  font-weight: 500;
  flex: 1;
}
.tb-picker-added {
  font-size: 11px;
  color: var(--poke-red);
}
</style>
