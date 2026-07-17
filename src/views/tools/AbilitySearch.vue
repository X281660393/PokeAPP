<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ABILITY_LIST, getAbilityOwners } from '@/data/relations'
import { TypeBadge, SearchBox } from '@/components'

const router = useRouter()
const route = useRoute()

const query = ref('')
/** 图片加载失败时隐藏 */
const spriteErr = ref<Set<number>>(new Set())
function onSpriteErr(id: number) {
  spriteErr.value.add(id)
}
const selectedKey = ref<string | null>(null)

const filtered = computed(() => {
  const q = query.value.trim()
  let list = ABILITY_LIST
  if (q) {
    const ql = q.toLowerCase()
    list = list.filter(
      (a) => a.info.nameZh.includes(q) || a.key.toLowerCase().includes(ql),
    )
  }
  // 排序优化：统一按中文名排序，结果稳定可预期
  return list
    .slice()
    .sort((a, b) => a.info.nameZh.localeCompare(b.info.nameZh, 'zh-Hans-CN'))
})

const selectedAbility = computed(() =>
  selectedKey.value ? ABILITY_LIST.find((a) => a.key === selectedKey.value) ?? null : null,
)
const owners = computed(() => (selectedKey.value ? getAbilityOwners(selectedKey.value) : []))
const shownOwners = computed(() => owners.value.slice(0, 60))

function openAbility(key: string) {
  selectedKey.value = key
}
/** 点击「拥有该特性的宝可梦」跳转详情页 */
function goPokemon(id: number) {
  router.push(`/pokemon/${id}`)
}

// 支持通过 ?key= 深链直接打开特性详情（如场地/状态页关联特性跳转）
watch(
  () => route.query.key,
  (k) => {
    if (typeof k === 'string' && ABILITY_LIST.some((a) => a.key === k)) {
      selectedKey.value = k
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="ability-search">
    <!-- 列表视图 -->
    <template v-if="!selectedAbility">
      <div class="ab-filter">
        <SearchBox
          v-model="query"
          placeholder="搜索特性名称"
        />
      </div>
      <div class="ab-count">
        共 {{ filtered.length }} 个特性
      </div>
      <div class="ab-list">
        <button
          v-for="a in filtered"
          :key="a.key"
          class="ab-item"
          @click="openAbility(a.key)"
        >
          <span class="ab-item-name">{{ a.info.nameZh }}</span>
          <span class="ab-item-desc">{{ a.info.descZh }}</span>
        </button>
        <p
          v-if="filtered.length === 0"
          class="no-data"
        >
          没有匹配的特性
        </p>
      </div>
    </template>

    <!-- 详情视图 -->
    <template v-else>
      <div class="ab-detail-head">
        <span class="ab-detail-title">{{ selectedAbility.info.nameZh }}</span>
      </div>

      <div class="ab-detail-card">
        <p class="ab-desc">{{ selectedAbility.info.descZh }}</p>
      </div>

      <h3 class="block-title">
        拥有该特性的宝可梦
        <span class="ab-sub">（共 {{ owners.length }} 只）</span>
      </h3>
      <div class="ab-owner-list">
        <div
          v-for="pk in shownOwners"
          :key="pk.id"
          class="ab-owner ab-owner--link"
          @click="goPokemon(pk.id)"
        >
          <img
            v-if="!spriteErr.has(pk.id)"
            class="ab-owner-sprite"
            :src="pk.spriteUrl"
            :alt="pk.nameZh"
            loading="lazy"
            @error="onSpriteErr(pk.id)"
          />
          <div class="ab-owner-info">
            <span class="ab-owner-name">#{{ pk.id }} {{ pk.nameZh }}</span>
            <div class="ab-owner-types">
              <TypeBadge
                v-for="t in pk.types"
                :key="t"
                :type="t"
                size="sm"
              />
            </div>
          </div>
          <span
            v-if="pk.isHidden"
            class="ab-hidden-tag"
            >隐藏</span
          >
          <span class="ab-owner-arrow">›</span>
        </div>
        <p
          v-if="owners.length === 0"
          class="no-data"
        >
          暂无宝可梦拥有该特性
        </p>
        <p
          v-else-if="owners.length > shownOwners.length"
          class="ab-more"
        >
          仅显示前 {{ shownOwners.length }} 只
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ability-search {
  padding: 8px 12px 16px;
}

.ab-filter {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--poke-cream);
  padding-top: 4px;
}
.ab-count {
  font-size: 12px;
  color: var(--poke-ink-3);
  padding: 6px 4px;
}
.ab-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ab-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
.ab-item:active {
  transform: scale(0.98);
}
.ab-item-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--poke-ink);
}
.ab-item-desc {
  font-size: 12px;
  color: var(--poke-ink-3);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ab-detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 2px 12px;
}
.ab-detail-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--poke-ink);
}
.ab-detail-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 14px;
}
.ab-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--poke-ink-2);
}

.block-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--poke-ink);
  margin: 4px 0 10px;
  padding-left: 10px;
  border-left: 4px solid var(--poke-red);
}
.ab-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--poke-ink-3);
}

.ab-owner-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ab-owner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  box-shadow: var(--shadow-sm);
}
.ab-owner--link {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s;
}
.ab-owner--link:active {
  transform: scale(0.98);
}
.ab-owner-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.ab-owner-info {
  flex: 1;
}
.ab-owner-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink);
  margin-bottom: 4px;
}
.ab-owner-types {
  display: flex;
  gap: 4px;
}
.ab-hidden-tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #9c36b5;
  background: #f8e6fb;
  padding: 3px 8px;
  border-radius: 8px;
}
.ab-owner-arrow {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--poke-ink-3);
  margin-left: 2px;
}
.ab-more {
  font-size: 12px;
  color: var(--poke-ink-3);
  text-align: center;
  padding: 4px 0;
}
</style>
