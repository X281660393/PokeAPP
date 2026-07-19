<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ITEM_DB } from "@/data/items/pokemon-items";
import { SearchBox } from "@/components";
import type { ItemInfo } from "@/types";

interface ItemListItem {
  key: string;
  info: ItemInfo;
}

const ITEM_LIST: ItemListItem[] = Object.entries(ITEM_DB).map(
  ([key, info]) => ({
    key,
    info,
  }),
);

/** 取道具图标相对路径（无则 undefined，调用处用 v-if 隐藏） */
function itemIcon(key: string | null): string | undefined {
  return key ? ITEM_DB[key]?.icon : undefined;
}
/** 取道具日文名（无则空串） */
function itemJa(key: string | null): string {
  return key ? ITEM_DB[key]?.nameJa ?? "" : "";
}
/** 取道具英文全名（无则空串） */
function itemEn(key: string | null): string {
  return key ? ITEM_DB[key]?.nameEn ?? "" : "";
}

const router = useRouter();
const route = useRoute();

/** 分类顺序（从 ITEM_DB 动态派生，按数据文件出现顺序去重） */
const CATEGORIES = [...new Set(ITEM_LIST.map((i) => i.info.category))];

const query = ref("");
const selectedCat = ref("");

const filtered = computed(() => {
  const raw = query.value.trim();
  const q = raw.toLowerCase();
  let list = ITEM_LIST;
  if (selectedCat.value)
    list = list.filter((i) => i.info.category === selectedCat.value);
  if (q)
    list = list.filter(
      (i) =>
        i.info.nameZh.includes(raw) ||
        i.key.toLowerCase().includes(q) ||
        (i.info.nameEn ?? "").toLowerCase().includes(q) ||
        (i.info.nameJa ?? "").includes(raw),
    );
  // 按数据文件（ITEM_DB）原样顺序输出，不做额外排序
  return list.slice();
});

const SHOWN = 9999;
const shownList = computed(() => filtered.value.slice(0, SHOWN));

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
function openItem(key: string) {
  savedScrollY.value = getScrollTop();
  selectedKey.value = key;
  // 写入 URL，使历史记录选中态；浏览器/系统返回能正确回到列表
  router.push({ query: { key } });
}
/** 详情页返回：清掉 URL 的 ?key=，回到列表态（并还原滚动） */
function backToList() {
  if (route.query.key) router.push({ query: {} });
  else selectedKey.value = null;
}
/** 当前选中道具的完整合并条目（含图标 / 日文名 / 描述 / 数值） */
const sel = computed(() =>
  selectedKey.value ? ITEM_DB[selectedKey.value] ?? null : null,
);

function resetFilters() {
  query.value = "";
  selectedCat.value = "";
}

// 从 URL 的 ?key= 还原选中（含返回/前进、深链进入）
watch(
  () => route.query.key,
  (k) => {
    selectedKey.value = typeof k === "string" && k in ITEM_DB ? k : null;
  },
  { immediate: true },
);

// 从详情返回列表时还原滚动位置（selectedKey 由有值变为 null）
watch(selectedKey, (val, old) => {
  if (old && !val) {
    restoreScroll();
  }
});
</script>

<template>
  <div class="item-search">
    <!-- 列表视图 -->
    <template v-if="!sel">
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
          @click="openItem(i.key)"
        >
          <img
            v-if="itemIcon(i.key)"
            :src="itemIcon(i.key)"
            class="is-item-thumb"
            alt=""
            loading="lazy"
          />
          <div class="is-item-body">
            <div class="is-item-main">
              <span class="is-item-name">{{ i.info.nameZh }}</span>
              <span class="is-cat-tag">{{ i.info.category }}</span>
            </div>
            <p class="is-item-desc">{{ i.info.descZh }}</p>
          </div>
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
      <div class="is-detail">
        <!-- 头部：返回 + 图标 + 名称 -->
        <div class="is-hero">
          <button
            class="is-back"
            type="button"
            aria-label="返回"
            @click="backToList"
          >
            ‹
          </button>
          <div
            class="is-hero-icon"
            v-if="itemIcon(selectedKey)"
          >
            <img
              :src="itemIcon(selectedKey)"
              alt=""
            />
          </div>
          <div class="is-hero-text">
            <h1 class="is-hero-name">{{ sel?.nameZh }}</h1>
            <div class="is-hero-sub">
              <span
                v-if="itemEn(selectedKey)"
                class="is-hero-en"
                >{{ itemEn(selectedKey) }}</span
              >
              <span
                v-if="itemJa(selectedKey)"
                class="is-hero-ja"
                >{{ itemJa(selectedKey) }}</span
              >
            </div>
          </div>
        </div>

        <!-- 内容卡片 -->
        <div class="is-card">
          <div class="is-badges">
            <h3 class="block-title">道具描述</h3>
            <span class="is-cat-tag is-cat-tag--lg">{{ sel?.category }}</span>
            <span class="is-key-tag">{{ selectedKey }}</span>
          </div>

          <p
            class="is-desc"
            style="white-space: pre-line"
          >
            {{ sel?.descZh }}
          </p>

          <!-- 效果：道具源数据 description 即效果，与 descZh 相同时不重复显示 -->
          <template v-if="sel?.effectzh && sel.effectzh !== sel.descZh">
            <h3 class="block-title">效果</h3>
            <p
              class="is-effect"
              style="white-space: pre-line"
            >
              {{ sel?.effectzh }}
            </p>
          </template>
        </div>
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
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  border: none;
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.12s;
}
.is-item:active {
  transform: scale(0.98);
}
.is-item-thumb {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 10px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.is-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
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

/* ===== 详情页（hero + 卡片） ===== */
.is-detail {
  padding-bottom: 16px;
}
.is-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 2px 16px;
}
.is-back {
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
.is-back:active {
  transform: scale(0.94);
}
.is-hero-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--poke-surface);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
}
.is-hero-icon img {
  width: 46px;
  height: 46px;
  object-fit: contain;
}
.is-hero-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.is-hero-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--poke-ink);
  line-height: 1.2;
}
.is-hero-sub {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.is-hero-en {
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink-2);
  letter-spacing: 0.3px;
}
.is-hero-ja {
  font-size: 12px;
  color: var(--poke-ink-3);
  letter-spacing: 0.5px;
}

.is-card {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  padding: 18px 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 14px;
}
.is-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.is-key-tag {
  font-size: 11px;
  color: var(--poke-ink-3);
  background: var(--poke-cream);
  padding: 4px 10px;
  border-radius: 8px;
}
.is-desc {
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--poke-ink);
  text-align: justify;
}
.is-effect {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--poke-red-soft);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--poke-ink);
  text-align: justify;
}
</style>
