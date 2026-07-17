import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { PokemonListItem, PokemonDetail } from '@/types'
import { getPokemonListByGens, getPokemonById, POKEMON_DETAILS, spriteFor } from '@/data/pokemon/pokemon'
import { getTypeColor, getTypeName, ALL_TYPES, GENERATIONS, GAME_VERSIONS, VERSION_GROUPS, VERSION_ROWS } from '@/constants/pokemon'

/** 最大可选属性数量 */
export const MAX_TYPE_SELECT = 2

/** 筛选状态持久化 */
const FILTER_STORAGE_KEY = 'poke_filter_state'

interface FilterState {
  selectedGenerations: number[]
  searchQuery: string
  selectedTypes: string[]
  selectedVersion: string
  hideFilteredOut: boolean
}

function loadFilterState(): Partial<FilterState> {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Partial<FilterState>
  } catch { /* ignore */ }
  return {}
}

const savedFilter = loadFilterState()

export const usePokedexStore = defineStore('pokedex', () => {
  /** 当前选中的世代（多选，默认全部世代） */
  const selectedGenerations = ref<number[]>(
    savedFilter.selectedGenerations?.length
      ? savedFilter.selectedGenerations
      : GENERATIONS.map(g => g.gen)
  )
  const pokemonList = ref<PokemonListItem[]>(getPokemonListByGens(selectedGenerations.value))
  const searchQuery = ref(savedFilter.searchQuery ?? '')
  const selectedTypes = ref<string[]>(savedFilter.selectedTypes ?? [])       // 多选，最多 2 个
  const selectedVersion = ref<string>(savedFilter.selectedVersion ?? '')       // 当前选中的游戏版本（用于按版本过滤宝可梦），空=全部
  const hideFilteredOut = ref(savedFilter.hideFilteredOut ?? false)            // 是否隐藏非当前版本范围的宝可梦（false=仅灰色蒙版）
  const loading = ref(false)

  /** 切换某个世代的选中状态（多选）；全部取消则回退为全选 */
  function toggleGeneration(gen: number) {
    const idx = selectedGenerations.value.indexOf(gen)
    if (idx >= 0) {
      selectedGenerations.value.splice(idx, 1)
    } else {
      selectedGenerations.value.push(gen)
    }
    // 空选 => 视为全选
    if (selectedGenerations.value.length === 0) {
      selectedGenerations.value = GENERATIONS.map(g => g.gen)
    }
    pokemonList.value = getPokemonListByGens(selectedGenerations.value)
    selectedTypes.value = []
    searchQuery.value = ''
    selectedVersion.value = ''
  }

  /** 是否全选（用于下拉框显示"全部世代"） */
  const isAllGenerations = computed(() =>
    selectedGenerations.value.length === GENERATIONS.length
  )

  /** 是否一个世代都没选 */
  const isNoGeneration = computed(() =>
    selectedGenerations.value.length === 0
  )

  /** 真正清空所有世代选择（不回退为全选） */
  function clearGenerations() {
    selectedGenerations.value = []
    pokemonList.value = getPokemonListByGens([])
    selectedTypes.value = []
    searchQuery.value = ''
    selectedVersion.value = ''
  }

  /** 真正全选所有世代 */
  function selectAllGenerations() {
    selectedGenerations.value = GENERATIONS.map(g => g.gen)
    pokemonList.value = getPokemonListByGens(selectedGenerations.value)
    selectedTypes.value = []
    searchQuery.value = ''
    selectedVersion.value = ''
  }

  /** 重置首页筛选：世代全选 + 清空搜索/属性（版本过滤属于设置页全局，不动） */
  function resetFilters() {
    selectedGenerations.value = GENERATIONS.map(g => g.gen)
    pokemonList.value = getPokemonListByGens(selectedGenerations.value)
    selectedTypes.value = []
    searchQuery.value = ''
  }

  const filteredList = computed(() => {
    let list = pokemonList.value

    if (searchQuery.value) {
      const raw = searchQuery.value.trim()
      // 仅输入 "#" → 显示全部
      if (raw === '#') {
        // 不做过滤，保持 list 为全部
      } else {
      // 编号搜索：纯数字或 #数字
      // 精确值匹配：1 / 01 / 001 / #1 都能搜到 #1
      // 前缀匹配：00 → 001~009, 1 → 1xx(#100+#151)
      const idMatch = raw.match(/^#?(\d+)$/)
      if (idMatch) {
        const inputDigits = idMatch[1]           // 保留前导零
        const targetId = parseInt(inputDigits, 10)
        list = list.filter(p => {
          const paddedId = String(p.id).padStart(3, '0')
          // 1) 精确数值匹配（1/01/001/#1 都等效于 id=1）
          if (p.id === targetId) return true
          // 2) 补零前缀匹配（保留前导零："00"→匹配001~009, "0"→匹配0xx）
          return paddedId.startsWith(inputDigits)
        })
      } else {
        // 名字搜索
        const q = raw.toLowerCase()
        list = list.filter(p =>
          p.nameZh.includes(q) ||
          p.name.includes(q)
        )
      }
      }
    }

    // 多属性筛选：所有选中属性都必须满足（AND）
    if (selectedTypes.value.length > 0) {
      list = list.filter(p =>
        selectedTypes.value.every(t => p.types.includes(t))
      )
    }

    // 游戏版本筛选：
    // 1) 隐藏模式 → 直接过滤掉不在版本范围内的
    // 2) 非隐藏模式 → 返回完整列表，由 UI 覆盖灰色蒙版（不改原色）
    // 宝可梦冠军（__all__ 哨兵）包含全部宝可梦，跳过过滤
    if (selectedVersionKeys.value.length > 0 && hideFilteredOut.value) {
      const keys = selectedVersionKeys.value
      if (!keys.includes(ALL_VERSIONS_SENTINEL)) {
        list = list.filter(p =>
          keys.some(k => p.gameVersions?.includes(k))
        )
      }
    }
    return list
  })

  /** 判断某宝可梦是否被版本/属性等条件过滤掉（用于卡片变灰） */
  function isFilteredOut(item: PokemonListItem): boolean {
    // 版本过滤：不在选中版本范围内 → 变灰（不隐藏）
    // 宝可梦冠军（__all__ 哨兵）包含全部宝可梦，不会被过滤
    if (selectedVersionKeys.value.length > 0 &&
        !selectedVersionKeys.value.includes(ALL_VERSIONS_SENTINEL)) {
      if (!selectedVersionKeys.value.some(k => item.gameVersions?.includes(k))) return true
    }
    return false
  }

  /** 哨兵：宝可梦冠军包含全部宝可梦，选中它等于显示全部（跳过版本过滤） */
  const ALL_VERSIONS_SENTINEL = '__all__'

  /** 当前选中的版本行对应的 key 列表（空数组 = 全部版本） */
  const selectedVersionKeys = computed<string[]>(() => {
    if (!selectedVersion.value) return []
    // 宝可梦冠军：跨世代对战游戏，可使用全部宝可梦
    if (selectedVersion.value === 'champions') return [ALL_VERSIONS_SENTINEL]
    const row = VERSION_ROWS.find(r => r.abbr === selectedVersion.value)
    return row ? row.keys : [selectedVersion.value] // 兼容旧数据：直接 key 也支持
  })

  /** 固定 18 种属性 */
  const allTypes = ALL_TYPES
  /** 世代列表 */
  const generations = GENERATIONS

  /** 当前是否还能继续选属性 */
  const canSelectMoreType = computed(() => selectedTypes.value.length < MAX_TYPE_SELECT)

  function setSearch(query: string) {
    searchQuery.value = query
  }

  /** 切换属性选中状态（最多选 MAX_TYPE_SELECT 个） */
  function toggleTypeFilter(type: string | null) {
    if (type === null) {
      // 点"全部"清空
      selectedTypes.value = []
      return
    }
    const idx = selectedTypes.value.indexOf(type)
    if (idx >= 0) {
      // 已选中 → 取消
      selectedTypes.value.splice(idx, 1)
    } else if (canSelectMoreType.value) {
      // 未选中且未满 → 添加
      selectedTypes.value.push(type)
    }
    // 已满 → 忽略
  }

  /** 判断某属性是否被选中 */
  function isTypeSelected(type: string): boolean {
    return selectedTypes.value.includes(type)
  }

  /** 设置/切换当前筛选的游戏版本（'' 表示全部版本，否则传行 abbr 如 "RGB"） */
  function setVersionFilter(version: string) {
    selectedVersion.value = selectedVersion.value === version ? '' : version
    // 切换版本时清空搜索/属性，但保留世代选择（全局叠加）
    // 注意：保留 hideFilteredOut（隐藏非当前版本内容）开关状态，切换版本不应重置它
    searchQuery.value = ''
    selectedTypes.value = []
  }

  /** 切换隐藏/蒙版模式 */
  function toggleHideFilteredOut(val: boolean) {
    hideFilteredOut.value = val
  }

  /** 检查某宝可梦 id 是否在当前版本筛选范围内（详情页用） */
  function isPokemonInVersion(id: number): boolean {
    if (selectedVersionKeys.value.length === 0) return true
    // 宝可梦冠军（__all__ 哨兵）包含全部宝可梦
    if (selectedVersionKeys.value.includes(ALL_VERSIONS_SENTINEL)) return true
    const p = getPokemonById(id)
    if (!p) return false
    return selectedVersionKeys.value.some(k => p.gameVersions?.includes(k))
  }

  /**
   * 通用详情获取：
   * 数据来自 pokemon-db.ts（PokeAPI 全量真实数据）+ POKEMON_EXTRA 扩展覆盖。
   * 缺失字段用默认值填充，保证任意 id 都能渲染出名字/编号/属性。
   */
  function getPokemonDetail(id: number): PokemonDetail {
    const base = getPokemonById(id) || {
      id, name: `pokemon-${id}`, nameZh: `#${String(id).padStart(3, '0')}`,
      types: ['normal'], spriteUrl: spriteFor(id),
    } as PokemonDetail
    const extra = POKEMON_DETAILS[id]
    return {
      id: base.id,
      name: base.name,
      nameZh: base.nameZh,
      types: base.types,
      spriteUrl: base.spriteUrl,
      height: extra?.height ?? 0,
      weight: extra?.weight ?? 0,
      stats: extra?.stats ?? [],
      abilities: extra?.abilities ?? [],
      hiddenAbilities: extra?.hiddenAbilities ?? [],
      gen: extra?.gen,
      region: extra?.region,
      description: extra?.description ?? '暂无该宝可梦的详细介绍。',
      genera: extra?.genera ?? '宝可梦',
    }
  }

  /** 判断该 id 是否已有完整数据（用于页面区分显示"暂无数据"） */
  function hasFullDetail(id: number): boolean {
    return !!getPokemonById(id)
  }

  /** 持久化筛选状态到 localStorage（防抖写入） */
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  function persistFilterState() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const state: FilterState = {
        selectedGenerations: selectedGenerations.value,
        searchQuery: searchQuery.value,
        selectedTypes: selectedTypes.value,
        selectedVersion: selectedVersion.value,
        hideFilteredOut: hideFilteredOut.value,
      }
      try {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state))
      } catch { /* ignore */ }
    }, 200)
  }
  watch(
    [selectedGenerations, searchQuery, selectedTypes, selectedVersion, hideFilteredOut],
    persistFilterState,
    { deep: true }
  )

  return {
    selectedGenerations,
    isAllGenerations,
    isNoGeneration,
    pokemonList,
    searchQuery,
    selectedTypes,
    selectedVersion,
    hideFilteredOut,
    loading,
    filteredList,
    allTypes,
    generations,
    gameVersions: GAME_VERSIONS,
    versionGroups: VERSION_GROUPS,
    versionRows: VERSION_ROWS,
    canSelectMoreType,
    toggleGeneration,
    selectAllGenerations,
    clearGenerations,
    resetFilters,
    setSearch,
    toggleTypeFilter,
    isTypeSelected,
    setVersionFilter,
    toggleHideFilteredOut,
    isPokemonInVersion,
    isFilteredOut,
    getPokemonDetail,
    hasFullDetail,
    getTypeColor,
    getTypeName,
  }
})
