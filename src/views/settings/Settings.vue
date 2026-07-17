<script setup lang="ts">
defineOptions({ name: "Settings" });

import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { useSettingsStore } from "@/stores/settings";
import { usePokedexStore } from "@/stores/pokedex";
import { ArrowIcon } from "@/components";
import { APP_CONFIG } from "@/config";

const router = useRouter();
const settings = useSettingsStore();
const pokedex = usePokedexStore();

/** 显示图片开关 —— 双向绑定 computed，确保 van-switch 正常工作 */
const showImagesSwitch = computed({
  get: () => settings.state.showImages,
  set: (val: boolean) => {
    settings.state.showImages = val;
  },
});

const appVersion = APP_CONFIG.version;

/** ===== 检测更新 ===== */
const checking = ref(false);

/** 语义化版本比较：a>b 返回 1，a<b 返回 -1，相等返回 0（逐段数字/字符串比较） */
function compareVersion(a: string, b: string): number {
  const pa = (a || "").split(".");
  const pb = (b || "").split(".");
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = parsePart(pa[i]);
    const nb = parsePart(pb[i]);
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
function parsePart(p: string | undefined): number | string {
  if (p === undefined || p === "") return 0;
  const n = Number(p);
  return Number.isNaN(n) ? p : n;
}

/** 打开外部链接（下载/更新页） */
function openExternal(url: string) {
  try {
    window.open(url, "_blank");
  } catch {
    showToast(url);
  }
}

/** 点击「检测更新」：优先调用接口，未配置则提示本地版本与配置位置 */
async function checkUpdate() {
  const cfg = APP_CONFIG.update;
  if (!cfg.checkUrl) {
    showDialog({
      title: "检测更新",
      message: `当前 App v${appVersion}，数据 v${APP_CONFIG.dataVersion}。\n\n检测更新接口尚未配置：请在 src/config/index.ts 的 update.checkUrl 填写后端检测接口地址。`,
    });
    return;
  }
  checking.value = true;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(cfg.checkUrl, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const remoteApp = data?.appVersion;
    const remoteData = data?.dataVersion;
    const notes: string[] = [];
    if (remoteApp && compareVersion(remoteApp, appVersion) > 0) {
      notes.push(`App 新版本：v${remoteApp}`);
    }
    if (remoteData && compareVersion(remoteData, APP_CONFIG.dataVersion) > 0) {
      notes.push(`数据新版本：v${remoteData}`);
    }
    if (notes.length) {
      const dl = data?.downloadUrl || cfg.downloadUrl;
      await showDialog({
        title: "发现更新",
        message: notes.join("\n") + (dl ? `\n\n更新地址：${dl}` : ""),
        confirmButtonText: dl ? "前往更新" : "我知道了",
      });
      if (dl) openExternal(dl);
    } else {
      showToast("已是最新版本 🎉");
    }
  } catch (e) {
    showDialog({
      title: "检测失败",
      message: `无法连接更新接口。\n${(e as Error)?.message || e}\n\n请检查网络或 src/config/index.ts 的 update.checkUrl。`,
    });
  } finally {
    checking.value = false;
  }
}

/** 是否显示「帮助作者」入口（由全局配置控制） */
const sponsorEnabled = APP_CONFIG.sponsor.enabled;

/** 进入「帮助作者」页面 */
function goHelpAuthor() {
  router.push("/help-author");
}

/** 版本筛选面板开关 */
const versionPanelOpen = ref(false);

/** 当前选中的版本显示名 */
const currentVersionLabel = computed(() => {
  if (!pokedex.selectedVersion) return "显示全部版本";
  const row = pokedex.versionRows.find(
    (r) => r.abbr === pokedex.selectedVersion,
  );
  return row ? `${row.label}（${row.abbr}）` : "显示全部版本";
});

/** 选择版本（'' = 全部） */
function selectVersion(key: string) {
  pokedex.setVersionFilter(key);
  versionPanelOpen.value = false;
}

const CONTACT_EMAIL = APP_CONFIG.email;

/** 点击邮箱：仅复制到剪贴板，不做任何跳转 */
async function copyEmail() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
    } else {
      // 兜底：用临时 textarea + execCommand（file:// 等非安全上下文）
      const ta = document.createElement("textarea");
      ta.value = CONTACT_EMAIL;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showToast("邮箱已复制");
  } catch {
    showToast(CONTACT_EMAIL);
  }
}
</script>

