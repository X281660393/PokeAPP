<script setup lang="ts">
import { computed, ref } from 'vue'
import { ITEM_DB } from '@/data/items/pokemon-items'
import { SearchBox } from '@/components'
import type { ItemInfo } from '@/types'

interface ItemEntry {
  key: string
  info: ItemInfo
}

const ITEM_LIST: ItemEntry[] = Object.entries(ITEM_DB).map(([key, info]) => ({
  key,
  info,
}))

/** 分类顺序（用于筛选与分组展示） */
const CATEGORIES = [
  '精灵球',
  '进化石',
  '回复',
  '战斗增强',
  '携带道具',
  '树果',
  '秘传技能',
  '重要道具',
]

const query = ref('')
const selectedCat = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  let list = ITEM_LIST
  if (selectedCat.value) list = list.filter((i) => i.info.category === selectedCat.value)
  if (q) list = list.filter((i) => i.info.nameZh.includes(q) || i.key.includes(q))
  return list.slice().sort((a, b) => a.info.nameZh.localeCompare(b.info.nameZh, 'zh'))
})

const SHOWN = 120
const shownList = computed(() => filtered.value.slice(0, SHOWN))

const selectedKey = ref<string | null>(null)
const selectedItem = computed(() =>
  selectedKey.value ? ITEM_LIST.find((i) => i.key === selectedKey.value) ?? null : null,
)

function resetFilters() {
  query.value = ''
  selectedCat.value = ''
}
</script>

<template>
  <div class="item-search">
    <!-- 列表视图 -->
    <template v-if="!selectedItem">
      <div class="is-filter">
        <SearchBox
          v-model="query"
          placeholder="搜索道具名称"
        />
        <div class="is-cat-row">
          <button
            class="is-cat"
            :class="{ active: selectedCat === '' }"
            @click="selectedCat = ''"
          >
            全部
          </button>
          <button
            v-for="c in CATEGORIES"
            :key="c"
            class="is-cat"
            :class="{ active: selectedCat === c }"
            @click="selectedCat = selectedCat === c ? '' : c"
          >
            {{ c }}
          </button>
          <button
            v-if="query || selectedCat"
            class="is-cat is-cat-reset"
            @click="resetFilters"
          >
            重置
          </button>
        </div>
      </div>

      <div class="is-count">
        共 {{ filtered.length }} 个道具<template v-if="filtered.length > SHOWN"
          >，显示前 {{ SHOWN }}</template
        >
      </div>

      <div class="is-list">
        <button
          v-for="i in shownList"
          :key="i.key"
          class="is-item"
          @click="selectedKey = i.key"
        >
          <div class="is-item-main">
            <span class="is-item-name">{{ i.info.nameZh }}</span>
            <span class="is-cat-tag">{{ i.info.category }}</span>
          </div>
          <p class="is-item-desc">{{ i.info.descZh }}</p>
        </button>
        <p
          v-if="filtered.length === 0"
          class="no-data"
        >
          没有匹配道具
        </p>
      </div>
    </template>

    <!-- 详情视图 -->
    <template v-else>
      <div class="is-detail-head">
        <span class="is-detail-title">{{ selectedItem.info.nameZh }}</span>
      </div>

      <div class="is-detail-card">
        <div class="is-detail-badges">
          <span class="is-cat-tag is-cat-tag--lg">{{ selectedItem.info.category }}</span>
          <span class="is-key-tag">{{ selectedItem.key }}</span>
        </div>
        <p class="is-detail-desc">{{ selectedItem.info.descZh }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.item-search {
  padding: 8px 12px 16px;
}

.is-filter {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--poke-cream);
  padding-top: 4px;
}
.is-cat-row {
  display: flex;
  gap: 8px;
  padding: 8px 2px 6px;
  flex-wrap: wrap;
}
.is-cat {
  border: none;
  background: #fff;
  color: var(--poke-ink-2);
  font-size: 12px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.is-cat.active {
  background: var(--poke-red);
  color: #fff;
}
.is-cat-reset {
  background: #f1f2f5;
  color: var(--poke-ink-3);
  box-shadow: none;
}

.is-count {
  font-size: 12px;
  color: var(--poke-ink-3);
  padding: 6px 4px;
}

.is-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.is-item {
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
.is-item:active {
  transform: scale(0.98);
}
.is-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.is-item-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--poke-ink);
}
.is-item-desc {
  font-size: 11px;
  color: var(--poke-ink-3);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.is-cat-tag {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--poke-ink-2);
  background: #f1f2f5;
  padding: 2px 8px;
  border-radius: 8px;
}
.is-cat-tag--lg {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 10px;
}

.is-detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 2px 12px;
}
.is-detail-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--poke-ink);
}
.is-detail-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 14px;
}
.is-detail-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.is-key-tag {
  font-size: 11px;
  color: var(--poke-ink-3);
  background: var(--poke-cream);
  padding: 4px 10px;
  border-radius: 8px;
}
.is-detail-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--poke-ink);
}
</style>
