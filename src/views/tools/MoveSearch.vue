<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ALL_TYPES } from '@/constants/pokemon'
import {
  MOVE_LIST,
  getMoveLearners,
  MOVE_METHOD_LABEL,
  type MoveMethod,
} from '@/data/relations'
import { MOVE_DB } from '@/data/moves/pokemon-moves'
import type { MoveDesc } from '@/data/moves/pokemon-move-descriptions'
import { TypeBadge, SearchBox, TypeFilterTag } from '@/components'

const CAT_LABEL: Record<string, string> = {
  physical: '物理',
  special: '特殊',
  status: '变化',
}
const route = useRoute()
const router = useRouter()

const query = ref('')
/** 图片加载失败时隐藏 */
const spriteErr = ref<Set<number>>(new Set())
function onSpriteErr(id: number) {
  spriteErr.value.add(id)
}
const selectedType = ref('')
const selectedCat = ref('')
const selectedKey = ref<string | null>(null)

const filtered = computed(() => {
  const q = query.value.trim()
  let list = MOVE_LIST
  if (q) list = list.filter((m) => m.info.nameZh.includes(q) || m.key.includes(q.toLowerCase()))
  if (selectedType.value) list = list.filter((m) => m.info.type === selectedType.value)
  if (selectedCat.value) list = list.filter((m) => m.info.category === selectedCat.value)
  // 按数据文件（MOVE_DB）原样顺序输出，不做额外排序
  return list.slice()
})

const selectedMove = computed(() =>
  selectedKey.value ? MOVE_LIST.find((m) => m.key === selectedKey.value) ?? null : null,
)
/** 招式「介绍/技能效果」中文数据（懒加载，避免放大包体） */
const moveDescMap = ref<Record<string, MoveDesc>>({})
const moveDesc = computed<MoveDesc | null>(() =>
  selectedKey.value ? (moveDescMap.value[selectedKey.value] ?? null) : null,
)
const learners = computed(() =>
  selectedKey.value ? getMoveLearners(selectedKey.value) : [],
)
const shownLearners = computed(() => learners.value.slice(0, 60))

function toggleType(t: string) {
  selectedType.value = selectedType.value === t ? '' : t
}
function resetFilters() {
  query.value = ''
  selectedType.value = ''
  selectedCat.value = ''
}
/** 打开详情前记录的列表滚动位置，用于返回时还原（不置顶） */
let savedScrollY = 0
/** 取当前真实滚动位置（兼容 WebView / 不同滚动根） */
function getScrollTop(): number {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  )
}
/** 返回列表后还原滚动位置：等列表重新渲染、高度稳定后再滚动 */
function restoreScroll() {
  const top = savedScrollY
  if (!top) return
  const doScroll = () => {
    const root = document.scrollingElement || document.documentElement
    if (root.scrollHeight >= top) {
      window.scrollTo({ top })
      return true
    }
    return false
  }
  requestAnimationFrame(() => {
    if (!doScroll()) {
      requestAnimationFrame(doScroll)
      setTimeout(doScroll, 150)
    }
  })
}
function openMove(key: string) {
  savedScrollY = getScrollTop()
  selectedKey.value = key
  // 写入 URL，使历史记录选中态；从「相关」跳走再返回时可还原详情
  router.push({ query: { key } })
}
/** 点击「可学习宝可梦」跳转详情页 */
function goPokemon(id: number) {
  router.push(`/pokemon/${id}`)
}

