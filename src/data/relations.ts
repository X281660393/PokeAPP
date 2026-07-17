// 由宝可梦数据派生出的「反向索引」，用于招式查询 / 特性查询 / 队伍组建。
// 该文件为派生数据，不手写，构建时由基础数据生成对应关系。

import type { MoveInfo, AbilityInfo } from '@/types'
import { MOVE_DB, POKEMON_MOVES } from '@/data/moves/pokemon-moves'
import { ABILITY_DB } from '@/data/abilities/pokemon-abilities'
import { ALL_POKEMON, spriteFor } from '@/data/pokemon/pokemon'

/** 招式学习方式 */
export type MoveMethod = 'level' | 'egg' | 'machine'

/** 可学习某招式的宝可梦（已附展示信息） */
export interface MoveLearner {
  id: number
  nameZh: string
  types: string[]
  spriteUrl: string
  method: MoveMethod
  /** 升级学会等级（仅 method==='level' 时有值） */
  level: number | null
}

/** 拥有某特性的宝可梦（已附展示信息） */
export interface AbilityOwner {
  id: number
  nameZh: string
  types: string[]
  spriteUrl: string
  isHidden: boolean
}

/** 学习方式中文标签 */
export const MOVE_METHOD_LABEL: Record<MoveMethod, string> = {
  level: '升级',
  egg: '遗传',
  machine: '学习器',
}

const byId = new Map(ALL_POKEMON.map((p) => [p.id, p]))

/** 招式英文名 → 可学习该招式的宝可梦列表（按图鉴编号升序） */
export const MOVE_LEARNERS: Record<string, MoveLearner[]> = (() => {
  const map: Record<string, MoveLearner[]> = {}
  for (const [idStr, moves] of Object.entries(POKEMON_MOVES)) {
    const id = Number(idStr)
    const base = byId.get(id)
    if (!base) continue
    const add = (name: string, method: MoveMethod, level: number | null) => {
      // 仅收录共享招式表中存在的招式，过滤掉已删除/旧版招式
      if (!MOVE_DB[name]) return
      ;(map[name] ??= []).push({
        id,
        nameZh: base.nameZh,
        types: base.types,
        spriteUrl: spriteFor(id),
        method,
        level,
      })
    }
    for (const m of moves.level) add(m.name, 'level', m.level)
    for (const m of moves.egg) add(m, 'egg', null)
    for (const m of moves.machine) add(m, 'machine', null)
  }
  return map
})()

/** 特性英文名 → 拥有该特性的宝可梦列表（按图鉴编号升序） */
export const ABILITY_OWNERS: Record<string, AbilityOwner[]> = (() => {
  const map: Record<string, AbilityOwner[]> = {}
  for (const p of ALL_POKEMON) {
    // 该宝可梦的隐藏特性英文名集合（按 "中文(en)" 取 en 部分）
    const hiddenKeys = new Set(
      (p.hiddenAbilities || []).map((h) => {
        const m = h.match(/\(([a-z0-9-]+)\)/i)
        return m ? m[1] : h.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      }),
    )
    p.abilities.forEach((ab) => {
      const m = ab.match(/\(([a-z0-9-]+)\)/i)
      const key = m ? m[1] : ab.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      if (!key || !ABILITY_DB[key]) return
      const isHidden = hiddenKeys.has(key)
      ;(map[key] ??= []).push({
        id: p.id,
        nameZh: p.nameZh,
        types: p.types,
        spriteUrl: spriteFor(p.id),
        isHidden,
      })
    })
  }
  return map
})()

/** 招式列表（带 key，便于搜索/筛选） */
export interface MoveEntry {
  key: string
  info: MoveInfo
}
export const MOVE_LIST: MoveEntry[] = Object.entries(MOVE_DB).map(([key, info]) => ({
  key,
  info,
}))

/** 特性列表（带 key） */
export interface AbilityEntry {
  key: string
  info: AbilityInfo
}
export const ABILITY_LIST: AbilityEntry[] = Object.entries(ABILITY_DB).map(([key, info]) => ({
  key,
  info,
}))

/** 查询可学习某招式的宝可梦 */
export function getMoveLearners(nameEn: string): MoveLearner[] {
  return MOVE_LEARNERS[nameEn] || []
}

/** 查询拥有某特性的宝可梦 */
export function getAbilityOwners(nameEn: string): AbilityOwner[] {
  return ABILITY_OWNERS[nameEn] || []
}
