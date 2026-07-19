/**
 * 招式数据优化：以外部 pokemon-dataset-zh-main/data/moves 为参考，修正项目 MOVE_DB
 * ------------------------------------------------------------------
 * 安全覆盖规则（避免盲目整表覆盖带来的错误）：
 *  - nameZh  ：采用外部更标准的官方中文译名（仅展示名，零风险）
 *  - type     ：采用外部（二者一致，仅 struggle-bug 由 bug→normal 修正）
 *  - category ：采用外部（二者一致，仅 struggle-bug 由 special→physical 修正）
 *  - power    ：采用外部（无差异）
 *  - accuracy ：保留项目原值（外部对撒菱等无命中判定招式误填了 100，不宜覆盖；仅修正 struggle-bug→null）
 *  - pp       ：保留项目原值（外部 pp 随世代变动且与项目各有所本；仅修正 struggle-bug→10）
 *  - gen      ：保留项目原值（外部数据集不含世代字段）
 *  - 其余 448 条项目独有招式：原样保留
 *
 * 运行：node scripts/optimize-moves-from-dataset.mjs
 * 会自动备份原文件到 .move_backup/
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MOVE_DB_TS = resolve(__dirname, '../src/data/moves/pokemon-moves.ts')
const DATASET_DIR = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/moves'
const BACKUP_DIR = resolve(__dirname, '../.move_backup')

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
function fmt(v) {
  return v === null ? 'null' : String(v)
}

// ---- 解析 MOVE_DB（保留顺序） ----
const dbRaw = readFileSync(MOVE_DB_TS, 'utf-8')
const headerMatch = dbRaw.match(/^[\s\S]*?export const MOVE_DB:[\s\S]*?= \{/)
const header = headerMatch ? headerMatch[0] : "export const MOVE_DB: Record<string, MoveInfo> = {\n"
const blocks = [...dbRaw.matchAll(/"([a-z0-9-]+)":\s*\{([\s\S]*?)\},/g)]

const db = []
for (const b of blocks) {
  const key = b[1]
  const body = b[2]
  const g = (re) => { const m = body.match(re); return m ? m[1] : undefined }
  db.push({
    key,
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
  })
}

// ---- 覆盖 ----
let nameFixed = 0
let typeFixed = 0
let catFixed = 0
let accFixed = 0
let ppFixed = 0
const nameSamples = []

for (const e of db) {
  const x = ext.get(e.key)
  if (!x) continue
  // nameZh（展示名，直接采用外部）
  if (x.nameZh && x.nameZh !== e.nameZh) {
    nameSamples.push(`${e.key}: ${e.nameZh} → ${x.nameZh}`)
    e.nameZh = x.nameZh
    nameFixed++
  }
  // type / category / power：外部为准（仅 struggle-bug 会变化）
  if (x.type && x.type !== e.type) { e.type = x.type; typeFixed++ }
  if (x.category && x.category !== e.category) { e.category = x.category; catFixed++ }
  if (x.power !== null && x.power !== e.power) e.power = x.power
  // accuracy / pp：除 struggle-bug 外保留项目原值（避免外部误填）
  if (e.key === 'struggle-bug') {
    if (x.accuracy !== e.accuracy) { e.accuracy = x.accuracy; accFixed++ }
    if (x.pp !== e.pp) { e.pp = x.pp; ppFixed++ }
  }
}

// ---- 重写文件 ----
let body = ''
for (const e of db) {
  body += `  "${e.key}": {\n`
  body += `    nameZh: "${e.nameZh}",\n`
  body += `    type: "${e.type}",\n`
  body += `    category: "${e.category}",\n`
  body += `    power: ${fmt(e.power)},\n`
  body += `    accuracy: ${fmt(e.accuracy)},\n`
  body += `    pp: ${fmt(e.pp)},\n`
  body += `    gen: ${fmt(e.gen)}\n`
  body += `  },\n`
}

// 保留原头部注释（去掉末尾的 "export const MOVE_DB...= {" 以便拼接）
const headClean = header.replace(/export const MOVE_DB:[\s\S]*?= \{\s*$/, '')
const content = `${headClean}export const MOVE_DB: Record<string, MoveInfo> = {\n${body}}\n`

mkdirSync(BACKUP_DIR, { recursive: true })
copyFileSync(MOVE_DB_TS, resolve(BACKUP_DIR, `pokemon-moves.${Date.now()}.ts.bak`))
writeFileSync(MOVE_DB_TS, content, 'utf-8')

console.log('===== 招式数据优化完成 =====')
console.log(`总招式数：${db.length}（项目独有 ${db.length - ext.size} 条原样保留）`)
console.log(`中文名采用外部标准译名：${nameFixed} 条`)
nameSamples.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
console.log(`属性修正：${typeFixed} 条（struggle-bug: bug→normal）`)
console.log(`分类修正：${catFixed} 条（struggle-bug: special→physical）`)
console.log(`命中修正：${accFixed} 条（struggle-bug→null）`)
console.log(`PP 修正：${ppFixed} 条（struggle-bug→10）`)
console.log(`\n备份已存至 .move_backup/`)
