// 按「地区（世代）」对宝可梦进行分类。
// ----------------------------------------------------------------------------
// 纯派生数据：基于 constants/pokemon 的 REGIONS 定义与主图鉴库自动分组，
// 不手写任何宝可梦条目，新增/更新宝可梦后这里会自动归类，无需维护。
//
// 提供：
//   - POKEMON_BY_REGION  地区英文名 -> 该地区宝可梦列表（按编号升序）
//   - REGION_LIST        按世代排序的地区元信息（含数量/御三家/主题色/示例图）
//   - MEGA_BY_REGION     地区英文名 -> 该地区基础宝可梦的超进化列表
//   - 辅助函数 getPokemonByRegion / getRegionOfPokemon / getRegionMeta
// ----------------------------------------------------------------------------
import type { PokemonListItem } from '@/types'
import { REGIONS, type Region } from '@/constants/pokemon'
import { ALL_POKEMON, spriteFor } from '@/data/pokemon/pokemon'
import { MEGA_EVOLUTIONS } from '@/data/pokemon/pokemon-mega'

/** 各地区主题色（用于 UI 标识 / 分组展示） */
export const REGION_COLORS: Record<string, string> = {
  kanto: '#EE8130', // 关都 — 红
  johto: '#F7D02C', // 城都 — 金
  hoenn: '#6390F0', // 丰缘 — 海蓝
  sinnoh: '#9DA0C8', // 神奥 — 雪青
  unova: '#2ECC71', // 合众 — 草绿
  kalos: '#E056A0', // 卡洛斯 — 时尚粉
  alola: '#1ABC9C', // 阿罗拉 — 热带青
  galar: '#6B6B7B', // 伽勒尔 — 工业灰
  paldea: '#E74C3C', // 帕底亚 — 绯红
}

/** 各地区「御三家」（初始宝可梦）的图鉴编号 */
export const REGION_STARTERS: Record<string, number[]> = {
  kanto: [1, 4, 7],
  johto: [152, 155, 158],
  hoenn: [252, 255, 258],
  sinnoh: [387, 390, 393],
  unova: [495, 498, 501],
  kalos: [650, 653, 656],
  alola: [722, 725, 728],
  galar: [810, 813, 816],
  paldea: [906, 909, 912],
}

/** 地区英文名 -> 该地区宝可梦列表（按图鉴编号升序） */
export const POKEMON_BY_REGION: Record<string, PokemonListItem[]> = (() => {
  const map: Record<string, PokemonListItem[]> = {}
  for (const r of REGIONS) {
    map[r.region] = ALL_POKEMON.filter((p) => p.id >= r.start && p.id <= r.end).map((p) => ({
      ...p,
      spriteUrl: spriteFor(p.id),
    }))
  }
  return map
})()

/** 地区元信息（在 Region 基础上补充展示用字段） */
export interface RegionMeta extends Region {
  /** 地区主题色 */
  color: string
  /** 该地区宝可梦数量 */
  count: number
  /** 御三家图鉴编号 */
  starters: number[]
  /** 地区第一只宝可梦的精灵图（用于展示） */
  sampleSprite: string
}

/** 按世代顺序排列的地区列表（含数量/御三家/主题色/示例图） */
export const REGION_LIST: RegionMeta[] = REGIONS.map((r) => ({
  ...r,
  color: REGION_COLORS[r.region] || '#777',
  count: POKEMON_BY_REGION[r.region]?.length ?? 0,
  starters: REGION_STARTERS[r.region] || [],
  sampleSprite: spriteFor(r.start),
}))

/** 获取某地区的元信息（按英文名） */
export function getRegionMeta(region: string): RegionMeta | undefined {
  return REGION_LIST.find((r) => r.region === region)
}

/** 按地区英文名获取该地区宝可梦列表 */
export function getPokemonByRegion(region: string): PokemonListItem[] {
  return POKEMON_BY_REGION[region] || []
}

/** 根据图鉴编号判断所属地区（返回英文名），不属于任何地区返回 null */
export function getRegionOfPokemon(id: number): string | null {
  const r = REGIONS.find((g) => id >= g.start && id <= g.end)
  return r ? r.region : null
}

/** 根据图鉴编号返回地区中文名，未知返回空串 */
export function getRegionZhOfPokemon(id: number): string {
  const r = REGIONS.find((g) => id >= g.start && id <= g.end)
  return r ? r.regionZh : ''
}

/** 超进化按地区归类（基于其基础宝可梦所属地区） */
export const MEGA_BY_REGION: Record<string, { baseId: number; nameZh: string }[]> = (() => {
  const map: Record<string, { baseId: number; nameZh: string }[]> = {}
  for (const [idStr, forms] of Object.entries(MEGA_EVOLUTIONS)) {
    const baseId = Number(idStr)
    const region = getRegionOfPokemon(baseId)
    if (!region) continue
    for (const f of forms) {
      ;(map[region] ??= []).push({ baseId, nameZh: f.nameZh })
    }
  }
  return map
})()
