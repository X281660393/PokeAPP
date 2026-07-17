<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePokedexStore } from "@/stores/pokedex";
import { useSettingsStore } from "@/stores/settings";
import { TypeBadge, StatBar, ArrowIcon, DetailNav, InfoCard } from "@/components";
import { MAX_STAT_VALUE, STAT_ORDER, STAT_NAME_ZH, statColor } from "@/constants/pokemon";
import EvoChain from "./EvoChain.vue";
import { MEGA_EVOLUTIONS } from "@/data/pokemon/pokemon-mega";
import { getRegionZhOfPokemon } from "@/data/pokemon/pokemon-regions";
import type { MoveInfo, PokemonMoves, AbilityInfo, ParsedAbility, EvoNode, MegaForm } from "@/types";

const route = useRoute();
const router = useRouter();
const store = usePokedexStore();
const settings = useSettingsStore();

const pokemonId = computed(() => Number(route.params.id));
// 通用详情：任意 id 都能取到（缺数据用默认值填充）
const detail = computed(() => store.getPokemonDetail(pokemonId.value));

/** 当前宝可梦是否在版本筛选范围内 */
const inVersion = computed(() => store.isPokemonInVersion(pokemonId.value));

/** 所属地区（优先用详情自带 region，缺失时按编号区间回退推导） */
const regionZh = computed(
  () => detail.value.region || getRegionZhOfPokemon(pokemonId.value) || "",
);

const statTotal = computed(() =>
  detail.value.stats.reduce((s, st) => s + st.value, 0),
);

// 当前宝可梦的超进化形态
const megaForms = computed<MegaForm[]>(() => MEGA_EVOLUTIONS[pokemonId.value] || []);

function baseStatVal(key: string): number {
  const list = detail.value.stats || [];
  const s =
    list.find((x) => x.key === key) ||
    list.find((x) => x.nameZh === STAT_NAME_ZH[key]);
  return s ? s.value : 0;
}

// 超进化种族值对比（含与基础形态的差值 + 种族值总和差）
function megaStatRows(m: MegaForm) {
  return STAT_ORDER.map((key) => {
    const megaVal = m.stats[key] ?? 0;
    const baseVal = baseStatVal(key);
    return {
      key,
      nameZh: STAT_NAME_ZH[key],
      megaVal,
      diff: megaVal - baseVal,
    };
  });
}
function megaTotal(m: MegaForm): number {
  return STAT_ORDER.reduce((s, k) => s + (m.stats[k] ?? 0), 0);
}

// 超进化种族值进度条（与普通 StatBar 同款：按值着色 + 百分比宽度）
function megaBarPct(v: number): string {
  return `${(v / MAX_STAT_VALUE) * 100}%`;
}

// 介绍始终全展开

// 技能数据（按需动态加载，避免主包体积膨胀）
const moveDb = ref<Record<string, MoveInfo>>({});
const pokemonMoves = ref<Record<number, PokemonMoves>>({});
const abilityDb = ref<Record<string, AbilityInfo>>({});
const evoRootMap = ref<Record<number, number>>({});
const evoTrees = ref<Record<number, EvoNode>>({});

onMounted(async () => {
  const [movesMod, abilMod, evoMod] = await Promise.all([
    import("@/data/moves/pokemon-moves"),
    import("@/data/abilities/pokemon-abilities"),
    import("@/data/pokemon/pokemon-evo"),
  ]);
  moveDb.value = movesMod.MOVE_DB;
  pokemonMoves.value = movesMod.POKEMON_MOVES;
  abilityDb.value = abilMod.ABILITY_DB;
  evoRootMap.value = evoMod.EVO_ROOT;
  evoTrees.value = evoMod.EVO_TREES;
});

function getMoveInfo(nameEn: string): MoveInfo | undefined {
  return moveDb.value[nameEn];
}

const moves = computed<PokemonMoves>(
  () => pokemonMoves.value[pokemonId.value] || { level: [], egg: [], machine: [] },
);
const moveTab = ref<'level' | 'egg' | 'machine' | 'type'>('level');
/** 技能按伤害分类筛选：all / physical / special / status */
const moveCat = ref<'all' | 'physical' | 'special' | 'status'>('all');

function inCat(m: { category?: string } | MoveInfo): boolean {
  if (moveCat.value === 'all') return true;
  return (m as MoveInfo).category === moveCat.value;
}

