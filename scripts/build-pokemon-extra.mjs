/**
 * 宝可梦「技能 + 特性」数据补全脚本
 * ---------------------------------------------------------------
 * 在已有 pokemon-db.ts（基础字段）基础上，从 PokeAPI 抓取：
 *   1) 每只宝可梦的技能（按第九世代 scarlet-violet 过滤），分组为
 *      升级(level-up) / 蛋生(egg) / 学习机(machine)
 *   2) 每个技能的详情：中文名 / 属性 / 类别 / 威力 / 命中 / PP
 *   3) 每个特性的详情：中文名 / 效果描述(中)
 *
 * 生成：
 *   src/data/moves/pokemon-moves.ts     (MOVE_DB 共享技能表 + POKEMON_MOVES 每只技能引用)
 *   src/data/abilities/pokemon-abilities.ts (ABILITY_DB 共享特性表)
 *
 * 运行：node scripts/build-pokemon-extra.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_MOVES = resolve(__dirname, '../src/data/moves/pokemon-moves.ts')
const OUT_ABIL = resolve(__dirname, '../src/data/abilities/pokemon-abilities.ts')

const API = 'https://pokeapi.co/api/v2'
const TOTAL = 1025
const SV = 'scarlet-violet' // 第九世代版本组

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url, tries = 4) {
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

function zh(arr, fallback = '') {
  const f = (arr || []).find((x) => x.language.name === 'zh-hans')
  return f && f.name ? f.name : fallback
}

/** 罗马数字 -> 整数（用于 version-group 的 generation 名） */
function romanToInt(r) {
  const m = { i: 1, v: 5, x: 10, l: 50, c: 100 }
  let n = 0
  for (let i = 0; i < r.length; i++) {
    const v = m[r[i]]
    const nx = m[r[i + 1]]
    if (nx && v < nx) n -= v
    else n += v
  }
  return n
}

// ---- 缓存 ----
const moveCache = new Map() // url -> MoveInfo
const abilityCache = new Map() // url -> AbilityInfo(en name -> key)

async function getMoveInfo(url) {
  if (moveCache.has(url)) return moveCache.get(url)
  const d = await getJSON(url)
  const en = d.name
  const zhName = zh(d.names, null) || en
  const info = {
    nameEn: en,
    nameZh: zhName,
    type: d.type?.name || 'unknown',
    category: d.damage_class?.name || 'status', // physical/special/status
    power: d.power ?? null,
    accuracy: d.accuracy ?? null,
    pp: d.pp ?? null,
  }
  moveCache.set(url, info)
  return info
}

async function getAbilityInfo(url, en) {
  if (abilityCache.has(url)) return abilityCache.get(url)
  const d = await getJSON(url)
  const zhName = zh(d.names, null) || en
  // 中文描述优先 flavor_text_entries(zh-hans) 最后一条，否则英文 effect
  const flavors = d.flavor_text_entries.filter((f) => f.language.name === 'zh-hans')
  let descZh = flavors.length
    ? flavors[flavors.length - 1].flavor_text.replace(/\n|\f/g, ' ').trim()
    : ''
  if (!descZh) {
    const eff = (d.effect_entries || []).find((e) => e.language.name === 'en')
    descZh = eff ? eff.short_effect.replace(/\n|\f/g, ' ').trim() : '暂无描述。'
  }
  const info = { nameEn: en, nameZh: zhName, descZh }
  abilityCache.set(url, info)
  return info
}

/** 从宝可梦的 moves 数组提取（按第九世代）技能引用 */
function extractMoves(moves) {
  const levelMap = new Map() // name -> max level
  const eggSet = new Set()
  const machineSet = new Set()

  for (const m of moves) {
    const name = m.move.name
    const svEntries = m.version_group_details.filter(
      (d) => d.version_group.name === SV,
    )
    const entries = svEntries.length ? svEntries : m.version_group_details

    for (const d of entries) {
      const method = d.move_learn_method.name
      if (method === 'level-up') {
        const lvl = d.level_learned_at || 0
        if (!levelMap.has(name) || lvl > levelMap.get(name)) levelMap.set(name, lvl)
      } else if (method === 'egg') {
        eggSet.add(name)
      } else if (method === 'machine') {
        machineSet.add(name)
      }
    }
  }

  const level = [...levelMap.entries()]
    .map(([name, level]) => ({ name, level }))
    .sort((a, b) => a.level - b.level)
  return {
    level,
    egg: [...eggSet],
    machine: [...machineSet],
  }
}

