<script setup lang="ts">
import { ref, computed, watch, onActivated, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import { usePokedexStore, MAX_TYPE_SELECT } from '@/stores/pokedex'
import { PokemonCard, TypeFilterTag } from '@/components'
import { REGIONS } from '@/constants/pokemon'

defineOptions({ name: 'Pokedex' })

const router = useRouter()
const store = usePokedexStore()
const searchText = ref(store.searchQuery)

// ====== 更多筛选下拉面板状态 ======
const morePanelOpen = ref(false)
const genSubOpen = ref(false)
const moreTriggerRef = ref<HTMLElement | null>(null)
// 动态计算下拉框位置：紧跟"更多"按钮，宽度更宽松，但不超出屏幕
const morePanelStyle = computed(() => {
  if (!moreTriggerRef.value) return {}
  const rect = moreTriggerRef.value.getBoundingClientRect()
  const panelWidth = Math.max(rect.width * 1.6, 200)
  // 右对齐按钮，但左边缘不超出屏幕（留 8px 边距）
  let left = rect.right - panelWidth
  if (left < 8) left = 8
  return {
    top: `${rect.bottom + 4}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
  }
})

// 世代全选 / 全部取消（全选时按钮变「全部取消」；其余情况一律全选）
function toggleAllGens() {
  if (store.isAllGenerations) {
    store.clearGenerations()
  } else {
    store.selectAllGenerations()
  }
}

// 点击页面其他区域关闭下拉面板
function onPageClick() {
  if (morePanelOpen.value) morePanelOpen.value = false
}

// ====== 实时搜索：watch 自动同步到 store ======
watch(searchText, (val) => {
  store.setSearch(val)
})


// ====== 滚动位置缓存 + 返回顶部 ======
// 实际滚动容器是 window（外层 .page-container 高度随内容展开，不形成自身滚动），
// 因此监听 window 的 scroll 事件
const savedScrollY = ref(0)
const showBackTop = ref(false)

function getScrollTop(): number {
  return window.scrollY || document.documentElement.scrollTop || 0
}

function syncBackTop() {
  showBackTop.value = getScrollTop() > 400
}

function onWindowScroll() {
  syncBackTop()
}

onActivated(() => {
  if (savedScrollY.value > 0) {
    window.scrollTo({ top: savedScrollY.value })
  }
  syncBackTop()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
})

onDeactivated(() => {
  savedScrollY.value = getScrollTop()
  window.removeEventListener('scroll', onWindowScroll)
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearSearch() {
  searchText.value = ''
  store.setSearch('')
}

// 重置首页筛选（世代全选、清空搜索/属性），同步清空本地搜索框
function onResetFilters() {
  store.resetFilters()
  searchText.value = ''
  morePanelOpen.value = false
  genSubOpen.value = false
}

function goDetail(id: number) {
  router.push(`/pokemon/${id}`)
}
</script>

<template>
  <div class="pokedex-page" @click="onPageClick">
    <!-- 顶部标题栏（精简） -->
    <div class="pokedex-header">
      <h1 class="pokedex-title">宝可梦图鉴</h1>
      <span class="pokedex-count">{{ store.filteredList.length }} / {{ store.pokemonList.length }}</span>
    </div>

    <!-- 搜索框（位于属性筛选上方，按名字或编号搜索） -->
    <div class="name-search-bar">
      <!-- 左侧：搜索矢量图标 -->
      <svg class="name-search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>

      <input
        v-model="searchText"
        class="name-search-input"
        type="text"
        placeholder="搜索名字或编号 (#001)..."
        inputmode="search"
      />

      <!-- 右侧：一键清空按钮 -->
      <button
        v-if="searchText"
        class="name-search-clear"
        type="button"
        aria-label="清空"
        @click="clearSearch"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <line x1="8" y1="8" x2="16" y2="16" stroke="#fff" stroke-width="2" stroke-linecap="round" />
          <line x1="16" y1="8" x2="8" y2="16" stroke="#fff" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- 类型筛选（多选，最多 2 个） -->
    <div class="type-filter-row">
      <TypeFilterTag
        :type="null"
        :active="store.selectedTypes.length === 0"
        @click="store.toggleTypeFilter(null)"
      />
      <TypeFilterTag
        v-for="type in store.allTypes"
        :key="type"
        :type="type"
        :active="store.isTypeSelected(type)"
        :disabled="!store.canSelectMoreType && !store.isTypeSelected(type)"
        @click="store.toggleTypeFilter(type)"
      />
    </div>

    <!-- 更多筛选下拉（嵌套：更多 -> 世代 -> 第几世代） -->
    <div class="more-filter">
      <button class="more-trigger" ref="moreTriggerRef" type="button" @click.stop="morePanelOpen = !morePanelOpen">
        <span>更多</span>
        <svg class="more-caret" :class="{ open: morePanelOpen }" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 重置首页筛选 -->
      <button class="reset-trigger" type="button" @click.stop="onResetFilters">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M3 3v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>重置</span>
      </button>

      <transition name="more-fade">
        <div v-if="morePanelOpen" class="more-panel" :style="morePanelStyle" @click.stop>
          <!-- 地区分组（原世代分类，现按地区分类） -->
          <div class="more-group">
            <button class="more-group-head" type="button" @click.stop="genSubOpen = !genSubOpen">
              <span>地区</span>
              <span class="more-group-state">
                {{ store.isAllGenerations ? '全部' : `${store.selectedGenerations.length} 项` }}
              </span>
              <svg class="more-sub-caret" :class="{ open: genSubOpen }" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <transition name="more-sub-fade">
              <div v-if="genSubOpen" class="more-sub-list">
                <button
                  v-for="g in REGIONS"
                  :key="g.gen"
                  class="more-sub-item"
                  :class="{ active: store.selectedGenerations.includes(g.gen) }"
                  type="button"
                  @click.stop="store.toggleGeneration(g.gen)"
                >
                  <span class="more-sub-check" :class="{ on: store.selectedGenerations.includes(g.gen) }"></span>
                  {{ g.regionZh }}地区
                  <span class="more-sub-range">#{{ g.start }}-{{ g.end }}</span>
                </button>
                <button class="more-sub-all" type="button" @click.stop="toggleAllGens">
                  {{ store.isAllGenerations ? '全部取消' : '全选地区' }}
                </button>
              </div>
            </transition>
          </div>
        </div>
      </transition>
    </div>

    <!-- 已选提示 -->
    <div v-if="store.selectedTypes.length > 0" class="selected-tip">
      已选：
      <span
        v-for="t in store.selectedTypes"
        :key="t"
        class="selected-chip"
        :style="{ background: store.getTypeColor(t) }"
      >
        {{ store.getTypeName(t) }}
        <button
          class="selected-chip__close"
          type="button"
          aria-label="删除"
          @click.stop="store.toggleTypeFilter(t)"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
          </svg>
        </button>
      </span>
      <span v-if="store.selectedTypes.length >= MAX_TYPE_SELECT" class="max-hint">
        （已满{{ MAX_TYPE_SELECT }}项）
      </span>
    </div>

    <!-- 宝可梦卡片列表 -->
    <div class="pokemon-grid">
      <PokemonCard
        v-for="pokemon in store.filteredList"
        :key="pokemon.id"
        :pokemon="pokemon"
        :dimmed="store.isFilteredOut(pokemon)"
        @click="goDetail(pokemon.id)"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="store.filteredList.length === 0" class="empty-state">
      <van-empty description="没有找到匹配的宝可梦" image="search" />
    </div>

    <!-- 返回顶部 -->
    <transition name="backtop-fade">
      <button
        v-if="showBackTop"
        class="back-to-top"
        type="button"
        aria-label="返回顶部"
        @click.stop="scrollToTop"
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 19V5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          <path d="M6 11l6-6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </transition>
  </div>
</template>

<style scoped>
.pokedex-page {
  position: relative;
  min-height: calc(100vh - 56px - env(safe-area-inset-bottom, 0px) - 8px);
  padding: 0 12px 8px;
  background: var(--poke-cream);
  box-sizing: border-box;
  width: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
  /* 细滚动条：可见但不额外占据位置 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.22) transparent;
}
.pokedex-page::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.pokedex-page::-webkit-scrollbar-track {
  background: transparent;
}
.pokedex-page::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.22);
  border-radius: 6px;
}
.pokedex-page::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.38);
}

/* 顶部柔和红色区（拉长 + 与下方底色温和过渡） */
.pokedex-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 320px;
  /* 上段实红，向下逐渐淡出为米白，形成柔和过渡而非硬边 */
  background: linear-gradient(
    180deg,
    var(--poke-red) 0%,
    var(--poke-red) 42%,
    var(--poke-red-deep) 64%,
    #ffb3bd 82%,
    var(--poke-cream) 100%
  );
  z-index: 0;
  pointer-events: none;
}

.pokedex-page > * {
  position: relative;
  z-index: 1;
}

/* ====== 标题栏 ====== */
.pokedex-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 18px 6px 14px;
}

.pokedex-title {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.pokedex-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.22);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  backdrop-filter: blur(4px);
}

/* ====== 更多筛选下拉 ====== */
.more-filter {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 4px;
  z-index: 10;
}

/* 重置按钮（右侧） */
.reset-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
  color: var(--poke-ink-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, color 0.15s;
}
.reset-trigger:active {
  transform: scale(0.96);
  color: var(--poke-red);
}
.reset-trigger svg {
  width: 15px;
  height: 15px;
}

.more-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 18px;
  border: none;
  border-radius: var(--radius-pill);
  background: #fff;
  box-shadow: var(--shadow-sm);
  color: var(--poke-red);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
}
.more-trigger:active {
  transform: scale(0.96);
}
.more-caret {
  width: 16px;
  height: 16px;
  color: var(--poke-ink-3);
  transition: transform 0.2s;
}
.more-caret.open {
  transform: rotate(180deg);
}

.more-panel {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 10px 6px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 筛选项分组（后续可在同级加其他分组） */
.more-group {
  border-radius: var(--radius-sm);
}

.more-group + .more-group {
  margin-top: 6px;
  border-top: 1px solid var(--poke-line);
  padding-top: 6px;
}

.more-group-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--poke-ink);
  text-align: left;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}
.more-group-head:active {
  background: #f5f5f5;
}
.more-group-state {
  font-size: 12px;
  font-weight: 500;
  color: var(--poke-ink-3);
  margin-left: auto;
}
.more-sub-caret {
  width: 16px;
  height: 16px;
  color: var(--poke-ink-3);
  transition: transform 0.2s;
}
.more-sub-caret.open {
  transform: rotate(90deg);
}

.more-sub-list {
  padding: 4px 6px 8px;
}

.more-sub-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--poke-ink-2);
  text-align: left;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}
.more-sub-item:active {
  background: #f5f5f5;
}
.more-sub-check {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #dcdee5;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
  position: relative;
}
.more-sub-check.on {
  background: var(--poke-red);
  border-color: var(--poke-red);
}
.more-sub-check.on::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.more-sub-item.active {
  color: var(--poke-red);
  font-weight: 600;
}
.more-sub-range {
  margin-left: auto;
  font-size: 12px;
  color: var(--poke-ink-3);
  font-weight: 500;
}
.more-sub-all {
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--poke-red-soft);
  color: var(--poke-red);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* 面板/子列表淡入动画 */
.more-fade-enter-active,
.more-fade-leave-active {
  transition: opacity 0.18s, transform 0.18s;
}
.more-fade-enter-from,
.more-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.more-sub-fade-enter-active,
.more-sub-fade-leave-active {
  transition: opacity 0.16s, max-height 0.2s;
  overflow: hidden;
}
.more-sub-fade-enter-from,
.more-sub-fade-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ====== 名字搜索框（位于属性筛选上方） ====== */
.name-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 2px 12px;
  padding: 11px 16px;
  background: #fff;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, transform 0.15s;
}
.name-search-bar:focus-within {
  box-shadow: 0 4px 16px rgba(255, 68, 89, 0.18);
}

/* 左侧搜索矢量图标 */
.name-search-icon {
  width: 18px;
  height: 18px;
  color: var(--poke-ink-3);
  flex-shrink: 0;
}

.name-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--poke-ink);
  -webkit-appearance: none;
  min-width: 0;
}

.name-search-input::placeholder {
  color: var(--poke-ink-3);
  font-size: 13px;
}

/* 右侧一键清空按钮 */
.name-search-clear {
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: #f0f0f3;
  color: var(--poke-ink-3);
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.name-search-clear:active {
  background: #e3e3e8;
}
.name-search-clear svg {
  width: 16px;
  height: 16px;
}

/* ====== 类型筛选栏（固定尺寸，每行数量自适应换行） ====== */
.type-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 1px 4px;
}

/* ====== 已选提示 ====== */
.selected-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 2px 8px;
  font-size: 12px;
  color: var(--poke-ink-2);
  flex-wrap: wrap;
}

.max-hint {
  color: var(--poke-red);
  font-weight: 600;
}

/* 已选属性 chip（自定义 × 删除，替代 van-tag closeable 字体图标） */
.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 12px;
  border-radius: var(--radius-pill);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}
.selected-chip__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.selected-chip__close:active {
  background: rgba(255, 255, 255, 0.5);
}
.selected-chip__close svg {
  width: 11px;
  height: 11px;
}

/* ====== 卡片列表 ====== */
.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  padding: 6px 1px;
}

/* ====== 空状态 ====== */
.empty-state {
  text-align: center;
  padding: 60px 0 40px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ====== 返回顶部按钮 ====== */
.back-to-top {
  position: fixed;
  right: 16px;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 16px);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--poke-red);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 68, 89, 0.45);
  z-index: 50;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, box-shadow 0.15s;
}
.back-to-top:active {
  transform: scale(0.92);
  box-shadow: 0 2px 10px rgba(255, 68, 89, 0.4);
}
.back-to-top svg {
  width: 22px;
  height: 22px;
}
.backtop-fade-enter-active,
.backtop-fade-leave-active {
  transition: opacity 0.22s, transform 0.22s;
}
.backtop-fade-enter-from,
.backtop-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.8);
}
</style>
