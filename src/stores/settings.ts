import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

const STORAGE_KEY = 'poke_settings'

interface AppSettings {
  /** 是否显示宝可梦图片（关闭则展示占位符，节省流量/空间） */
  showImages: boolean
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 兼容旧字段 downloadImages
      const showImages = parsed.showImages ?? parsed.downloadImages ?? false
      return { showImages }
    }
  } catch { /* ignore */ }
  return { showImages: false }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export const useSettingsStore = defineStore('settings', () => {
  const state = reactive<AppSettings>(loadSettings())

  // 持久化到 localStorage
  watch(state, (val) => saveSettings(val), { deep: true })

  return {
    state,
  }
})

