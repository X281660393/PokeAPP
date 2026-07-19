/**
 * 招式数据对比：项目 MOVE_DB  vs 外部 pokemon-dataset-zh-main/data/moves
 * ------------------------------------------------------------------
 * 逐项比对字段：nameZh / type / category / power / accuracy / pp / gen，
 * 统计差异数量并输出样例，供「数据优化」参考。
 *
 * 运行：node scripts/compare-moves-with-dataset.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MOVE_DB_TS = resolve(__dirname, '../src/data/moves/pokemon-moves.ts')
const DATASET_DIR = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/moves'

// 中文属性名 -> 项目英文 key（来自 constants TYPE_NAMES）
const ZH_TYPE_TO_KEY = {
  一般: 'normal', 火: 'fire', 水: 'water', 电: 'electric', 草: 'grass',
  冰: 'ice', 格斗: 'fighting', 毒: 'poison', 地面: 'ground', 飞行: 'flying',
  超能力: 'psychic', 虫: 'bug', 岩石: 'rock', 幽灵: 'ghost', 龙: 'dragon',
  恶: 'dark', 钢: 'steel', 妖精: 'fairy',
}
const ZH_CAT_TO_KEY = { 物理: 'physical', 特殊: 'special', 变化: 'status' }

const KEY_ALIASES = { 'vise-grip': 'vice-grip', struggle: 'struggle-bug' }

function kebab(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
function numOrNull(s) {
  if (s == null) return null
  const m = String(s).match(/-?\d+/)
  return m ? Number(m[0]) : null
}

// ---- 解析 MOVE_DB ----
const dbRaw = readFileSync(MOVE_DB_TS, 'utf-8')
const dbBlocks = [...dbRaw.matchAll(/"([a-z0-9-]+)":\s*\{([\s\S]*?)\},/g)]
const db = new Map()
for (const b of dbBlocks) {
  const key = b[1]
  const body = b[2]
  const g = (re) => { const m = body.match(re); return m ? m[1] : undefined }
  db.set(key, {
    nameZh: g(/nameZh:\s*"([^"]*)"/),
    type: g(/type:\s*"([^"]*)"/),
    category: g(/category:\s*"([^"]*)"/),
    power: numOrNull(g(/power:\s*(-?\d+|null)/)),
    accuracy: numOrNull(g(/accuracy:\s*(-?\d+|null)/)),
    pp: numOrNull(g(/pp:\s*(-?\d+|null)/)),
    gen: numOrNull(g(/gen:\s*(\d+)/)),
  })
}

// ---- 解析外部数据集 ----
const files = readdirSync(DATASET_DIR).filter((f) => f.endsWith('.json'))
const ext = new Map()
for (const f of files) {
  let d
  try { d = JSON.parse(readFileSync(resolve(DATASET_DIR, f), 'utf-8')) }
  catch { continue }
  let key = kebab(d.name_en)
  if (KEY_ALIASES[key]) key = KEY_ALIASES[key]
  ext.set(key, {
    nameZh: d.name_zh,
    type: ZH_TYPE_TO_KEY[d.type],
    category: ZH_CAT_TO_KEY[d.category],
    power: numOrNull(d.power),
    accuracy: numOrNull(d.accuracy),
    pp: numOrNull(d.pp),
    gen: numOrNull(d.gen ?? d.generation),
  })
}

// ---- 比对 ----
const fields = ['nameZh', 'type', 'category', 'power', 'accuracy', 'pp', 'gen']
const mism = { nameZh: [], type: [], category: [], power: [], accuracy: [], pp: [], gen: [] }
const onlyDb = [], onlyExt = []
const dbKeys = new Set(db.keys())
const extKeys = new Set(ext.keys())

for (const k of dbKeys) if (!extKeys.has(k)) onlyDb.push(k)
for (const k of extKeys) if (!dbKeys.has(k)) onlyExt.push(k)

let both = 0
for (const [k, d] of db) {
  const e = ext.get(k)
  if (!e) continue
  both++
  for (const f of fields) {
    const dv = d[f] ?? null
    const ev = e[f] ?? null
    if (dv !== ev) mism[f].push({ key: k, db: dv, ext: ev })
  }
}

// ---- 输出 ----
console.log('===== 招式数据对比报告 =====')
console.log(`项目 MOVE_DB 招式数：${db.size}`)
console.log(`外部数据集招式数：${ext.size}`)
console.log(`双向交集（可比对）：${both}`)
console.log(`仅项目有、外部无：${onlyDb.length}  [示例 ${onlyDb.slice(0, 8).join(', ')}]`)
console.log(`仅外部有、项目无：${onlyExt.length}  [示例 ${onlyExt.slice(0, 8).join(', ')}]`)
console.log('')
console.log('----- 各字段差异统计（交集内）-----')
for (const f of fields) {
  const list = mism[f]
  console.log(`${f.padEnd(9)} 差异 ${String(list.length).padStart(4)} 条`)
}
console.log('')
const SHOW = 12
for (const f of fields) {
  const list = mism[f]
  if (!list.length) continue
  console.log(`===== ${f} 差异样例（前 ${Math.min(SHOW, list.length)}）=====`)
  for (const r of list.slice(0, SHOW)) {
    console.log(`  ${r.key.padEnd(22)} 项目=${JSON.stringify(r.db)}  外部=${JSON.stringify(r.ext)}`)
  }
  if (list.length > SHOW) console.log(`  … 其余 ${list.length - SHOW} 条`)
  console.log('')
}
