import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Pokedex',
    component: () => import('@/views/pokedex/Pokedex.vue'),
    meta: { title: '宝可梦图鉴', tab: 'pokedex' },
  },
  {
    path: '/pokemon/:id',
    name: 'PokemonDetail',
    component: () => import('@/views/pokedex/PokemonDetail.vue'),
    meta: { title: '宝可梦详情', tab: 'pokedex' },
  },
  {
    path: '/ability/:name',
    name: 'AbilityDetail',
    component: () => import('@/views/pokedex/AbilityDetail.vue'),
    meta: { title: '特性详情', tab: 'pokedex' },
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/tools/Tools.vue'),
    meta: { title: '小工具', tab: 'tools' },
  },
  {
    path: '/tools/:toolId',
    name: 'ToolDetail',
    component: () => import('@/views/tools/ToolDetail.vue'),
    meta: { title: '工具详情', tab: 'tools' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/Settings.vue'),
    meta: { title: '设置', tab: 'settings' },
  },
  {
    path: '/help-author',
    name: 'HelpAuthor',
    component: () => import('@/views/settings/HelpAuthor.vue'),
    meta: { title: '帮助作者', tab: 'settings' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 滚动策略：
  // - 前进导航（push，如图鉴点进详情）→ 回到页面顶部
  // - 返回导航（popstate，如详情点返回）→ 恢复离开前的滚动位置
  // 图鉴(Pokedex)本身有 keep-alive 的滚动缓存，与这里互补、互不冲突。
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

export default router