/** 特性列表（含详情） */
/** 从 "中文(en)" 取英文 key */
function enKeyOf(raw: string): string {
  const m = raw.match(/\(([a-z0-9-]+)\)/i);
  return m ? m[1] : raw.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

/** 解析单个特性字符串为详情对象 */
function parseAbility(raw: string, isHidden: boolean): ParsedAbility {
  const m = raw.match(/^(.*?)\(([^)]+)\)$/);
  const nameEn = m ? m[2] : raw;
  const nameZh = m ? m[1] : raw;
  const info = abilityDb.value[nameEn];
  return {
    nameEn,
    nameZh: info?.nameZh || nameZh,
    isHidden,
    descZh: info?.descZh || "暂无描述。",
  };
}

/** 隐藏特性英文名集合（用于区分普通/隐藏） */
const hiddenKeySet = computed<Set<string>>(
  () => new Set((detail.value.hiddenAbilities || []).map(enKeyOf)),
);

/** 普通特性（不含隐藏） */
const normalAbilities = computed<ParsedAbility[]>(() =>
  detail.value.abilities
    .filter((raw) => !hiddenKeySet.value.has(enKeyOf(raw)))
    .map((raw) => parseAbility(raw, false)),
);

/** 隐藏特性 */
const hiddenAbilities = computed<ParsedAbility[]>(() =>
  (detail.value.hiddenAbilities || []).map((raw) => parseAbility(raw, true)),
);

function goAbility(nameEn: string) {
  router.push({ path: '/tools/ability-search', query: { key: nameEn } });
}

/** 点击技能行：跳转到小工具「招式查询」并定位该招式 */
function goMove(nameEn: string) {
  router.push({ path: '/tools/move-search', query: { key: nameEn } });
}

/** 点击进化链节点：在同一详情页切换到该宝可梦 */
function goPokemon(id: number) {
  router.push({ name: "PokemonDetail", params: { id } });
}

// id 变化时重置展开/标签/分类状态并回到顶部
watch(pokemonId, () => {
  moveTab.value = "level";
  moveCat.value = "all";
  collapsedTypes.value = new Set();
  window.scrollTo({ top: 0 });
});

// 升级技能（带等级 + 详情）
const levelMoves = computed(() =>
  moves.value.level
    .map((m) => ({ ...m, info: getMoveInfo(m.name) }))
    .filter((m) => m.info),
);
// 蛋生技能
const eggMoves = computed(() =>
  moves.value.egg
    .map((name) => ({ name, info: getMoveInfo(name) }))
    .filter((m): m is { name: string; info: MoveInfo } => !!m.info),
);
// 学习机技能
const machineMoves = computed(() =>
  moves.value.machine
    .map((name) => ({ name, info: getMoveInfo(name) }))
    .filter((m): m is { name: string; info: MoveInfo } => !!m.info),
);

// 应用分类筛选
const levelMovesF = computed(() => levelMoves.value.filter((m) => inCat(m.info!)));
const eggMovesF = computed(() => eggMoves.value.filter((m) => inCat(m.info)));
const machineMovesF = computed(() => machineMoves.value.filter((m) => inCat(m.info)));

// 按属性合并所有技能并分组排序（按当前分类筛选）
const movesByType = computed(() => {
  const set = new Set<string>();
  moves.value.level.forEach((m) => set.add(m.name));
  moves.value.egg.forEach((n) => set.add(n));
  moves.value.machine.forEach((n) => set.add(n));
  const groups = new Map<string, { name: string; info: MoveInfo }[]>();
  for (const name of set) {
    const info = getMoveInfo(name);
    if (!info) continue;
    if (!inCat(info)) continue;
    if (!groups.has(info.type)) groups.set(info.type, []);
    groups.get(info.type)!.push({ name, info });
  }
  return store.allTypes
    .filter((t) => groups.has(t))
    .map((t) => ({
      type: t,
      list: groups
        .get(t)!
        .sort((a, b) => a.info.nameZh.localeCompare(b.info.nameZh, "zh")),
    }));
});

// 进化链（动态加载）
const evoTree = computed<EvoNode | null>(() => {
  const rootId = evoRootMap.value[pokemonId.value];
  if (rootId == null) return null;
  return evoTrees.value[rootId] || null;
});

function goBack() {
  router.back();
}
// 在线图片加载失败兜底
const imgFailed = ref(false);
function onImgError() {
  imgFailed.value = true;
}

