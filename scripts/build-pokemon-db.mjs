/**
 * 宝可梦完整数据库构建脚本
 * ---------------------------------------------------------------
 * 从 PokeAPI 拉取全世代真实数据（编号 / 英文名 / 中文名 / 属性 /
 * 身高体重 / 种族值 / 特性 / 分类 / 描述），生成 src/data/pokemon/pokemon-db.ts。
 *
 * 图片按需在线加载，本脚本只存在线 URL。
 * 运行：node scripts/build-pokemon-db.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/pokemon/pokemon-db.ts')

const API = 'https://pokeapi.co/api/v2'
const SPRITE = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

// 若要扩展到最新（含悖论/礼盒等），改这里的总数即可
const TOTAL = 1025

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

// 各世代对应地区（编号区间 -> 地区中文名，与 REGIONS 一致）
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.status === 429) {
        // 限流：退避重试
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

function zh(arr, fallback = '', field = 'name') {
  const f = (arr || []).find((x) => x.language.name === 'zh-hans')
  if (!f) return fallback
  const v = f[field] ?? f.name ?? f.genus ?? ''
  return v || fallback
}

// ability 英文名 -> 中文名 缓存
const abilityZhCache = new Map()

async function getAbilityZh(url) {
  if (abilityZhCache.has(url)) return abilityZhCache.get(url)
  try {
    const d = await getJSON(url)
    const name = zh(d.names, null) || d.name
    abilityZhCache.set(url, name)
    return name
  } catch {
    return null
  }
}

async function buildOne(id) {
  const p = await getJSON(`${API}/pokemon/${id}`)
  const sp = await getJSON(`${API}/pokemon-species/${id}`)

  const types = p.types
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)

  const stats = p.stats.map((s) => ({
    key: s.stat.name,
    nameZh:
      {
        hp: 'HP',
        attack: '攻击',
        defense: '防御',
        'special-attack': '特攻',
        'special-defense': '特防',
        speed: '速度',
      }[s.stat.name] || s.stat.name,
    value: s.base_stat,
  }))

  // 特性（英文名 + 中文名），并捕获 PokeAPI 的 is_hidden 用于区分隐藏特性
  const abilityJobs = p.abilities.map(async (a) => {
    const en = a.ability.name
    const zhName = await getAbilityZh(a.ability.url)
    const label = zhName && zhName !== en ? `${zhName}(${en})` : zhName || en
    return { label, isHidden: !!a.is_hidden }
  })
  const abilityResults = await Promise.all(abilityJobs)
  const abilities = abilityResults.map((r) => r.label)
  const hiddenAbilities = abilityResults.filter((r) => r.isHidden).map((r) => r.label)

  const nameZh = zh(sp.names, p.name, 'name')
  const genera = zh(sp.genera, '宝可梦', 'genus')
  const flavors = sp.flavor_text_entries.filter((f) => f.language.name === 'zh-hans')
  const descRaw = flavors.length
    ? flavors[flavors.length - 1].flavor_text
    : (sp.flavor_text_entries.find((f) => f.language.name === 'en')?.flavor_text || '')
  const description = descRaw.replace(/\n|\f/g, ' ').trim()

  return {
    id,
    name: p.name,
    nameZh,
    types,
    spriteUrl: SPRITE(id),
    height: p.height, // 分米
    weight: p.weight, // 百克
    stats,
    abilities,
    hiddenAbilities,
    gen: genOf(id),
    region: regionOf(id),
    genera,
    description: description || '暂无该宝可梦的详细介绍。',
  }
}

async function main() {
  console.log(`开始抓取 ${TOTAL} 只宝可梦（含特性中文名）...`)
  const all = []
  // 每批 25 只并发，控制速率避免触发限流
  const BATCH = 25
  for (let i = 1; i <= TOTAL; i += BATCH) {
    const end = Math.min(i + BATCH - 1, TOTAL)
    const jobs = []
    for (let id = i; id <= end; id++) jobs.push(buildOne(id).catch((e) => {
      console.error(`  ✗ #${id} 失败: ${e.message}`)
      return null
    }))
    const settled = await Promise.all(jobs)
    for (const r of settled) if (r) all.push(r)
    console.log(`  进度 ${end}/${TOTAL} (成功 ${all.length})`)
    await sleep(200)
  }

  all.sort((a, b) => a.id - b.id)
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

  for (const p of all) {
    const statsLiteral = p.stats
      .map((s) => `    { key: ${JSON.stringify(s.key)}, nameZh: ${JSON.stringify(s.nameZh)}, value: ${s.value} }`)
      .join(',\n')
    const abilitiesLiteral = p.abilities.map((a) => JSON.stringify(a)).join(', ')
    lines.push(`  {`)
    lines.push(`    id: ${p.id},`)
    lines.push(`    name: ${JSON.stringify(p.name)},`)
    lines.push(`    nameZh: ${JSON.stringify(p.nameZh)},`)
    lines.push(`    types: [${p.types.map((t) => JSON.stringify(t)).join(', ')}],`)
    lines.push(`    spriteUrl: ${JSON.stringify(p.spriteUrl)},`)
    lines.push(`    height: ${p.height},`)
    lines.push(`    weight: ${p.weight},`)
    lines.push(`    stats: [\n${statsLiteral}\n    ],`)
    lines.push(`    abilities: [${abilitiesLiteral}],`)
    const hiddenLiteral = p.hiddenAbilities.map((a) => JSON.stringify(a)).join(', ')
    lines.push(`    hiddenAbilities: [${hiddenLiteral}],`)
    lines.push(`    gen: ${p.gen},`)
    lines.push(`    region: ${JSON.stringify(p.region)},`)
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
  lines.push(`export const POKEMON_TOTAL = ${all.length}`)
  lines.push('')

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, lines.join('\n'), 'utf8')
  console.log(`\n✅ 已生成 ${all.length} 只 → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
