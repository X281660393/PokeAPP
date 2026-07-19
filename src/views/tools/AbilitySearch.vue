<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ABILITY_LIST, getAbilityOwners } from "@/data/relations";
import type { AbilityInfo } from "@/types";
import { TypeBadge, SearchBox } from "@/components";

const router = useRouter();
const route = useRoute();

const query = ref("");
/** 图片加载失败时隐藏 */
const spriteErr = ref<Set<number>>(new Set());
function onSpriteErr(id: number) {
  spriteErr.value.add(id);
}
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
/** 返回列表后还原滚动位置：等列表重新渲染、高度稳定后再滚动，
 *  避免 nextTick 时图片未加载导致高度不足、scroll 被夹到 0 */
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

const filtered = computed(() => {
  const q = query.value.trim();
  let list = ABILITY_LIST;
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(
      (a) => a.info.nameZh.includes(q) || a.key.toLowerCase().includes(ql),
    );
  }
  // 按数据文件（ABILITY_DB）原样顺序输出，不做额外排序
  return list.slice();
});

const selectedAbility = computed(() =>
  selectedKey.value
    ? ABILITY_LIST.find((a) => a.key === selectedKey.value) ?? null
    : null,
);
// 详情数据直接取自合并后的 ABILITY_DB（含 intro / effectzh）
const abilityDesc = computed<AbilityInfo | null>(() =>
  selectedKey.value ? selectedAbility.value?.info ?? null : null,
);
const owners = computed(() =>
  selectedKey.value ? getAbilityOwners(selectedKey.value) : [],
);
const shownOwners = computed(() => owners.value.slice(0, 60));

function openAbility(key: string) {
  // 记录列表当前滚动位置，返回时还原
  savedScrollY.value = getScrollTop();
  selectedKey.value = key;
  // 写入 URL，使历史记录选中态；从「相关」跳走再返回时可还原详情
  router.push({ query: { key } });
}
/** 点击「拥有该特性的宝可梦」跳转详情页 */
function goPokemon(id: number) {
  router.push(`/pokemon/${id}`);
}

// 支持通过 ?key= 深链直接打开特性详情（如场地/状态页关联特性跳转）
// 同时：缺失 key 时清空选中，返回列表态也能正确还原
watch(
  () => route.query.key,
  (k) => {
    if (typeof k === "string" && ABILITY_LIST.some((a) => a.key === k)) {
      selectedKey.value = k;
    } else {
      selectedKey.value = null;
    }
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
  <div class="ability-search">
    <!-- 列表视图 -->
    <template v-if="!selectedAbility">
      <div class="ab-filter">
        <SearchBox
          v-model="query"
          placeholder="搜索特性名称"
        />
      </div>
      <div class="ab-count">共 {{ filtered.length }} 个特性</div>
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
        <h3 class="block-title">特性介绍</h3>
        <p
          class="ab-desc"
          v-if="
            abilityDesc?.descZh &&
            abilityDesc.descZh !== selectedAbility.info.effectzh
          "
        >
          {{ abilityDesc.descZh }}
        </p>
        <template v-if="abilityDesc?.effectzh">
          <h3 class="block-title">效果</h3>
          <p
            class="ab-desc"
            style="white-space: pre-line"
          >
            {{ abilityDesc.effectzh }}
          </p>
        </template>
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
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 6px 2px 12px;
}
.ab-detail-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--poke-ink);
}
.ab-detail-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--poke-ink-2);
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