const categoryLabel: Record<string, string> = {
  physical: "物理",
  special: "特殊",
  status: "变化",
};

// 按属性分组的折叠状态（记录被收起的属性）
const collapsedTypes = ref<Set<string>>(new Set());
function toggleTypeGroup(type: string) {
  const next = new Set(collapsedTypes.value);
  if (next.has(type)) next.delete(type);
  else next.add(type);
  collapsedTypes.value = next;
}
</script>

<template>
  <div class="detail-page">
    <!-- 版本过滤提示 -->
    <div
      v-if="!inVersion && store.selectedVersion"
      class="version-blocked-bar"
    >
      <span>该宝可梦不在「{{ store.selectedVersion }}」版本图鉴中</span>
    </div>

    <!-- 顶部导航（始终显示编号 + 名字） -->
    <DetailNav
      :title="`#${String(detail.id).padStart(3, '0')} ${detail.nameZh}`"
      @back="goBack"
    />

    <!-- 宝可梦展示区 -->
    <div
      class="detail-hero"
      :style="{ background: store.getTypeColor(detail.types[0]) }"
    >
      <div class="hero-inner">
        <span class="hero-genera">{{ detail.genera }}</span>
        <img
          v-if="settings.state.showImages && !imgFailed"
          :src="detail.spriteUrl"
          :alt="detail.nameZh"
          class="hero-sprite"
          @error="onImgError"
        />
        <span
          v-else-if="settings.state.showImages && imgFailed"
          class="hero-fallback"
          >#{{ String(detail.id).padStart(3, "0") }}</span
        >
        <div class="hero-types">
          <TypeBadge
            v-for="type in detail.types"
            :key="type"
            :type="type"
            size="md"
          />
        </div>
        <span
          v-if="detail.gen"
          class="hero-gen"
        >第 {{ detail.gen }} 代</span>
        <span
          v-if="regionZh"
          class="hero-region"
        >{{ regionZh }}</span>
      </div>
    </div>

    <!-- 信息卡片 -->
    <div class="detail-body">
      <!-- 简介 + 身高体重（默认收起） -->
      <InfoCard title="简介">
        <div class="hw-line">
          <span>身高</span>
          <strong>{{
            detail.height > 0 ? (detail.height / 10).toFixed(1) + " m" : "暂无"
          }}</strong>
          <span class="hw-dot">·</span>
          <span>体重</span>
          <strong>{{
            detail.weight > 0 ? (detail.weight / 10).toFixed(1) + " kg" : "暂无"
          }}</strong>
        </div>
        <div class="desc-wrap">
          <p class="description">{{ detail.description }}</p>
        </div>
      </InfoCard>

      <!-- 特性（普通特性，独立可点击跳转） -->
      <InfoCard title="特性">
        <div class="ability-list">
          <button
            v-for="a in normalAbilities"
            :key="a.nameEn"
            class="ability-item"
            type="button"
            @click="goAbility(a.nameEn)"
          >
            <span class="ability-name">{{ a.nameZh }}</span>
            <span class="ability-en">{{ a.nameEn }}</span>
            <ArrowIcon dir="right" :size="14" color="#c8cdd2" class="ability-arrow" />
          </button>
          <p v-if="!normalAbilities.length" class="no-data">暂无数据</p>
        </div>
      </InfoCard>

      <!-- 隐藏特性（有才显示；与普通特性同款样式，不做额外配色） -->
      <InfoCard v-if="hiddenAbilities.length" title="隐藏特性">
        <div class="ability-list">
          <button
            v-for="a in hiddenAbilities"
            :key="a.nameEn"
            class="ability-item"
            type="button"
            @click="goAbility(a.nameEn)"
          >
            <span class="ability-name">{{ a.nameZh }}</span>
            <span class="ability-en">{{ a.nameEn }}</span>
            <ArrowIcon dir="right" :size="14" color="#c8cdd2" class="ability-arrow" />
          </button>
        </div>
      </InfoCard>

      <!-- 进化链（可点击切换） -->
      <InfoCard v-if="evoTree" title="进化链">
        <div class="evo-card">
          <EvoChain
            :node="evoTree"
            :current-id="pokemonId"
            @pick="goPokemon"
          />
        </div>
      </InfoCard>

      <!-- 种族值 -->
      <InfoCard title="种族值">
        <template v-if="detail.stats.length > 0">
          <div class="stat-total">
            总计：<strong>{{ statTotal }}</strong>
          </div>
          <StatBar
            v-for="stat in detail.stats"
            :key="stat.name"
            :stat="stat"
          />
        </template>
        <p
          v-else
          class="no-data"
        >
          暂无数据
        </p>
      </InfoCard>

      <!-- 超进化种族值（有超进化才显示） -->
      <InfoCard v-if="megaForms.length" title="超进化种族值">
        <div class="mega-stat-list">
          <div v-for="m in megaForms" :key="m.nameEn" class="mega-block">
            <div class="mega-block-head">
              <div class="mega-head-text">
                <span class="mega-name">{{ m.nameZh }}</span>
                <span class="mega-stone">{{ m.stoneZh }}</span>
              </div>
              <span class="mega-total"
                >总计 {{ megaTotal(m) }}
                <em
                  v-if="megaTotal(m) - statTotal !== 0"
                  :class="megaTotal(m) - statTotal > 0 ? 'up' : 'down'"
                  >{{ megaTotal(m) - statTotal > 0 ? "+" : ""
                  }}{{ megaTotal(m) - statTotal }}</em
                ></span
              >
            </div>
            <div class="mega-stats">
              <div
                v-for="s in megaStatRows(m)"
                :key="s.key"
                class="stat-row"
              >
                <span class="stat-name">{{ s.nameZh }}</span>
                <span class="stat-value">{{ s.megaVal }}</span>
                <div class="stat-bar-bg">
                  <div
                    class="stat-bar-fill"
                    :style="{ width: megaBarPct(s.megaVal), backgroundColor: statColor(s.megaVal) }"
                  ></div>
                </div>
                <span
                  v-if="s.diff !== 0"
                  class="ms-diff"
                  :class="s.diff > 0 ? 'up' : 'down'"
                  >{{ s.diff > 0 ? "+" : "" }}{{ s.diff }}</span
                >
                <span v-else class="ms-diff same">—</span>
              </div>
            </div>
          </div>
        </div>
      </InfoCard>

      <!-- 技能栏 -->
      <InfoCard title="技能" class="moves-card">
        <div class="move-tabs">
          <button
            class="move-tab"
            :class="{ on: moveTab === 'level' }"
            type="button"
            @click="moveTab = 'level'"
          >
            升级
          </button>
          <button
            class="move-tab"
            :class="{ on: moveTab === 'egg' }"
            type="button"
            @click="moveTab = 'egg'"
          >
            蛋生
          </button>
          <button
            class="move-tab"
            :class="{ on: moveTab === 'machine' }"
            type="button"
            @click="moveTab = 'machine'"
          >
            学习机
          </button>
          <button
            class="move-tab"
            :class="{ on: moveTab === 'type' }"
            type="button"
            @click="moveTab = 'type'"
          >
            按属性
          </button>
        </div>

        <!-- 伤害分类筛选 -->
        <div class="move-cats">
          <button
            class="move-cat"
            :class="{ on: moveCat === 'all' }"
            type="button"
            @click="moveCat = 'all'"
          >
            全部
          </button>
          <button
            class="move-cat"
            :class="{ on: moveCat === 'physical' }"
            type="button"
            @click="moveCat = 'physical'"
          >
            物理
          </button>
          <button
            class="move-cat"
            :class="{ on: moveCat === 'special' }"
            type="button"
            @click="moveCat = 'special'"
          >
            特殊
          </button>
          <button
            class="move-cat"
            :class="{ on: moveCat === 'status' }"
            type="button"
            @click="moveCat = 'status'"
          >
            变化
          </button>
        </div>

        <!-- 升级 -->
        <div v-if="moveTab === 'level'" class="move-list">
          <div
            v-for="m in levelMovesF"
            :key="m.name"
            class="move-row"
            @click="goMove(m.name)"
          >
            <span class="move-level">Lv{{ m.level }}</span>
            <span class="move-name">{{ m.info!.nameZh }}</span>
            <span class="move-right">
              <TypeBadge :type="m.info!.type" size="sm" />
              <span class="move-meta">
                <i :class="['cat', m.info!.category]">{{
                  categoryLabel[m.info!.category] || m.info!.category
                }}</i>
                <em>威力 {{ m.info!.power || "—" }}</em>
              </span>
            </span>
          </div>
          <p v-if="!levelMovesF.length" class="no-data">暂无数据</p>
        </div>

        <!-- 蛋生 -->
        <div v-else-if="moveTab === 'egg'" class="move-list">
          <div
            v-for="m in eggMovesF"
            :key="m.name"
            class="move-row"
            @click="goMove(m.name)"
          >
            <span class="move-name">{{ m.info.nameZh }}</span>
            <span class="move-right">
              <TypeBadge :type="m.info.type" size="sm" />
              <span class="move-meta">
                <i :class="['cat', m.info.category]">{{
                  categoryLabel[m.info.category] || m.info.category
                }}</i>
                <em>威力 {{ m.info.power || "—" }}</em>
              </span>
            </span>
          </div>
          <p v-if="!eggMovesF.length" class="no-data">暂无数据</p>
        </div>

        <!-- 学习机 -->
        <div v-else-if="moveTab === 'machine'" class="move-list">
          <div
            v-for="m in machineMovesF"
            :key="m.name"
            class="move-row"
            @click="goMove(m.name)"
          >
            <span class="move-name">{{ m.info.nameZh }}</span>
            <span class="move-right">
              <TypeBadge :type="m.info.type" size="sm" />
              <span class="move-meta">
                <i :class="['cat', m.info.category]">{{
                  categoryLabel[m.info.category] || m.info.category
                }}</i>
                <em>威力 {{ m.info.power || "—" }}</em>
              </span>
            </span>
          </div>
          <p v-if="!machineMovesF.length" class="no-data">暂无数据</p>
        </div>

        <!-- 按属性（与其他技能页一致排版） -->
        <div v-else class="move-by-type">
          <div
            v-for="group in movesByType"
            :key="group.type"
            class="type-group"
          >
            <button
              class="type-group-head"
              type="button"
              @click="toggleTypeGroup(group.type)"
            >
              <TypeBadge :type="group.type" size="sm" />
              <span class="type-group-count">{{ group.list.length }}</span>
              <ArrowIcon
                :dir="collapsedTypes.has(group.type) ? 'down' : 'up'"
                :size="14"
                color="#c8cdd2"
                class="type-group-arrow"
              />
            </button>
            <div v-show="!collapsedTypes.has(group.type)" class="move-list">
              <div
                v-for="m in group.list"
                :key="m.name"
                class="move-row"
                @click="goMove(m.name)"
              >
                <span class="move-name">{{ m.info.nameZh }}</span>
                <span class="move-right">
                  <span class="move-meta">
                    <i :class="['cat', m.info.category]">{{
                      categoryLabel[m.info.category] || m.info.category
                    }}</i>
                    <em>威力 {{ m.info.power || "—" }}</em>
                  </span>
                </span>
              </div>
            </div>
          </div>
          <p v-if="!movesByType.length" class="no-data">暂无数据</p>
        </div>
      </InfoCard>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: calc(100vh - 56px - env(safe-area-inset-bottom, 0px) - 8px);
  background: var(--poke-cream);
  padding-bottom: 16px;
  box-sizing: border-box;
}