async function buildOne(id) {
  const p = await getJSON(`${API}/pokemon/${id}`)
  const ref = extractMoves(p.moves)

  // 抓取本只涉及的技能详情（去重由 moveCache 保证）
  const moveUrls = new Set()
  for (const g of p.moves) moveUrls.add(g.move.url)
  await Promise.all([...moveUrls].map((u) => getMoveInfo(u).catch(() => null)))

  // 抓取特性详情（从已有 abilities 字符串解析英文名）
  const abilityNames = new Set()
  for (const a of p.abilities) {
    const m = a.ability.name // 已经是英文名
    abilityNames.add(m)
  }
  await Promise.all(
    [...abilityNames].map((en) =>
      getAbilityInfo(`https://pokeapi.co/api/v2/ability/${en}`, en).catch(() => null),
    ),
  )

  return { id, ref }
}

async function main() {
  console.log(`开始补全 ${TOTAL} 只宝可梦的技能 / 特性数据...`)
  const all = []
  const BATCH = 20
  for (let i = 1; i <= TOTAL; i += BATCH) {
    const end = Math.min(i + BATCH - 1, TOTAL)
    const jobs = []
    for (let id = i; id <= end; id++) {
      jobs.push(
        buildOne(id).catch((e) => {
          console.error(`  ✗ #${id} 失败: ${e.message}`)
          return null
        }),
      )
    }
    const settled = await Promise.all(jobs)
    for (const r of settled) if (r) all.push(r)
    console.log(`  进度 ${end}/${TOTAL} (成功 ${all.length})`)
    await sleep(200)
  }

  all.sort((a, b) => a.id - b.id)

  // ---- 写出 pokemon-moves.ts ----
  const moveLines = []
  for (const [url, info] of moveCache) {
    moveLines.push(
      `  ${JSON.stringify(info.nameEn)}: ${JSON.stringify(info, null, 0)
        .replace(/,/g, ', ')
        .replace(/\{/g, '{ ')
        .replace(/\}/g, ' }')},`,
    )
  }
  const lines = []
  lines.push('// 此文件由 scripts/build-pokemon-extra.mjs 自动生成，请勿手动编辑。')
  lines.push('// 数据来源：PokeAPI（https://pokeapi.co）。技能按第九世代 scarlet-violet 过滤。')
  lines.push("import type { MoveInfo, PokemonMoves } from '@/types'")
  lines.push('')
  lines.push('export const MOVE_DB: Record<string, MoveInfo> = {')
  for (const [url, info] of moveCache) {
    lines.push(
      `  ${JSON.stringify(info.nameEn)}: ${JSON.stringify(info)},`,
    )
  }
  lines.push('}')
  lines.push('')
  lines.push('export const POKEMON_MOVES: Record<number, PokemonMoves> = {')
  for (const r of all) {
    if (!r.ref.level.length && !r.ref.egg.length && !r.ref.machine.length) continue
    const level = r.ref.level
      .map((x) => `{ name: ${JSON.stringify(x.name)}, level: ${x.level} }`)
      .join(', ')
    const egg = r.ref.egg.map((x) => JSON.stringify(x)).join(', ')
    const machine = r.ref.machine.map((x) => JSON.stringify(x)).join(', ')
    lines.push(`  ${r.id}: { level: [${level}], egg: [${egg}], machine: [${machine}] },`)
  }
  lines.push('}')
  lines.push('')

  mkdirSync(dirname(OUT_MOVES), { recursive: true })
  writeFileSync(OUT_MOVES, lines.join('\n'), 'utf8')
  console.log(`✅ 技能数据：${moveCache.size} 个技能 / ${all.length} 只 → ${OUT_MOVES}`)

  // ---- 写出 pokemon-abilities.ts ----
  const alines = []
  alines.push('// 此文件由 scripts/build-pokemon-extra.mjs 自动生成，请勿手动编辑。')
  alines.push('// 数据来源：PokeAPI（https://pokeapi.co）。')
  alines.push("import type { AbilityInfo } from '@/types'")
  alines.push('')
  alines.push('export const ABILITY_DB: Record<string, AbilityInfo> = {')
  for (const [, info] of abilityCache) {
    alines.push(`  ${JSON.stringify(info.nameEn)}: ${JSON.stringify(info)},`)
  }
  alines.push('}')
  alines.push('')

  mkdirSync(dirname(OUT_ABIL), { recursive: true })
  writeFileSync(OUT_ABIL, alines.join('\n'), 'utf8')
  console.log(`✅ 特性数据：${abilityCache.size} 个特性 → ${OUT_ABIL}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