// 一键返回顶部：滚动超过阈值显示浮动按钮
const showBackTop = ref(false)
function onScroll() {
  showBackTop.value = window.scrollY > 300
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  // 懒加载招式「介绍/技能效果」中文数据（与 MOVE_DB 解耦）
  import('@/data/moves/pokemon-move-descriptions').then((m) => {
    moveDescMap.value = m.MOVE_DESCRIPTIONS
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

// 支持通过 ?key= 深链直接打开招式详情（如场地/状态页关联招式跳转）
// 同时：缺失 key 时清空选中，返回列表态也能正确还原
// 从详情返回列表时，还原打开前的滚动位置（不置顶）
watch(
  () => route.query.key,
  (k) => {
    if (typeof k === 'string' && MOVE_DB[k]) {
      selectedKey.value = k
    } else {
      const wasDetail = selectedKey.value !== null
      selectedKey.value = null
      if (wasDetail) {
        restoreScroll()
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="move-search">
    <!-- 列表视图 -->
    <template v-if="!selectedMove">
      <!-- 筛选栏 -->
      <div class="ms-filter">
        <SearchBox
          v-model="query"
          placeholder="搜索招式名称"
        />
        <div class="ms-type-chips">
          <TypeFilterTag
            :type="null"
            :active="selectedType === ''"
            @click="selectedType = ''"
          />
          <TypeFilterTag
            v-for="t in ALL_TYPES"
            :key="t"
            :type="t"
            :active="selectedType === t"
            @click="toggleType(t)"
          />
        </div>
        <div class="ms-cat-row">
          <button
            class="ms-cat"
            :class="{ active: selectedCat === '' }"
            @click="selectedCat = ''"
          >
            全部
          </button>
          <button
            class="ms-cat"
            :class="{ active: selectedCat === 'physical' }"
            @click="selectedCat = 'physical'"
          >
            物理
          </button>
          <button
            class="ms-cat"
            :class="{ active: selectedCat === 'special' }"
            @click="selectedCat = 'special'"
          >
            特殊
          </button>
          <button
            class="ms-cat"
            :class="{ active: selectedCat === 'status' }"
            @click="selectedCat = 'status'"
          >
            变化
          </button>
          <button
            v-if="query || selectedType || selectedCat"
            class="ms-cat ms-cat-reset"
            @click="resetFilters"
          >
            重置
          </button>
        </div>
      </div>

      <!-- 结果计数 -->
      <div class="ms-count">
        共 {{ filtered.length }} 个招式
      </div>

      <!-- 列表 -->
      <div class="ms-list">
        <button
          v-for="m in filtered"
          :key="m.key"
          class="ms-item"
          @click="openMove(m.key)"
        >
          <div class="ms-item-main">
            <span class="ms-item-name">{{ m.info.nameZh }}</span>
            <TypeBadge
              :type="m.info.type"
              size="sm"
            />
          </div>
          <div class="ms-item-meta">
            <span class="ms-cat-tag">{{ CAT_LABEL[m.info.category] }}</span>
            <span class="ms-gen-tag" v-if="m.info.gen">第{{ m.info.gen }}代</span>
            <span class="ms-meta-val">威力 {{ m.info.power ?? '—' }}</span>
            <span class="ms-meta-val">命中 {{ m.info.accuracy ?? '—' }}</span>
            <span class="ms-meta-val">PP {{ m.info.pp ?? '—' }}</span>
          </div>
        </button>
        <p
          v-if="filtered.length === 0"
          class="no-data"
        >
          没有匹配的招式
        </p>
      </div>
    </template>

    <!-- 详情视图 -->
    <template v-else>
      <div class="ms-detail-head">
        <span class="ms-detail-title">{{ selectedMove.info.nameZh }}</span>
      </div>

      <div class="ms-detail-card">
        <div class="ms-detail-badges">
          <TypeBadge
            :type="selectedMove.info.type"
            size="md"
          />
          <span class="ms-cat-tag ms-cat-tag--lg">{{ CAT_LABEL[selectedMove.info.category] }}</span>
          <span class="ms-gen-tag ms-gen-tag--lg" v-if="selectedMove.info.gen">第{{ selectedMove.info.gen }}代</span>
        </div>
        <div class="ms-stat-grid">
          <div class="ms-stat-cell">
            <span class="ms-stat-num">{{ selectedMove.info.power ?? '—' }}</span>
            <span class="ms-stat-label">威力</span>
          </div>
          <div class="ms-stat-cell">
            <span class="ms-stat-num">{{ selectedMove.info.accuracy ?? '—' }}</span>
            <span class="ms-stat-label">命中</span>
          </div>
          <div class="ms-stat-cell">
            <span class="ms-stat-num">{{ selectedMove.info.pp ?? '—' }}</span>
            <span class="ms-stat-label">PP</span>
          </div>
        </div>
      </div>

      <!-- 技能效果（具体数值 additionalEffect 最前，其次 description + 机制列表 + 范围） -->
      <section
        v-if="moveDesc?.description || (moveDesc?.effect && moveDesc.effect.length) || moveDesc?.additionalEffect || moveDesc?.range"
        class="ms-desc-block"
      >
        <h3 class="block-title">技能效果</h3>
        <p
          v-if="moveDesc.additionalEffect"
          class="ms-add-effect"
        >
          {{ moveDesc.additionalEffect }}
        </p>
        <p
          v-if="moveDesc.description"
          class="ms-desc-text"
        >
          {{ moveDesc.description }}
        </p>
        <ul
          v-if="moveDesc.effect && moveDesc.effect.length"
          class="ms-effect-list"
        >
          <li
            v-for="(e, i) in moveDesc.effect"
            :key="i"
          >
            {{ e }}
          </li>
        </ul>
        <p
          v-if="moveDesc.range"
          class="ms-range"
        >
          攻击范围：{{ moveDesc.range }}
        </p>
      </section>

      <h3 class="block-title">
        可学习宝可梦
        <span class="ms-sub">（共 {{ learners.length }} 只）</span>
      </h3>
      <div class="ms-learner-list">
        <div
          v-for="pk in shownLearners"
          :key="pk.id"
          class="ms-learner ms-learner--link"
          @click="goPokemon(pk.id)"
        >
          <img
            v-if="!spriteErr.has(pk.id)"
            class="ms-learner-sprite"
            :src="pk.spriteUrl"
            :alt="pk.nameZh"
            loading="lazy"
            @error="onSpriteErr(pk.id)"
          />
          <div class="ms-learner-info">
            <span class="ms-learner-name">#{{ pk.id }} {{ pk.nameZh }}</span>
            <div class="ms-learner-types">
              <TypeBadge
                v-for="t in pk.types"
                :key="t"
                :type="t"
                size="sm"
              />
            </div>
          </div>
          <span
            class="ms-method"
            :class="'ms-method--' + pk.method"
          >
            {{ MOVE_METHOD_LABEL[pk.method as MoveMethod] }}<template
              v-if="pk.method === 'level' && pk.level"
              >{{ pk.level }}</template
            >
          </span>
          <span class="ms-learner-arrow">›</span>
        </div>
        <p
          v-if="learners.length === 0"
          class="no-data"
        >
          暂无宝可梦可学习该招式
        </p>
        <p
          v-else-if="learners.length > shownLearners.length"
          class="ms-more"
        >
          仅显示前 {{ shownLearners.length }} 只
        </p>
      </div>
    </template>

    <!-- 一键返回顶部 -->
    <button
      v-if="showBackTop"
      class="ms-back-top"
      type="button"
      aria-label="返回顶部"
      @click="scrollToTop"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.move-search {
  padding: 8px 12px 16px;
}

/* 筛选栏 */
.ms-filter {
  background: var(--poke-cream);
  padding-top: 4px;
}
.ms-type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 2px 8px;
}
.ms-cat-row {
  display: flex;
  gap: 8px;
  padding: 0 2px 6px;
  flex-wrap: wrap;
}
.ms-cat {
  border: none;
  background: #fff;
  color: var(--poke-ink-2);
  font-size: 12px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.ms-cat.active {
  background: var(--poke-red);
  color: #fff;
}
.ms-cat-reset {
  background: #f1f2f5;
  color: var(--poke-ink-3);
  box-shadow: none;
}

.ms-count {
  font-size: 12px;
  color: var(--poke-ink-3);
  padding: 6px 4px;
}

/* 列表 */
.ms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ms-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  text-align: left;
  border: none;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.12s;
}
.ms-item:active {
  transform: scale(0.98);
}
.ms-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ms-item-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--poke-ink);
}
.ms-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ms-cat-tag {
  font-size: 11px;
  color: var(--poke-ink-2);
  background: #f1f2f5;
  padding: 2px 8px;
  border-radius: 8px;
}
.ms-cat-tag--lg {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 10px;
}
/* 世代标签：淡色无强调（仅作信息标注） */
.ms-gen-tag {
  font-size: 11px;
  color: var(--poke-ink-3);
  background: #f1f2f5;
  padding: 2px 8px;
  border-radius: 8px;
}
.ms-gen-tag--lg {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 10px;
}
.ms-meta-val {
  font-size: 11px;
  color: var(--poke-ink-3);
}

/* 详情 */
.ms-detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 2px 12px;
}
.ms-detail-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--poke-ink);
}
.ms-detail-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 14px;
}
.ms-detail-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.ms-stat-grid {
  display: flex;
  gap: 10px;
}
.ms-stat-cell {
  flex: 1;
  background: var(--poke-cream);
  border-radius: var(--radius-sm);
  padding: 12px 0;
  text-align: center;
}
.ms-stat-num {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: var(--poke-ink);
}
.ms-stat-label {
  font-size: 11px;
  color: var(--poke-ink-3);
}