.version-blocked-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: #fff4e0;
  color: #b57900;
  font-size: 13px;
  font-weight: 500;
}

.detail-hero {
  margin: 12px;
  padding: 32px 16px 24px;
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
.detail-hero::after {
  content: "";
  position: absolute;
  top: -40%;
  left: -20%;
  width: 80%;
  height: 80%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.25) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.hero-genera {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
}

.hero-sprite {
  width: 132px;
  height: 132px;
  object-fit: contain;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.28));
}

.hero-fallback {
  font-size: 34px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.hero-types {
  display: flex;
  gap: 8px;
}

/* 世代标签：淡色无强调 */
.hero-gen {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.22);
  padding: 3px 12px;
  border-radius: 999px;
}

/* 地区标签：与世代标签同款淡色 */
.hero-region {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.22);
  padding: 3px 12px;
  border-radius: 999px;
}

.detail-body {
  padding: 4px 12px;
}

/* 身高体重一行 */
.hw-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--poke-ink-3);
  margin-bottom: 10px;
}
.hw-line strong {
  color: var(--poke-ink);
  font-weight: 600;
}
.hw-dot {
  margin: 0 4px;
  color: var(--poke-line);
}

/* 简介区域 */
.desc-wrap {
  position: relative;
}
.description {
  font-size: 14px;
  color: var(--poke-ink);
  line-height: 1.7;
  margin: 0;
}
/* 特性列表 */
.ability-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ability-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: none;
  background: var(--poke-cream);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.ability-item:active {
  background: #eceef1;
}
.ability-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--poke-ink);
}
.ability-en {
  font-size: 12px;
  color: var(--poke-ink-3);
  font-style: italic;
}
.ability-arrow {
  margin-left: auto;
  flex-shrink: 0;
}

