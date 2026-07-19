<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ABILITY_DB } from "@/data/abilities/pokemon-abilities";
import { MOVE_DB } from "@/data/moves/pokemon-moves";
import { SearchBox } from "@/components";

/** 通用条目形状：天气 / 场地 / 异常状态 共享（不含 key，key 由 db 的索引提供） */
interface CodexData {
  nameZh: string;
  descZh: string;
  effectzh?: string;
  color?: string;
  relatedAbilities?: string[];
  relatedMoves?: string[];
}

interface CodexEntry extends CodexData {
  key: string;
}

const props = defineProps<{
  db: Record<string, CodexData>;
  placeholder: string;
}>();

const router = useRouter();
const route = useRoute();

const list = computed<CodexEntry[]>(() =>
  Object.entries(props.db).map(([key, info]) => ({ key, ...info })),
);

const query = ref("");
const selectedKey = ref<string | null>(null);
/** 进入详情前记录列表滚动位置，返回时还原（不跳回顶部） */
const savedScrollY = ref(0);
/** 取当前真实滚动位置（兼容 WebView / 不同滚动根） */
function getScrollTop(): number {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}
/** 返回列表后还原滚动位置：等列表重新渲染、高度稳定后再滚动 */
function restoreScroll() {
  const top = savedScrollY.value;
  if (!top) return;
  const doScroll = () => {
    const root = document.scrollingElement || document.documentElement;
    if (root.scrollHeight >= top) {
      window.scrollTo({ top });
      return true;
    }
    return false;
  };
  requestAnimationFrame(() => {
    if (!doScroll()) {
      requestAnimationFrame(doScroll);
      setTimeout(doScroll, 150);
    }
  });
}

/** 点击列表项：写入 URL（?sel=），让历史记录选中态，返回时还原详情 */
function selectItem(key: string) {
  savedScrollY.value = getScrollTop();
  selectedKey.value = key;
  router.push({ query: { sel: key } });
}

/** 详情页返回：清掉 URL 的 ?sel=，回到列表态（并还原滚动） */
function backToList() {
  if (route.query.sel) router.push({ query: {} });
  else selectedKey.value = null;
}

// 从 URL 的 ?sel= 还原选中（含返回/前进、深链进入）
watch(
  () => route.query.sel,
  (k) => {
    selectedKey.value = typeof k === "string" && props.db[k] ? k : null;
  },
  { immediate: true },
);

// 从详情返回列表时还原滚动位置（selectedKey 由有值变为 null）
watch(selectedKey, (val, old) => {
  if (old && !val) {
    restoreScroll();
  }
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  let l = list.value;
  if (q) l = l.filter((i) => i.nameZh.includes(q) || i.key.includes(q));
  return l;
});

const selected = computed(() =>
  selectedKey.value
    ? list.value.find((i) => i.key === selectedKey.value) ?? null
    : null,
);

/** 相关特性：解析为 { key, nameZh }，便于点击跳转 */
const relatedAbilities = computed(() => {
  if (!selected.value?.relatedAbilities) return [];
  return selected.value.relatedAbilities.map((k) => ({
    key: k,
    nameZh: ABILITY_DB[k]?.nameZh ?? k,
  }));
});

/** 相关招式：解析为 { key, nameZh }，便于点击跳转 */
const relatedMoves = computed(() => {
  if (!selected.value?.relatedMoves) return [];
  return selected.value.relatedMoves.map((k) => ({
    key: k,
    nameZh: MOVE_DB[k]?.nameZh ?? k,
  }));
});

/** 跳转到特性查询（携带 key 深链，复用「特性查」界面，不新建详情页） */
function goAbility(key: string) {
  router.push({ path: "/tools/ability-search", query: { key } });
}
/** 跳转到招式详情（携带 key 深链） */
function goMove(key: string) {
  router.push({ path: "/tools/move-search", query: { key } });
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

      <div class="cs-count">共 {{ filtered.length }} 项</div>

      <div class="cs-list">
        <button
          v-for="i in filtered"
          :key="i.key"
          class="cs-item"
          @click="selectItem(i.key)"
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
      <!-- 头部：返回 + 色点 + 名称 -->
      <div class="cs-hero">
        <button
          class="cs-back"
          type="button"
          aria-label="返回"
          @click="backToList"
        >
          ‹
        </button>
        <span class="cs-hero-title">
          <span
            v-if="selected.color"
            class="cs-dot cs-dot--lg"
            :style="{ backgroundColor: selected.color }"
          />
          {{ selected.nameZh }}
        </span>
      </div>

      <div class="cs-card">
        <h4 class="block-title">介绍</h4>
        <p class="cs-desc">{{ selected.descZh }}</p>

        <template v-if="selected.effectzh">
          <h4 class="block-title">效果</h4>
          <p
            class="cs-effect"
            style="white-space: pre-line"
          >
            {{ selected.effectzh }}
          </p>
        </template>

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

/* ===== 详情页（hero + 卡片） ===== */
.cs-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 2px 16px;
}
.cs-back {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--poke-surface);
  box-shadow: var(--shadow-sm);
  border-radius: 50%;
  font-size: 26px;
  line-height: 1;
  color: var(--poke-ink-2);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s;
}
.cs-back:active {
  transform: scale(0.94);
}
.cs-hero-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 800;
  color: var(--poke-ink);
  line-height: 1.2;
}
.cs-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 18px 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 14px;
}
.cs-desc {
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--poke-ink);
  text-align: justify;
}
.cs-effect {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--poke-red-soft);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--poke-ink);
  text-align: justify;
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
