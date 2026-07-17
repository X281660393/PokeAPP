<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ABILITY_DB } from '@/data/abilities/pokemon-abilities'
import { MOVE_DB } from '@/data/moves/pokemon-moves'
import { SearchBox } from '@/components'

/** 通用条目形状：天气 / 场地 / 异常状态 共享（不含 key，key 由 db 的索引提供） */
interface CodexData {
  nameZh: string
  descZh: string
  color?: string
  relatedAbilities?: string[]
  relatedMoves?: string[]
}

interface CodexEntry extends CodexData {
  key: string
}

const props = defineProps<{
  db: Record<string, CodexData>
  placeholder: string
}>()

const router = useRouter()

const list = computed<CodexEntry[]>(() =>
  Object.entries(props.db).map(([key, info]) => ({ key, ...info })),
)

const query = ref('')
const selectedKey = ref<string | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  let l = list.value
  if (q) l = l.filter((i) => i.nameZh.includes(q) || i.key.includes(q))
  return l
})

const selected = computed(() =>
  selectedKey.value ? list.value.find((i) => i.key === selectedKey.value) ?? null : null,
)

/** 相关特性：解析为 { key, nameZh }，便于点击跳转 */
const relatedAbilities = computed(() => {
  if (!selected.value?.relatedAbilities) return []
  return selected.value.relatedAbilities
    .map((k) => ({ key: k, nameZh: ABILITY_DB[k]?.nameZh ?? k }))
})

/** 相关招式：解析为 { key, nameZh }，便于点击跳转 */
const relatedMoves = computed(() => {
  if (!selected.value?.relatedMoves) return []
  return selected.value.relatedMoves
    .map((k) => ({ key: k, nameZh: MOVE_DB[k]?.nameZh ?? k }))
})

/** 跳转到特性查询（携带 key 深链，复用「特性查」界面，不新建详情页） */
function goAbility(key: string) {
  router.push({ path: '/tools/ability-search', query: { key } })
}
/** 跳转到招式详情（携带 key 深链） */
function goMove(key: string) {
  router.push({ path: '/tools/move-search', query: { key } })
}
</script>

<template>
  <div class="codex-search">
    <template v-if="!selected">
      <div class="cs-filter">
        <SearchBox
          v-model="query"
          :placeholder="placeholder"
        />
      </div>

      <div class="cs-count">
        共 {{ filtered.length }} 项
      </div>

      <div class="cs-list">
        <button
          v-for="i in filtered"
          :key="i.key"
          class="cs-item"
          @click="selectedKey = i.key"
        >
          <span
            v-if="i.color"
            class="cs-dot"
            :style="{ backgroundColor: i.color }"
          />
          <span class="cs-name">{{ i.nameZh }}</span>
          <span class="cs-arrow">›</span>
        </button>
        <p
          v-if="filtered.length === 0"
          class="no-data"
        >
          没有匹配项
        </p>
      </div>
    </template>

    <template v-else>
      <div class="cs-detail-head">
        <span class="cs-detail-title">
          <span
            v-if="selected.color"
            class="cs-dot cs-dot--lg"
            :style="{ backgroundColor: selected.color }"
          />
          {{ selected.nameZh }}
        </span>
      </div>

      <div class="cs-detail-card">
        <p class="cs-detail-desc">{{ selected.descZh }}</p>

        <div
          v-if="relatedAbilities.length"
          class="cs-related"
        >
          <h4 class="cs-related-title">相关特性</h4>
          <div class="cs-tags">
            <button
              v-for="a in relatedAbilities"
              :key="a.key"
              class="cs-tag cs-tag--link"
              type="button"
              @click="goAbility(a.key)"
            >
              {{ a.nameZh }}
              <span class="cs-tag-arrow">›</span>
            </button>
          </div>
        </div>

        <div
          v-if="relatedMoves.length"
          class="cs-related"
        >
          <h4 class="cs-related-title">相关招式</h4>
          <div class="cs-tags">
            <button
              v-for="m in relatedMoves"
              :key="m.key"
              class="cs-tag cs-tag--link"
              type="button"
              @click="goMove(m.key)"
            >
              {{ m.nameZh }}
              <span class="cs-tag-arrow">›</span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.codex-search {
  padding: 8px 12px 16px;
}
.cs-filter {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--poke-cream);
  padding-top: 4px;
}
.cs-count {
  font-size: 12px;
  color: var(--poke-ink-3);
  padding: 10px 4px 6px;
}
.cs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cs-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  border: none;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 14px 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.12s;
}
.cs-item:active {
  transform: scale(0.98);
}
.cs-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}
.cs-dot--lg {
  width: 16px;
  height: 16px;
}
.cs-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--poke-ink);
}
.cs-arrow {
  color: var(--poke-ink-3);
  font-size: 18px;
}

.cs-detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 2px 12px;
}
.cs-detail-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  color: var(--poke-ink);
}
.cs-detail-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.cs-detail-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--poke-ink);
}
.cs-related {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--poke-line);
}
.cs-related-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--poke-ink-2);
  margin-bottom: 10px;
}
.cs-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cs-tag {
  font-size: 12px;
  color: var(--poke-red);
  background: var(--poke-red-soft);
  padding: 5px 12px;
  border-radius: 999px;
}
.cs-tag--link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s;
}
.cs-tag--link:active {
  transform: scale(0.95);
}
.cs-tag-arrow {
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
}
</style>
