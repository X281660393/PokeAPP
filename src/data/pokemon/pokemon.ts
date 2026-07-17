import type { PokemonListItem, PokemonDetail } from '@/types'
import { GENERATIONS, GAME_VERSIONS, STAT_NAME_ZH } from '@/constants/pokemon'
import { POKEMON_DB, type PokemonFull } from './pokemon-db'

/**
 * 版本 -> 所属世代 的反查表。
 * 用于给每个宝可梦标注「出现在哪些版本」（按版本所属世代归属：
 * 正统主系列版本包含其所属世代的全部宝可梦）。
 * 后续如需精确到编号区间，可在此扩展为 version -> 编号数组。
 */

/**
 * 给列表项附加 gameVersions 字段。
 * 规则：正统主系列版本包含「截至其所属世代的全部宝可梦」，
 * 即某宝可梦所属世代 ≤ 版本世代时，视为该版本图鉴中的宝可梦。
 * 例：1-151 属于第1世代 → 出现在所有版本（红~紫）；
 *     810-905 属于第8世代 → 仅出现在第8世代之后的版本（剑/盾/朱/紫）。
 */
function withVersions(item: PokemonFull): PokemonListItem {
  const gen = GENERATIONS.find((g) => item.id >= g.start && item.id <= g.end)
  const versions = gen
    ? GAME_VERSIONS.filter((v) => v.gen >= gen.gen).map((v) => v.key)
    : []
  return { ...item, spriteUrl: spriteFor(item.id), gameVersions: versions }
}

/** 第一世代 151 只（与 DB 完全一致，保留导出兼容旧引用） */
export const GEN1_POKEMON: PokemonListItem[] = POKEMON_DB.filter((p) => p.id <= 151).map(withVersions)

/**
 * 后续扩展入口：
 * 若有不在官方编号体系内的原创宝可梦 / 想覆盖某只数据，
 * 直接往这里追加即可，会自动合并覆盖到 POKEMON_DB 同 id。
 * 示例：
 *   { id: 10001, name: 'my-pokemon', nameZh: '我的宝可梦', types: ['grass'],
 *     height: 7, weight: 69, stats: [], abilities: [],
 *     genera: '自定义', description: '说明' }
 * 注：spriteUrl 不需要填写，运行时通过 spriteFor(id) 自动生成。
 */
export const POKEMON_EXTRA: PokemonFull[] = []

/** 合并主库 + 扩展（扩展可覆盖同 id） */
const MERGED: PokemonFull[] = (() => {
  const map = new Map<number, PokemonFull>()
  for (const p of POKEMON_DB) map.set(p.id, p)
  for (const p of POKEMON_EXTRA) map.set(p.id, p)
  return [...map.values()].sort((a, b) => a.id - b.id)
})()

export const ALL_POKEMON: PokemonFull[] = MERGED
export const POKEMON_COUNT = MERGED.length

/**
 * 本地精灵图（随 app 打包，离线可用）。
 * 图片位于 public/sprites/{id}.png，构建后处于 dist/sprites，
 * 由 Capacitor 拷贝进 Android 资源目录；运行时以相对路径 './sprites/{id}.png'
 * 加载，在 file:// 协议下也能正常访问，无需联网。
 */
export function spriteFor(id: number): string {
  return `./sprites/${id}.png`
}

/** 按世代返回宝可梦列表（全部来自真实数据库） */
export function getPokemonListByGen(gen: number): PokemonListItem[] {
  const g = GENERATIONS.find((x) => x.gen === gen)
  if (!g) return ALL_POKEMON.map(withVersions)
  return ALL_POKEMON.filter((p) => p.id >= g.start && p.id <= g.end).map(withVersions)
}

/** 按多个世代返回合并后的宝可梦列表（按编号升序，去重） */
export function getPokemonListByGens(gens: number[]): PokemonListItem[] {
  if (gens.length === 0) return []
  const map = new Map<number, PokemonListItem>()
  for (const gen of gens) {
    for (const p of getPokemonListByGen(gen)) {
      if (!map.has(p.id)) map.set(p.id, p)
    }
  }
  return [...map.values()].sort((a, b) => a.id - b.id)
}

/** 全局编号 -> 列表项（用于详情页任意 id 查找，含扩展） */
export function getPokemonById(id: number): PokemonListItem | undefined {
  const base = MERGED.find((p) => p.id === id)
  return base ? withVersions(base) : undefined
}

/**
 * 完整详情库（供 store.getPokemonDetail 使用）。
 * 真实 DB 已是完整数据；这里保留 POKEMON_DETAILS 兼容旧代码（不应再被写入）。
 */
export const POKEMON_DETAILS: Record<number, PokemonDetail> = Object.fromEntries(
  MERGED.map((p) => [p.id, p as PokemonDetail]),
)

/** 兼容：个别老代码可能引用此函数 */
export function getStatNameZh(key: string): string {
  return STAT_NAME_ZH[key] || key
}