/* 介绍 / 技能效果 */
.ms-desc-block {
  margin-bottom: 14px;
}
.ms-desc-block:last-of-type {
  margin-bottom: 6px;
}
/* 具体数值效果（麻痹概率 / 属性±几级 / 自身伤害）——最突出 */
.ms-add-effect {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.75;
  font-weight: 600;
  color: var(--poke-ink);
  background: #fff3e0;
  border-left: 3px solid var(--poke-red);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: 10px 12px;
  white-space: pre-line;
}
/* 游戏内标准说明——辅助，弱化 */
.ms-desc-text {
  margin: 0 0 10px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--poke-ink-2);
  background: var(--poke-cream);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}
.ms-effect-list {
  margin: 0 0 10px;
  padding: 4px 0 4px 4px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ms-effect-list li {
  position: relative;
  padding-left: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--poke-ink-2);
}
.ms-effect-list li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--poke-red);
}
.ms-range {
  margin: 0;
  font-size: 13px;
  color: var(--poke-ink-3);
}

.ms-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--poke-ink-3);
}

.ms-learner-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ms-learner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  box-shadow: var(--shadow-sm);
}
.ms-learner--link {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s;
}
.ms-learner--link:active {
  transform: scale(0.98);
}
.ms-learner-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.ms-learner-info {
  flex: 1;
}
.ms-learner-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink);
  margin-bottom: 4px;
}
.ms-learner-types {
  display: flex;
  gap: 4px;
}
.ms-method {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
}
.ms-method--level {
  color: #e8590c;
  background: #fff0e6;
}
.ms-method--egg {
  color: #9c36b5;
  background: #f8e6fb;
}
.ms-method--machine {
  color: #1c7ed6;
  background: #e7f1fd;
}
.ms-learner-arrow {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--poke-ink-3);
  margin-left: 2px;
}
.ms-more {
  font-size: 12px;
  color: var(--poke-ink-3);
  text-align: center;
  padding: 4px 0;
}

/* 一键返回顶部浮动按钮 */
.ms-back-top {
  position: fixed;
  right: 16px;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  z-index: 20;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: var(--poke-red);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s, opacity 0.2s;
}
.ms-back-top:active {
  transform: scale(0.92);
}
.ms-back-top svg {
  width: 22px;
  height: 22px;
}
</style>
