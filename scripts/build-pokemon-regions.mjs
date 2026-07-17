/**
 * 地区补丁脚本
 * ---------------------------------------------------------------
 * 给现有 src/data/pokemon/pokemon-db.ts 的每只宝可梦补上 region
 * 字段（所属地区中文名，如 关都），按编号区间本地推导，无需联网。
 *
 * 与 build-pokemon-db.mjs 的区别：本脚本不抓取任何网络数据，
 * 只基于现有 POKEMON_DB 重新序列化（保留其它字段原样），追加 region。
 *
 * 运行（无需联网）：
 *   node scripts/build-pokemon-regions.mjs
 */
import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/pokemon/pokemon-db.ts')

// 各世代编号区间（与 src/constants/pokemon.ts 的 REGIONS 一致）
const GEN_RANGES = [
  [1, 151], [152, 251], [252, 386], [387, 493],
  [494, 649], [650, 721], [722, 809], [810, 905], [906, 1025],
]
function genOf(id) {
  for (let i = 0; i < GEN_RANGES.length; i++) {
    const [s, e] = GEN_RANGES[i]
    if (id >= s && id <= e) return i + 1
  }
  return 0
}
// 各世代对应地区（编号区间 -> 地区中文名）
const REGION_RANGES = [
  [1, 151, '关都'], [152, 251, '城都'], [252, 386, '丰缘'], [387, 493, '神奥'],
  [494, 649, '合众'], [650, 721, '卡洛斯'], [722, 809, '阿罗拉'], [810, 905, '伽勒尔'], [906, 1025, '帕底亚'],
]
function regionOf(id) {
  for (const [s, e, zh] of REGION_RANGES) {
    if (id >= s && id <= e) return zh
  }
  return ''
}

async function main() {
  // 读取现有库（esbuild 转译后动态 import，剥离类型声明）
  const src = readFileSync(OUT, 'utf8')
  const out = await esbuild.transform(src, { loader: 'ts', format: 'esm' })
  const tmp = resolve(__dirname, `._region_tmp_${Date.now()}.mjs`)
  writeFileSync(tmp, out.code)
  const mod = await import('file://' + tmp)
  const DB = mod.POKEMON_DB
  if (!DB || !DB.length) throw new Error('未能读取 POKEMON_DB')
  // 清理临时模块
  setTimeout(() => {
    try {
      import('node:fs').then((m) => m.unlinkSync(tmp))
    } catch {}
  }, 500)

  // 基于现有数据重新序列化（追加 region，其余字段原样保留）
  const lines = [
    '// 此文件由 scripts/build-pokemon-db.mjs 自动生成，请勿手动编辑。',
    '// 数据来源：PokeAPI（https://pokeapi.co），图片为在线加载。',
    "import type { PokemonDetail } from '@/types'",
    '',
    'export interface PokemonFull extends PokemonDetail {',
    '  /** 特性英文名 + 中文名（如 "静电(static)"）保留英文便于后续扩展 */',
    '}',
    '',
    'export const POKEMON_DB: PokemonFull[] = [',
  ]

  for (const p of DB) {
    const statsLiteral = (p.stats || [])
      .map(
        (s) =>
          `    { key: ${JSON.stringify(s.key)}, nameZh: ${JSON.stringify(s.nameZh)}, value: ${s.value} }`,
      )
      .join(',\n')
    const abilitiesLiteral = (p.abilities || []).map((a) => JSON.stringify(a)).join(', ')
    const hiddenLiteral = (p.hiddenAbilities || []).map((a) => JSON.stringify(a)).join(', ')
    const gen = p.gen ?? genOf(p.id)
    const region = p.region ?? regionOf(p.id)
    lines.push(`  {`)
    lines.push(`    id: ${p.id},`)
    lines.push(`    name: ${JSON.stringify(p.name)},`)
    lines.push(`    nameZh: ${JSON.stringify(p.nameZh)},`)
    lines.push(`    types: [${(p.types || []).map((t) => JSON.stringify(t)).join(', ')}],`)
    lines.push(`    spriteUrl: ${JSON.stringify(p.spriteUrl)},`)
    lines.push(`    height: ${p.height},`)
    lines.push(`    weight: ${p.weight},`)
    lines.push(`    stats: [\n${statsLiteral}\n    ],`)
    lines.push(`    abilities: [${abilitiesLiteral}],`)
    lines.push(`    hiddenAbilities: [${hiddenLiteral}],`)
    lines.push(`    gen: ${gen},`)
    lines.push(`    region: ${JSON.stringify(region)},`)
    lines.push(`    genera: ${JSON.stringify(p.genera)},`)
    lines.push(`    description: ${JSON.stringify(p.description)},`)
    lines.push(`  },`)
  }
  lines.push(']')
  lines.push('')
  lines.push('/** 编号 -> 宝可梦（O(1) 查找） */')
  lines.push('export const POKEMON_BY_ID: Record<number, PokemonFull> = Object.fromEntries(')
  lines.push('  POKEMON_DB.map((p) => [p.id, p]),')
  lines.push(')')
  lines.push('')
  lines.push('/** 总数量 */')
  lines.push(`export const POKEMON_TOTAL = ${DB.length}`)
  lines.push('')

  const content = lines.join('\n')
  copyFileSync(OUT, OUT + '.bak')
  writeFileSync(OUT, content, 'utf8')
  const withRegion = DB.filter((p) => (p.region ?? regionOf(p.id))).length
  console.log(`✅ 已写入 ${OUT}`)
  console.log(`   含地区信息的宝可梦：${withRegion} / ${DB.length}`)
  console.log('   原文件已备份为 pokemon-db.ts.bak')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