/* 种族值 */
.stat-total {
  font-size: 14px;
  color: var(--poke-ink-2);
  margin-bottom: 10px;
}
.stat-total strong {
  color: var(--poke-red);
}

/* 超进化种族值 */
.mega-stat-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mega-block {
  background: #fffaf0;
  border: 1px solid #f5c06a;
  border-radius: 12px;
  padding: 12px;
}
.mega-block-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.mega-head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.mega-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--poke-ink);
  line-height: 1.2;
}
.mega-stone {
  font-size: 11px;
  color: #d4880a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mega-total {
  font-size: 12px;
  color: var(--poke-ink-2);
  font-weight: 600;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.mega-total em {
  font-style: normal;
  font-weight: 700;
}
.mega-total em.up {
  color: #2f9e44;
}
.mega-total em.down {
  color: #e03131;
}
/* 超进化种族值行（与普通种族值 StatBar 同款样式） */
.mega-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stat-name {
  width: 40px;
  font-size: 13px;
  color: var(--poke-ink-2);
  font-weight: 500;
  flex-shrink: 0;
}
.stat-value {
  width: 32px;
  font-size: 13px;
  color: var(--poke-ink);
  font-weight: 600;
  text-align: right;
  flex-shrink: 0;
}
.stat-bar-bg {
  flex: 1;
  min-width: 0;
  height: 8px;
  background: #eef0f3;
  border-radius: 4px;
  overflow: hidden;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 4px;
}
.ms-diff {
  font-size: 12px;
  font-weight: 700;
  min-width: 34px;
  text-align: right;
  flex-shrink: 0;
}
.ms-diff.up {
  color: #2f9e44;
}
.ms-diff.down {
  color: #e03131;
}
.ms-diff.same {
  color: var(--poke-ink-3);
}

/* 技能栏 */
.move-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.move-tab {
  flex: 1;
  border: none;
  background: var(--poke-cream);
  border-radius: 8px;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink-3);
  cursor: pointer;
  transition: all 0.15s;
}
.move-tab.on {
  background: var(--poke-red);
  color: #fff;
}

