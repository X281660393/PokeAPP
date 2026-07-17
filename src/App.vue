<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => {
  const tab = route.meta.tab as string
  if (tab === 'pokedex') return 0
  if (tab === 'tools') return 1
  if (tab === 'settings') return 2
  return 0
})

/** 底部栏高亮项（用于自定义样式） */
const currentPath = computed(() => route.path)

function goTo(path: string) {
  if (currentPath.value !== path) router.push(path)
}

// 需要缓存的主页面组件名（必须与 defineOptions name 匹配）
const cachedViews = ['Pokedex', 'Tools', 'Settings']

function getRouteKey(currentRoute: ReturnType<typeof useRoute>): string {
  const tab = currentRoute.meta.tab as string | undefined
  return tab || currentRoute.fullPath
}
</script>

<template>
  <div class="app-shell">
    <div class="page-container">
      <router-view v-slot="{ Component, route: currentRoute }">
        <KeepAlive :include="cachedViews" :max="5">
          <component :is="Component" :key="getRouteKey(currentRoute)" />
        </KeepAlive>
      </router-view>
    </div>

    <!-- 底部固定导航栏 -->
    <nav class="bottom-tabbar">
      <button
        class="tab-item"
        :class="{ active: activeTab === 0 }"
        @click="goTo('/')"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9.5 12 3l9 6.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M9.5 20v-6h5v6" />
        </svg>
        <span class="tab-label">图鉴</span>
      </button>
      <button
        class="tab-item"
        :class="{ active: activeTab === 1 }"
        @click="goTo('/tools')"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <circle cx="17.5" cy="17.5" r="3.5" />
        </svg>
        <span class="tab-label">小工具</span>
      </button>
      <button
        class="tab-item"
        :class="{ active: activeTab === 2 }"
        @click="goTo('/settings')"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span class="tab-label">设置</span>
      </button>
    </nav>
  </div>
</template>

<style>
.app-shell {
  width: 100%;
  min-height: 100vh;
  position: relative;
  /* 用 clip 而非 hidden：clip 只裁剪横向溢出，不会把 overflow-y
     隐式升级为 auto；hidden 会触发该升级，导致整个容器变成无高度的
     滚动陷阱，从而吞掉纵向滚动手势（移动端/WebView 滚不动的根因） */
  overflow-x: clip;
}

/* 页面内容区：留出底部导航栏的空间 */
.page-container {
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 8px);
  min-height: 100vh;
  /* 不创建独立滚动容器，纵向滚动交给根文档（body），
     这样移动端/WebView 才能正常上下滑动；横向溢出由 clip 裁剪 */
  overflow-x: clip;
}

/* ====== 底部固定导航栏 ====== */
.bottom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  min-height: 56px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 -2px 10px rgba(43, 45, 66, 0.1);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--poke-ink-3);
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.active {
  color: var(--poke-red);
}

.tab-icon {
  width: 26px;
  height: 26px;
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.3px;
}
</style>
