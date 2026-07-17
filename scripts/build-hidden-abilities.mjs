/**
 * 隐藏特性补丁脚本
 * ---------------------------------------------------------------
 * 给现有 src/data/pokemon/pokemon-db.ts 的每只宝可梦补上 hiddenAbilities
 * 字段（仅含隐藏特性的 "中文(en)" 字符串），数据来自 PokeAPI 的 is_hidden。
 *
 * 与 build-pokemon-db.mjs 的区别：本脚本不重新抓取中文名/描述/种族值，
 * 只按编号向 PokeAPI 的 /pokemon/{id} 取 is_hidden，再基于现有 POKEMON_DB
 * 重新序列化（保留其它字段原样），因此不会漂移已有描述/数据。
 *
 * 运行（需联网）：
 *   node scripts/build-hidden-abilities.mjs
 */
import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/pokemon/pokemon-db.ts')
const API = 'https://pokeapi.co/api/v2'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.status === 429) {
        await sleep(800 * (i + 1))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`)
      return await res.json()
    } catch (e) {
      if (i === tries - 1) throw e
      await sleep(500)
    }
  }
}

/** 从 "避雷针(lightning-rod)" 取英文 key */
function enKey(raw) {
  const m = raw.match(/\(([a-z0-9-]+)\)/i)
  return m ? m[1] : raw.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

async function main() {
  // 读取现有库（esbuild 转译后动态 import，剥离类型声明）
  const src = readFileSync(OUT, 'utf8')
  const out = await esbuild.transform(src, { loader: 'ts', format: 'esm' })
  const tmp = resolve(__dirname, `._hidden_tmp_${Date.now()}.mjs`)
  writeFileSync(tmp, out.code)
  const mod = await import('file://' + tmp)
  const DB = mod.POKEMON_DB
  if (!DB || !DB.length) throw new Error('未能读取 POKEMON_DB')
  // 清理临时模块（Windows 下可能短暂占用，忽略失败）
  setTimeout(() => {
    try {
      unlinkSync(tmp)
    } catch {}
  }, 500)

  console.log(`开始抓取 ${DB.length} 只宝可梦的隐藏特性标记...`)
  // id -> 隐藏特性英文 key 集合
  const hiddenMap = new Map()
  const BATCH = 25
  for (let i = 0; i < DB.length; i += BATCH) {
    const end = Math.min(i + BATCH, DB.length)
    const jobs = []
    for (let j = i; j < end; j++) {
      const p = DB[j]
      jobs.push(
        getJSON(`${API}/pokemon/${p.id}`)
          .then((j) => {
            const set = new Set(
              j.abilities.filter((a) => a.is_hidden).map((a) => a.ability.name),
            )
            return [p.id, set]
          })
          .catch((e) => {
            console.error(`  ✗ #${p.id} 失败: ${e.message}`)
            return [p.id, new Set()]
          }),
      )
    }
    const settled = await Promise.all(jobs)
    for (const [id, set] of settled) hiddenMap.set(id, set)
    console.log(`  进度 ${end}/${DB.length}`)
    await sleep(200)
  }

  // 基于现有数据重新序列化（追加 hiddenAbilities）
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
    const hiddenSet = hiddenMap.get(p.id) || new Set()
    const hiddenAbilities = (p.abilities || []).filter((a) => hiddenSet.has(enKey(a)))
    const hiddenLiteral = hiddenAbilities.map((a) => JSON.stringify(a)).join(', ')
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
    lines.push(`    gen: ${genOf(p.id)},`)
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
  const hiddenCount = DB.filter((p) => (hiddenMap.get(p.id) || new Set()).size > 0).length
  console.log(`✅ 已写入 ${OUT}`)
  console.log(`   含隐藏特性的宝可梦：${hiddenCount} / ${DB.length}`)
  console.log('   原文件已备份为 pokemon-db.ts.bak')
}

function unlinkSafe(p) {
  try {
    require('node:fs').unlinkSync(p)
  } catch {}
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