.move-list {
  display: flex;
  flex-direction: column;
}
.move-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--poke-line);
  cursor: pointer;
}
.move-row:active {
  background: #eceef1;
}
.move-row:last-child {
  border-bottom: none;
}
.move-level {
  font-size: 12px;
  font-weight: 700;
  color: var(--poke-ink-3);
  min-width: 38px;
  flex-shrink: 0;
}
.move-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--poke-ink);
  flex-shrink: 0;
}
.move-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.move-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-style: normal;
}
.move-meta .cat {
  font-size: 11px;
  font-style: normal;
  padding: 2px 6px;
  border-radius: 4px;
  color: #fff;
}
.move-meta .cat.physical {
  background: #c0703a;
}
.move-meta .cat.special {
  background: #4a78c4;
}
.move-meta .cat.status {
  background: #8a8f99;
}
.move-meta em {
  font-size: 11px;
  font-style: normal;
  padding: 2px 6px;
  border-radius: 4px;
  color: #fff;
  background: #e0894a;
  white-space: nowrap;
  width: 52px;
  text-align: center;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* 按属性 */
.move-by-type {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.type-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 4px 0;
  margin-bottom: 8px;
  cursor: pointer;
}
.type-group-count {
  font-size: 12px;
  color: var(--poke-ink-3);
}
.type-group-arrow {
  margin-left: auto;
  flex-shrink: 0;
}

/* 伤害分类筛选 */
.move-cats {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.move-cat {
  flex: 1;
  border: 1px solid var(--poke-line);
  background: var(--poke-surface);
  border-radius: 8px;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--poke-ink-3);
  cursor: pointer;
  transition: all 0.15s;
}
.move-cat.on {
  border-color: var(--poke-red);
  color: var(--poke-red);
  background: #fff0f0;
}

/* 进化链卡片：横向滚动容器（手机端避免被裁切） */
.evo-card {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.22) transparent;
  padding-bottom: 4px;
}
.evo-card::-webkit-scrollbar {
  height: 5px;
}
.evo-card::-webkit-scrollbar-track {
  background: transparent;
}
.evo-card::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.22);
  border-radius: 6px;
}
</style>