<template>
  <div class="settings-page page-gradient">
    <!-- 头部 -->
    <header class="settings-header">
      <div class="header-ball">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 外圈白底描边 -->
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="#fff"
            stroke="#fff"
            stroke-width="4"
          />
          <!-- 中间横线 -->
          <path
            d="M4 50 H96"
            stroke="#ff4459"
            stroke-width="4"
          />
          <!-- 上半红色 -->
          <path
            d="M50 4 A46 46 0 0 1 96 50 H4 A46 46 0 0 1 50 4 Z"
            fill="#ff4459"
          />
          <!-- 中心按钮圈（白底红边） -->
          <circle
            cx="50"
            cy="50"
            r="14"
            fill="#fff"
            stroke="#ff4459"
            stroke-width="3.5"
          />
          <!-- 中心点 -->
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="#ff4459"
          />
        </svg>
      </div>
      <h1 class="settings-title">设置</h1>
      <p class="settings-subtitle">个性化你的图鉴体验</p>
    </header>

    <!-- 显示设置 -->
    <section class="settings-section">
      <h3 class="section-title">显示</h3>
      <div class="card-group">
        <div
          class="setting-row"
          :class="{ on: showImagesSwitch }"
        >
          <div class="row-left">
            <span class="row-icon row-icon--image">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="3"
                />
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="1.5"
                />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </span>
            <div class="row-text">
              <span class="row-title">显示宝可梦图片</span>
              <span class="row-desc">关闭后仅显示占位图标，更省流量</span>
            </div>
          </div>
          <van-switch
            v-model="showImagesSwitch"
            size="22px"
            active-color="#ff4459"
          />
        </div>
      </div>
    </section>

    <!-- 图鉴版本选择 -->
    <section class="settings-section">
      <h3 class="section-title">图鉴版本</h3>
      <div class="card-group version-card">
        <!-- 是否隐藏非当前版本内容的开关 -->
        <div
          class="setting-row"
          :class="{ on: pokedex.hideFilteredOut }"
        >
          <div class="row-left">
            <span class="row-icon row-icon--hide">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                />
                <line
                  x1="3"
                  y1="3"
                  x2="21"
                  y2="21"
                />
              </svg>
            </span>
            <div class="row-text">
              <span class="row-title">隐藏非当前版本内容</span>
              <span class="row-desc">开启后仅显示该版本的宝可梦</span>
            </div>
          </div>
          <van-switch
            :model-value="pokedex.hideFilteredOut"
            size="22px"
            active-color="#ff4459"
            @update:model-value="pokedex.toggleHideFilteredOut($event)"
          />
        </div>

        <button
          class="version-row"
          type="button"
          @click="versionPanelOpen = !versionPanelOpen"
        >
          <div class="row-left">
            <span class="row-icon row-icon--version">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="16"
                  rx="3"
                />
                <path d="M3 9h18" />
                <path d="M7 14h6M7 17h10" />
              </svg>
            </span>
            <div class="row-text">
              <span class="row-title">游戏版本过滤</span>
              <span class="row-desc">{{ currentVersionLabel }}</span>
            </div>
          </div>
          <ArrowIcon
            dir="right"
            :size="16"
            color="#c8cdd2"
            class="version-caret"
            :class="{ open: versionPanelOpen }"
          />
        </button>

        <transition name="version-fade">
          <div
            v-if="versionPanelOpen"
            class="version-panel"
          >
            <!-- 全部 -->
            <button
              class="version-row-item"
              :class="{ on: !pokedex.selectedVersion }"
              type="button"
              @click="selectVersion('')"
            >
              全部版本
            </button>

            <!-- 版本行列表 -->
            <button
              v-for="row in pokedex.versionRows"
              :key="row.abbr"
              class="version-row-item"
              :class="{ on: pokedex.selectedVersion === row.abbr }"
              type="button"
              @click="selectVersion(row.abbr)"
            >
              {{ row.label }}（{{ row.abbr }}）
            </button>
          </div>
        </transition>
      </div>
    </section>

    <!-- 更新 -->
    <section
      v-if="APP_CONFIG.update.enabled"
      class="settings-section"
    >
      <h3 class="section-title">更新</h3>
      <div class="card-group">
        <div class="info-row">
          <span>数据版本</span><b>{{ APP_CONFIG.dataVersion }}</b>
        </div>
        <button
          class="action-row"
          type="button"
          :disabled="checking"
          @click="checkUpdate"
        >
          <div class="row-left">
            <span class="row-icon row-icon--update">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
            </span>
            <div class="row-text">
              <span class="row-title">检测更新</span>
              <span class="row-desc">{{ checking ? '正在检测…' : '检查 App 与数据是否有更新' }}</span>
            </div>
          </div>
          <ArrowIcon
            dir="right"
            :size="16"
            color="#c8cdd2"
            class="row-arrow"
          />
        </button>
      </div>
    </section>

    <!-- 关于 -->
    <section class="settings-section">
      <h3 class="section-title">关于</h3>
      <div class="card-group">
        <div class="info-row">
          <span>应用名称</span><b>{{ APP_CONFIG.name }}</b>
        </div>
        <div class="info-row">
          <span>版本</span><b>{{ appVersion }}</b>
        </div>
        <div class="info-row">
          <span>作者</span><b>{{ APP_CONFIG.author }}</b>
        </div>
        <div class="info-row">
          <span>数据来源</span><b>{{ APP_CONFIG.dataSource }}</b>
        </div>

        <button
          v-if="sponsorEnabled"
          class="action-row"
          @click="goHelpAuthor"
        >
          <div class="row-text">
            <span class="row-desc">帮助作者</span>
          </div>
          <ArrowIcon
            dir="right"
            :size="16"
            color="#c8cdd2"
            class="row-arrow"
          />
        </button>
      </div>
    </section>

    <!-- 底部 -->
    <footer class="settings-footer">
      <p>{{ APP_CONFIG.name }} v{{ appVersion }}</p>
      <span
        class="footer-email"
        @click="copyEmail"
        >{{ CONTACT_EMAIL }}</span
      >
    </footer>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: calc(100vh - 56px - env(safe-area-inset-bottom, 0px) - 8px);
  padding: 0 0 16px;
  background: var(--poke-cream);
  position: relative;
  overscroll-behavior: contain;
  box-sizing: border-box;
}
.settings-page > * {
  position: relative;
  z-index: 1;
}

/* ===== 头部 ===== */
.settings-header {
  text-align: center;
  padding: 30px 0 22px;
}

.header-ball {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  filter: drop-shadow(0 4px 10px rgba(224, 49, 74, 0.3));
}

.settings-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.settings-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 4px;
}

/* ===== section ===== */
.settings-section {
  margin: 18px 14px 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--poke-ink-3);
  padding: 0 4px 8px;
  letter-spacing: 0.5px;
}

/* 卡片容器 */
.card-group {
  background: var(--poke-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* 通用行 */
.setting-row,
.action-row,
.info-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--poke-line);
}

.setting-row:last-child,
.action-row:last-child,
.info-row:last-child {
  border-bottom: none;
}

.setting-row.on {
  background: linear-gradient(
    90deg,
    rgba(255, 68, 89, 0.05),
    rgba(255, 68, 89, 0)
  );
}

.row-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.row-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  margin-right: 12px;
}

.row-icon svg {
  width: 20px;
  height: 20px;
}

.row-icon--image {
  background: #fdeceb;
  color: #ff4459;
}
.row-icon--heart {
  background: #ffe3e7;
  color: #ff4459;
}

.row-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.row-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--poke-ink);
}

.row-desc {
  font-size: 12px;
  color: var(--poke-ink-3);
  margin-top: 2px;
}

.row-arrow {
  margin-left: auto;
  flex-shrink: 0;
}

/* 按钮行 */
.action-row {
  width: 100%;
  border: none;
  background: var(--poke-surface);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.action-row:active {
  background: #f7f8fa;
}

/* 关于纯信息行 */
.info-row {
  justify-content: space-between;
}
.info-row span {
  font-size: 14px;
  color: var(--poke-ink-3);
}
.info-row b {
  font-size: 14px;
  font-weight: 500;
  color: var(--poke-ink);
}

/* ===== 图鉴版本选择 ===== */
.row-icon--version {
  background: #e6fcf5;
  color: #12b886;
}
.row-icon--hide {
  background: #fdeceb;
  color: #ff4459;
}
.row-icon--update {
  background: #e7f1ff;
  color: #2f80ed;
}
.action-row:disabled {
  opacity: 0.6;
  cursor: default;
}

.version-row {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.version-row:active {
  background: #f7f8fa;
}

.version-caret {
  flex-shrink: 0;
  margin-left: auto;
  transition: transform 0.25s ease;
}
.version-caret.open {
  transform: rotate(90deg);
}

.version-panel {
  padding: 6px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 块级版本标签（"全部"按钮）- 已弃用，保留兼容 */

/* 版本选择列表（整行可点击） */
.version-panel {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.version-row-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border: none;
  background: var(--poke-surface);
  color: var(--poke-ink);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid var(--poke-line);
}
.version-row-item:last-child {
  border-bottom: none;
}
.version-row-item:active {
  background: #f7f8fa;
}
.version-row-item.on {
  color: var(--poke-red);
  font-weight: 700;
}

/* 版本面板展开/收起动画 */
.version-fade-enter-active,
.version-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.version-fade-enter-from,
.version-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 底部 */
.settings-footer {
  text-align: center;
  padding: 28px 0 0;
  color: var(--poke-ink-3);
  font-size: 12px;
}
.footer-email {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--poke-red);
  text-decoration: none;
  opacity: 0.85;
  cursor: pointer;
  transition: opacity 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.footer-email:active,
.footer-email:hover {
  opacity: 1;
  text-decoration: underline;
}
</style>
