/**
 * 数据 Excel 双向转换工具（v2 优化版）
 * ---------------------------------------------------------------
 * 把 App 内的静态数据表导出成 Excel（每个表一个 Sheet），方便在 Excel 里
 * 批量修改中文名/描述/属性等；改完再导回成对应的 TS 格式，App 直接可用。
 *
 * 运行：
 *   node scripts/data-excel.mjs export [path]               # TS -> xlsx
 *   node scripts/data-excel.mjs import [path] [--dry-run]   # xlsx -> TS（覆盖前自动 .bak 备份）
 *
 * 解析 TS：用 esbuild 把数据文件转成 ESM 后动态 import（自动剥离 import type / 类型声明）。
 * 安全：含多个导出的文件（如招式表 MOVE_DB + POKEMON_MOVES），只重建被编辑的常量，
 *       其余导出原样保留，不会误删数据。导入前对每个目标文件做 .bak 备份。
 *
 * v2 优化点：
 *   - lit() 修复对象 key 不加引号的 bug（special-attack 等连字符 key 现在会正确加引号）
 *   - lit() 支持嵌套缩进，深层结构可读性更好
 *   - loadTS() 加文件级缓存（tools.ts 三张表、复合表的 movesFile、外键 lookup 不再重复加载）
 *   - import 时若 xlsx 被 Excel 占用，给出友好提示而不是原始堆栈
 *   - 收集所有 ⚠ 警告，末尾打印汇总数量
 *   - 跳过完全空白的 Excel 行（避免末尾空行被当成数据）
 *   - 新增 --dry-run 选项：只打印将写哪些文件 + 行数，不实际写回
 *   - 末尾打印总表数 / 总行数 / 耗时
 */
import * as esbuild from 'esbuild'
import ExcelJS from 'exceljs'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { TABLES, OUT_XLSX, ALL_TYPES } from './excel-config.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ===== 全局状态：告警计数（parseLevelMoves / parseNameList 等会累加） =====
let warnCount = 0
function warn(msg) {
  console.warn(msg)
  warnCount++
}

// ===== TS 文件加载（带文件级缓存） =====
/** 同次运行内，同一 TS 文件只 esbuild.transform + import 一次 */
const tsCache = new Map()
async function loadTS(file) {
  if (tsCache.has(file)) return tsCache.get(file)
  const src = readFileSync(file, 'utf8')
  const out = await esbuild.transform(src, { loader: 'ts', format: 'esm' })
  const tmp = resolve(
    os.tmpdir(),
    `poke_excel_${Date.now()}_${Math.random().toString(36).slice(2)}.mjs`,
  )
  writeFileSync(tmp, out.code)
  let mod
  try {
    mod = await import('file://' + tmp)
  } finally {
    setTimeout(() => {
      try {
        unlinkSync(tmp)
      } catch {
        /* Windows 下可能短暂占用，忽略 */
      }
    }, 500)
  }
  tsCache.set(file, mod)
  return mod
}

/** 外键查找表：英文名 -> 中文名 等（基于 loadTS 缓存，自动复用） */
async function fkMap(lookupFile, lookupConst, lookupField) {
  const m = await loadTS(lookupFile)
  const db = m[lookupConst] || {}
  const map = {}
  for (const [k, v] of Object.entries(db)) {
    if (v && v[lookupField]) map[k] = v[lookupField]
  }
  return map
}

// ===== 字面量序列化：把值序列化成语义正确的 TS 字面量 =====
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const INT_RE = /^\d+$/
/** 对象 key：合法标识符 / 纯整数不加引号；其余（如 'special-attack'）加引号 */
function keyLit(k) {
  if (IDENT_RE.test(k) || INT_RE.test(k)) return k
  return JSON.stringify(k)
}

/**
 * @param {*} v 任意值
 * @param {number} indent 当前缩进层级（顶层 0）；嵌套对象/数组会递增
 */
function lit(v, indent = 0) {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0'
  if (typeof v === 'string') return JSON.stringify(v)
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]'
    return '[' + v.map((x) => lit(x, indent)).join(', ') + ']'
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v)
    if (entries.length === 0) return '{}'
    const pad = '  '.repeat(indent + 1)
    const closePad = '  '.repeat(indent)
    const inner = entries
      .map(([k, val]) => `${pad}${keyLit(k)}: ${lit(val, indent + 1)}`)
      .join(',\n')
    return `{\n${inner}\n${closePad}}`
  }
  return JSON.stringify(v)
}

// ===== Excel 单元格值 <-> 对象字段值 =====
/** 对象字段 -> Excel 单元格值 */
function cellValue(obj, f, t) {
  // 外键列：用主键反查另一张表的中文名（只读参考列）
  if (f.kind === 'fk') {
    const idf = t && t.fields.find((x) => x.kind === 'id')
    const kv = idf ? obj[idf.src] : undefined
    const map = f._fkMap || {}
    return kv != null && map[kv] ? map[kv] : kv ?? ''
  }
  const v = obj[f.src]
  if (f.kind === 'arr') return (Array.isArray(v) ? v : v || []).join(f.sep || ', ')
  if (f.kind === 'stats') {
    const arr = obj[f.src] || []
    const s = arr.find((x) => x && x.key === f.statKey)
    return s ? s.value : ''
  }
  if (f.kind === 'bool') return v === true ? 'true' : 'false'
  if (v === null || v === undefined) return ''
  return v
}

function colWidth(f) {
  if (f.src === 'description' || f.src === 'descZh') return 50
  if (f.kind === 'stats') return 8
  if (f.from === 'moves') return 50
  if (f.kind === 'arr') return 26
  return 16
}

/** Excel 单元格值 -> 对象字段值 */
function parseCell(val, f) {
  if (f.kind === 'arr') {
    if (val === '' || val === null || val === undefined) return []
    return String(val)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length)
  }
  if (f.kind === 'stats') return undefined // 由重建逻辑统一处理
  if (f.kind === 'bool') return String(val).toLowerCase() === 'true'
  if (f.kind === 'num') {
    const n = Number(val)
    return Number.isFinite(n) ? n : 0
  }
  if (f.kind === 'numOrNull') {
    if (val === '' || val === null || val === undefined) return null
    const n = Number(val)
    return Number.isFinite(n) ? n : null
  }
  if (val === null || val === undefined) return ''
  return String(val)
}

// ===== 行重建：把一行 Excel 数据还原成对象 =====
/** record 返回 {key, obj}，数组返回 {key:null, obj} */
function rebuildObject(t, row) {
  const numOrSelf = (x) => (x === '' || x == null ? x : Number(x))
  // 进化链（边表）：每行 (根编号, 是否根, 源编号, 进化方式, 目标编号)
  if (t.serialize === 'tree') {
    return {
      key: null,
      obj: {
        rootId: numOrSelf(row['根编号']),
        isRoot: String(row['是否根']).toLowerCase() === 'true',
        fromId: numOrSelf(row['源编号']),
        method: row['进化方式'] || '',
        toId: numOrSelf(row['目标编号']),
      },
    }
  }
  // 矩阵型（防御矩阵 / 图鉴字符串矩阵）
  if (t.kind === 'matrix') {
    const key = String(row[t.matrixKeyHeader]).trim()
    const obj = {}
    const mkeys = t.matrixKeys || []
    for (const k of mkeys) {
      const v = row[k]
      if (t.matrixKind === 'str') {
        obj[k] = v == null ? '' : String(v)
      } else {
        obj[k] = typeof v === 'number' ? v : Number(v) || 0
      }
    }
    return { key, obj }
  }
  // 超级进化（每只基础宝可梦一行一个形态）
  if (t.serialize === 'mega') {
    let key = ''
    const obj = {}
    const stats = {}
    for (const f of t.fields) {
      if (f.kind === 'id') {
        key = parseCell(row[f.name], f)
        continue
      }
      if (f.kind === 'stats') {
        stats[f.statKey] = Number(row[f.name]) || 0
        continue
      }
      obj[f.src] = parseCell(row[f.name], f)
    }
    obj.stats = stats
    return { key, obj }
  }
  // 普通 Record 型
  if (t.kind === 'record') {
    const obj = {}
    let key = ''
    for (const f of t.fields) {
      if (f.kind === 'fk') continue // 外键列是只读参考，跳过
      if (f.kind === 'id') {
        key = parseCell(row[f.name], f)
        continue
      }
      if (f.kind === 'stats') continue
      const val = parseCell(row[f.name], f)
      // 可选字段为空则不写入，保持原始稀疏结构
      if (f.optional && (val === '' || (Array.isArray(val) && val.length === 0))) continue
      obj[f.src] = val
    }
    return { key, obj }
  }
  const obj = {}
  for (const f of t.fields) {
    if (f.kind === 'stats') continue
    obj[f.src] = parseCell(row[f.name], f)
  }
  if (t.constName === 'POKEMON_DB') {
    obj.stats = t.fields
      .filter((f) => f.kind === 'stats')
      .map((f) => ({
        key: f.statKey,
        nameZh: f.name,
        value: Number(row[f.name]) || 0,
      }))
  }
  return { key: null, obj }
}

// ===== Excel 读取：读一个 Sheet 的所有数据行（跳过表头与空行） =====
function readRows(ws, t) {
  const rowsData = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // 跳过表头
    // 第一列（主键列）空白的行视为空行，跳过（避免 Excel 末尾的空行被当成数据）
    // 不依赖 field.kind === 'id'，因为部分表（如宝可梦的"编号"）主键 kind 是 'num'
    const firstCell = row.getCell(1).value
    if (firstCell === '' || firstCell === null || firstCell === undefined) return
    const rowObj = {}
    if (t.kind === 'matrix') {
      rowObj[t.matrixKeyHeader] = firstCell
      t.matrixKeys.forEach((k, i) => {
        rowObj[k] = row.getCell(i + 2).value
      })
    } else {
      t.fields.forEach((f, i) => {
        rowObj[f.name] = row.getCell(i + 1).value
      })
    }
    rowsData.push(rowObj)
  })
  return rowsData
}

// ===== 招式名解析 =====
/** 等级技能列（"Lv16 撞击, Lv23 吼叫"）-> [{ name: 英文名, level }] */
function parseLevelMoves(str, nameKeyMap) {
  if (str === '' || str == null) return []
  return String(str)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^Lv\.?\s*(\d+)\s+(.+)$/)
      if (!m) {
        warn(`    ⚠ 升级技能格式无法解析：「${s}」`)
        return null
      }
      const level = Number(m[1])
      const nameZh = m[2].trim()
      const key = nameKeyMap[nameZh]
      if (!key) {
        warn(`    ⚠ 升级技能找不到招式「${nameZh}」`)
        return null
      }
      return { name: key, level }
    })
    .filter(Boolean)
}

/** 普通技能列（"撞击, 吼叫"）-> 英文名数组 */
function parseNameList(str, nameKeyMap) {
  if (str === '' || str == null) return []
  return String(str)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => {
      const key = nameKeyMap[name]
      if (!key) {
        warn(`    ⚠ 技能找不到招式「${name}」`)
        return null
      }
      return key
    })
    .filter(Boolean)
}

// ===== 文件级序列化：同一文件可能含多个导出（如 tools.ts） =====

/** 宝可梦：数组型，含 POKEMON_BY_ID / POKEMON_TOTAL 派生，整文件重建 */
function serializePokemon(rebuilt) {
  const lines = []
  lines.push('// 此文件由 scripts/data-excel.mjs 从 Excel 导回生成（格式同 build-pokemon-db.mjs）。')
  lines.push("import type { PokemonDetail } from '@/types'")
  lines.push('')
  lines.push('export interface PokemonFull extends PokemonDetail {')
  lines.push('  /** 特性英文名 + 中文名（如 "静电(static)"）保留英文便于后续扩展 */')
  lines.push('}')
  lines.push('')
  lines.push('export const POKEMON_DB: PokemonFull[] = [')
  for (const { obj } of rebuilt) lines.push(`  ${lit(obj, 1)},`)
  lines.push(']')
  lines.push('')
  lines.push('export const POKEMON_BY_ID: Record<number, PokemonFull> = Object.fromEntries(')
  lines.push('  POKEMON_DB.map((p) => [p.id, p]),')
  lines.push(')')
  lines.push('')
  lines.push(`export const POKEMON_TOTAL = ${rebuilt.length}`)
  lines.push('')
  return lines.join('\n')
}

/** 招式：含 MOVE_DB + POKEMON_MOVES，只重建 MOVE_DB，POKEMON_MOVES 原样保留 */
function serializeMoves(rebuilt, original) {
  const lines = []
  lines.push('// 此文件由 scripts/data-excel.mjs 从 Excel 导回生成（MOVE_DB 更新，POKEMON_MOVES 原样保留）。')
  lines.push("import type { MoveInfo, PokemonMoves } from '@/types'")
  lines.push('')
  lines.push('export const MOVE_DB: Record<string, MoveInfo> = {')
  for (const { key, obj } of rebuilt) lines.push(`  ${JSON.stringify(key)}: ${lit(obj, 1)},`)
  lines.push('}')
  lines.push('')
  lines.push('export const POKEMON_MOVES: Record<number, PokemonMoves> = {')
  for (const [k, v] of Object.entries(original.POKEMON_MOVES || {})) {
    lines.push(`  ${k}: ${lit(v, 1)},`)
  }
  lines.push('}')
  lines.push('')
  return lines.join('\n')
}

/** 由「编号 -> 技能」映射重建 pokemon-moves.ts 的 POKEMON_MOVES（MOVE_DB 原样保留） */
function serializeMovesFromPokemon(movesMap, moveDB) {
  const lines = []
  lines.push('// 此文件由 scripts/data-excel.mjs 从 Excel 导回生成（POKEMON_MOVES 由宝可梦表更新，MOVE_DB 原样保留）。')
  lines.push("import type { MoveInfo, PokemonMoves } from '@/types'")
  lines.push('')
  lines.push('export const MOVE_DB: Record<string, MoveInfo> = {')
  for (const [k, v] of Object.entries(moveDB)) lines.push(`  ${JSON.stringify(k)}: ${lit(v, 1)},`)
  lines.push('}')
  lines.push('')
  lines.push('export const POKEMON_MOVES: Record<number, PokemonMoves> = {')
  for (const id of Object.keys(movesMap).sort((a, b) => Number(a) - Number(b))) {
    const m = movesMap[id] || { level: [], egg: [], machine: [] }
    const level = (m.level || []).map((x) => `{ name: ${JSON.stringify(x.name)}, level: ${x.level} }`).join(', ')
    const egg = (m.egg || []).map((x) => JSON.stringify(x)).join(', ')
    const machine = (m.machine || []).map((x) => JSON.stringify(x)).join(', ')
    lines.push(`  ${id}: { level: [${level}], egg: [${egg}], machine: [${machine}] },`)
  }
  lines.push('}')
  lines.push('')
  return lines.join('\n')
}

/** 单一 Record 型导出（道具/特性/天气/场地/异常状态）：整文件重建 */
function serializeSingle(t, rebuilt) {
  const lines = []
  lines.push('// 此文件由 scripts/data-excel.mjs 从 Excel 导回生成。')
  lines.push(`import type { ${t.typeName} } from '@/types'`)
  lines.push('')
  lines.push(`export const ${t.constName}: Record<string, ${t.typeName}> = {`)
  for (const { key, obj } of rebuilt) lines.push(`  ${JSON.stringify(key)}: ${lit(obj, 1)},`)
  lines.push('}')
  lines.push('')
  return lines.join('\n')
}

/** 工具表 tools.ts：多个导出整体重建（TOOLS/TOOL_MAP/类型相克/防御矩阵/顺序），并保留末尾工具函数 */
function serializeTools(tables, rebuiltMap, original) {
  const src = readFileSync(tables[0].file, 'utf8')

  const tools = (rebuiltMap['TOOLS'] || []).map((r) => r.obj)
  // 类型相克：优先用 Excel 重建，缺失则回退原值
  const tum = {}
  if (rebuiltMap['TYPE_MATCHUP_DATA']) {
    for (const { key, obj } of rebuiltMap['TYPE_MATCHUP_DATA']) tum[key] = obj
  } else {
    Object.assign(tum, original.TYPE_MATCHUP_DATA)
  }
  // 防御矩阵
  const dm = {}
  if (rebuiltMap['DEFENSE_MATRIX']) {
    for (const { key, obj } of rebuiltMap['DEFENSE_MATRIX']) dm[key] = obj
  } else {
    Object.assign(dm, original.DEFENSE_MATRIX)
  }
  // 顺序：保留原 CHART_ORDER（固定值，不在 Excel 编辑）
  const chartOrder = original.CHART_ORDER || ALL_TYPES

  // 末尾工具函数（getMatchupCell / getMatchupCellClass）原样保留
  const fnStart = src.indexOf('export function getMatchupCell')
  const fns = fnStart >= 0 ? '\n' + src.slice(fnStart).replace(/\s+$/, '') : ''

  const lines = []
  lines.push("import type { ToolItem, TypeMatchup } from '@/types'")
  lines.push('')
  lines.push('export const TOOLS: ToolItem[] = [')
  for (const obj of tools) lines.push(`  ${lit(obj, 1)},`)
  lines.push(']')
  lines.push('')
  lines.push('export const TOOL_MAP: Record<string, ToolItem> = Object.fromEntries(')
  lines.push('  TOOLS.map((t) => [t.id, t]),')
  lines.push(')')
  lines.push('')
  lines.push('export const TYPE_MATCHUP_DATA: Record<string, TypeMatchup> = {')
  for (const k of Object.keys(tum)) lines.push(`  ${JSON.stringify(k)}: ${lit(tum[k], 1)},`)
  lines.push('}')
  lines.push('')
  lines.push('export const DEFENSE_MATRIX: Record<string, Record<string, number>> = {')
  for (const k of Object.keys(dm)) lines.push(`  ${JSON.stringify(k)}: ${lit(dm[k], 1)},`)
  lines.push('}')
  lines.push('')
  lines.push(`export const CHART_ORDER = ${lit(chartOrder)} as const`)
  lines.push(fns)
  lines.push('')
  return lines.join('\n')
}

/** 招式描述：保留本地 MoveDesc 接口，仅重建 MOVE_DESCRIPTIONS 常量 */
function serializeMoveDesc(rebuilt, rawSrc) {
  const idx = rawSrc.indexOf('export const MOVE_DESCRIPTIONS')
  const head = idx >= 0 ? rawSrc.slice(0, idx) : ''
  const lines = ['export const MOVE_DESCRIPTIONS: Record<string, MoveDesc> = {']
  for (const { key, obj } of rebuilt) lines.push(`  ${JSON.stringify(key)}: ${lit(obj, 1)},`)
  lines.push('}')
  return head.replace(/\s+$/, '') + '\n\n' + lines.join('\n') + '\n'
}

/** 超级进化：保留本地 MegaForm 接口，按基础编号分组重建 */
function serializeMega(rebuilt, rawSrc) {
  const idx = rawSrc.indexOf('export const MEGA_EVOLUTIONS')
  const head = idx >= 0 ? rawSrc.slice(0, idx) : ''
  const groups = {}
  for (const { key, obj } of rebuilt) (groups[key] ||= []).push(obj)
  const lines = ['export const MEGA_EVOLUTIONS: Record<number, MegaForm[]> = {']
  for (const baseId of Object.keys(groups).sort((a, b) => Number(a) - Number(b))) {
    // 形态对象用 indent=2 渲染，使其在 `  ${baseId}: [\n    {form}\n  ],` 中正确缩进
    const forms = groups[baseId].map((f) => '    ' + lit(f, 2)).join(',\n')
    lines.push(`  ${baseId}: [\n${forms}\n  ],`)
  }
  lines.push('}')
  return head.replace(/\s+$/, '') + '\n\n' + lines.join('\n') + '\n'
}

/** 进化链：保留 EVO_ROOT 与 import，由边表重建 EVO_TREES */
function serializeEvo(rebuilt, rawSrc) {
  const idx = rawSrc.indexOf('export const EVO_TREES')
  const head = idx >= 0 ? rawSrc.slice(0, idx) : ''
  const groups = {}
  for (const { obj } of rebuilt) (groups[obj.rootId] ||= []).push(obj)
  const trees = {}
  for (const rootId of Object.keys(groups)) {
    const nodes = {}
    const getNode = (id) => (nodes[id] ||= { id: Number(id), method: '', evolvesTo: [] })
    for (const e of groups[rootId]) {
      const parent = getNode(e.fromId)
      const child = getNode(e.toId)
      if (e.isRoot) continue // 根的自身行仅用于声明节点，不建立进化边
      child.method = e.method || ''
      if (!parent.evolvesTo.some((x) => x.id === child.id)) parent.evolvesTo.push(child)
    }
    trees[rootId] = getNode(rootId)
  }
  const lines = ['export const EVO_TREES: Record<number, EvoNode> = {']
  for (const rid of Object.keys(trees).sort((a, b) => Number(a) - Number(b))) {
    lines.push(`  ${rid}: ${lit(trees[rid], 1)},`)
  }
  lines.push('}')
  return head.replace(/\s+$/, '') + '\n\n' + lines.join('\n') + '\n'
}

/** 图鉴描述：保留本地接口与末尾函数，由字符串矩阵重建 POKEDEX_DESCRIPTIONS */
function serializePokedex(rebuilt, rawSrc) {
  const idx = rawSrc.indexOf('export const POKEDEX_DESCRIPTIONS')
  const head = idx >= 0 ? rawSrc.slice(0, idx) : ''
  const tailIdx = rawSrc.indexOf('export function getPokedexDescriptions')
  const tail = tailIdx >= 0 ? rawSrc.slice(tailIdx) : ''
  const lines = ['export const POKEDEX_DESCRIPTIONS: Record<number, PokemonPokedexDesc> = {']
  for (const { key, obj } of rebuilt) {
    const entries = Object.entries(obj)
      .map(([k, v]) => `    { key: ${JSON.stringify(k)}, description: ${JSON.stringify(v)} }`)
      .join(',\n')
    lines.push(`  ${key}: [\n${entries}\n  ],`)
  }
  lines.push('}')
  return head.replace(/\s+$/, '') + '\n\n' + lines.join('\n') + '\n\n' + tail.replace(/\s+$/, '')
}

/** 按文件统一序列化（同一文件可能含多个导出，如 tools.ts） */
function serializeFile(file, tables, rebuiltMap, original, rawSrc) {
  const t0 = tables[0]
  if (t0.serialize === 'moveDesc') return serializeMoveDesc(rebuiltMap['MOVE_DESCRIPTIONS'], rawSrc)
  if (t0.serialize === 'mega') return serializeMega(rebuiltMap['MEGA_EVOLUTIONS'], rawSrc)
  if (t0.serialize === 'tree') return serializeEvo(rebuiltMap['EVO_TREES'], rawSrc)
  if (t0.serialize === 'pokedex') return serializePokedex(rebuiltMap['POKEDEX_DESCRIPTIONS'], rawSrc)
  if (file.endsWith('pokemon-db.ts')) return serializePokemon(rebuiltMap['POKEMON_DB'])
  if (file.endsWith('pokemon-moves.ts')) return serializeMoves(rebuiltMap['MOVE_DB'], original)
  if (file.endsWith('tools.ts')) return serializeTools(tables, rebuiltMap, original)
  return serializeSingle(tables[0], rebuiltMap[tables[0].constName])
}

// ===== 导出：TS -> xlsx =====

/** 超级进化导出（每个形态一行） */
async function exportMega(t, wb) {
  const mod = await loadTS(t.file)
  const data = mod[t.constName]
  if (!data) throw new Error(`在 ${t.file} 找不到导出常量 ${t.constName}`)
  const ws = wb.addWorksheet(t.sheet)
  ws.columns = t.fields.map((f) => ({ header: f.name, key: f.name, width: f.kind === 'id' ? 10 : 16 }))
  let n = 0
  for (const [baseId, forms] of Object.entries(data)) {
    for (const form of forms || []) {
      const row = {}
      for (const f of t.fields) {
        if (f.kind === 'id') row[f.name] = baseId
        else if (f.kind === 'stats') row[f.name] = (form.stats && form.stats[f.statKey]) ?? ''
        else row[f.name] = form[f.src] ?? ''
      }
      ws.addRow(row)
      n++
    }
  }
  console.log(`  导出「${t.sheet}」: ${n} 行`)
  return n
}

/** 进化链导出（深度优先展开为边表） */
async function exportTree(t, wb) {
  const mod = await loadTS(t.file)
  const data = mod[t.constName]
  if (!data) throw new Error(`在 ${t.file} 找不到导出常量 ${t.constName}`)
  const ws = wb.addWorksheet(t.sheet)
  ws.columns = t.fields.map((f) => ({ header: f.name, key: f.name, width: f.name === '进化方式' ? 20 : 12 }))
  let n = 0
  for (const [rootId, node] of Object.entries(data)) {
    ws.addRow({ 根编号: rootId, 是否根: 'true', 源编号: node.id, 进化方式: '', 目标编号: node.id })
    n++
    const dfs = (nd) => {
      for (const ch of nd.evolvesTo || []) {
        ws.addRow({ 根编号: rootId, 是否根: 'false', 源编号: nd.id, 进化方式: ch.method || '', 目标编号: ch.id })
        n++
        dfs(ch)
      }
    }
    dfs(node)
  }
  console.log(`  导出「${t.sheet}」: ${n} 行`)
  return n
}

/** 图鉴描述导出（字符串矩阵：行=编号，列=各版本） */
async function exportMatrixStr(t, wb) {
  const mod = await loadTS(t.file)
  const data = mod[t.constName]
  if (!data) throw new Error(`在 ${t.file} 找不到导出常量 ${t.constName}`)
  const union = new Set()
  for (const arr of Object.values(data)) {
    if (Array.isArray(arr)) for (const e of arr) if (e && e.key) union.add(e.key)
  }
  const keys = [...union]
  const ws = wb.addWorksheet(t.sheet)
  ws.columns = [
    { header: t.matrixKeyHeader, key: t.matrixKeyHeader, width: 10 },
    ...keys.map((k) => ({ header: k, key: k, width: 50 })),
  ]
  let n = 0
  for (const [id, entries] of Object.entries(data)) {
    const map = {}
    if (Array.isArray(entries)) for (const e of entries) if (e && e.key) map[e.key] = e.description
    const row = { [t.matrixKeyHeader]: id }
    for (const k of keys) row[k] = map[k] || ''
    ws.addRow(row)
    n++
  }
  console.log(`  导出「${t.sheet}」: ${n} 行`)
  return n
}

async function doExport(target) {
  const t0 = performance.now()
  // 预载「外键查找表」（如招式描述的英文名 -> 中文名）
  for (const t of TABLES) {
    if (t.fields) {
      for (const f of t.fields) {
        if (f.kind === 'fk') f._fkMap = await fkMap(f.lookupFile, f.lookupConst, f.lookupField)
      }
    }
  }
  const wb = new ExcelJS.Workbook()
  let totalRows = 0
  let tableCount = 0
  for (const t of TABLES) {
    // 自定义导出（超级进化 / 进化链 / 图鉴字符串矩阵）
    if (t.serialize === 'mega') {
      totalRows += await exportMega(t, wb)
      tableCount++
      continue
    }
    if (t.serialize === 'tree') {
      totalRows += await exportTree(t, wb)
      tableCount++
      continue
    }
    if (t.kind === 'matrix' && t.matrixKind === 'str') {
      totalRows += await exportMatrixStr(t, wb)
      tableCount++
      continue
    }
    // 复合表：一行同时来自多文件，自行加载并建工作表
    if (t.composite) {
      const dbMod = await loadTS(t.file)
      const movesMod = await loadTS(t.movesFile)
      const dbData = dbMod[t.constName]
      const movesData = movesMod[t.movesConst] || {}
      const moveDb = movesMod['MOVE_DB'] || {}
      const nameZhOf = (k) => (moveDb[k] && moveDb[k].nameZh) || k
      const ws = wb.addWorksheet(t.sheet)
      ws.columns = t.fields.map((f) => ({ header: f.name, key: f.name, width: colWidth(f) }))
      let n2 = 0
      for (const p of dbData) {
        const row = {}
        for (const f of t.fields) {
          if (f.from === 'moves') {
            const pm = movesData[p.id] || { level: [], egg: [], machine: [] }
            if (f.src === 'levelMoves') row[f.name] = (pm.level || []).map((m) => `Lv${m.level} ${nameZhOf(m.name)}`).join(', ')
            else if (f.src === 'machineMoves') row[f.name] = (pm.machine || []).map(nameZhOf).join(', ')
            else if (f.src === 'eggMoves') row[f.name] = (pm.egg || []).map(nameZhOf).join(', ')
            else row[f.name] = ''
          } else {
            row[f.name] = cellValue(p, f, t)
          }
        }
        ws.addRow(row)
        n2++
      }
      console.log(`  导出「${t.sheet}」: ${n2} 行`)
      totalRows += n2
      tableCount++
      continue
    }

    const mod = await loadTS(t.file)
    const data = mod[t.constName]
    if (!data) throw new Error(`在 ${t.file} 找不到导出常量 ${t.constName}`)
    const ws = wb.addWorksheet(t.sheet)

    // 矩阵型（防御矩阵）：首列为攻击属性，其余列为各防御属性倍率
    if (t.kind === 'matrix') {
      ws.columns = [
        { header: t.matrixKeyHeader, key: t.matrixKeyHeader, width: 14 },
        ...t.matrixKeys.map((k) => ({ header: k, key: k, width: 8 })),
      ]
      let n = 0
      for (const [atk, defMap] of Object.entries(data)) {
        const row = { [t.matrixKeyHeader]: atk }
        for (const k of t.matrixKeys) row[k] = defMap[k]
        ws.addRow(row)
        n++
      }
      console.log(`  导出「${t.sheet}」: ${n} 行`)
      totalRows += n
      tableCount++
      continue
    }

    ws.columns = t.fields.map((f) => ({ header: f.name, key: f.name, width: colWidth(f) }))
    let rows
    if (t.kind === 'record') {
      rows = Object.entries(data).map(([k, v]) => {
        const o = { ...v }
        const idf = t.fields.find((f) => f.kind === 'id')
        if (idf) o[idf.src] = k
        return o
      })
    } else {
      rows = data
    }
    let n = 0
    for (const obj of rows) {
      const row = {}
      for (const f of t.fields) row[f.name] = cellValue(obj, f, t)
      ws.addRow(row)
      n++
    }
    console.log(`  导出「${t.sheet}」: ${n} 行`)
    totalRows += n
    tableCount++
  }
  mkdirSync(dirname(target), { recursive: true })
  try {
    await wb.xlsx.writeFile(target)
  } catch (e) {
    if (e && (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES')) {
      console.error(
        `\n[错误] 无法写入 ${target}\n` +
          `        该文件似乎正被 Excel 打开（被占用锁）。\n` +
          `        请先关闭 Excel 中该文件，再重新运行导出。\n`,
      )
      process.exit(1)
    }
    throw e
  }
  const ms = (performance.now() - t0).toFixed(0)
  console.log(`✅ 已生成: ${target}`)
  console.log(`   共 ${tableCount} 张表 / ${totalRows} 行 / 耗时 ${ms}ms`)
}

// ===== 导入：xlsx -> TS =====

/** 复合表（宝可梦）导入：一行拆成 POKEMON_DB + POKEMON_MOVES，写回两个文件 */
async function importComposite(t, ws, dryRun) {
  const rowsData = readRows(ws, t)
  const moveDb = (await loadTS(t.movesFile)).MOVE_DB || {}
  const nameKeyMap = {}
  for (const [k, v] of Object.entries(moveDb)) {
    if (v && v.nameZh) nameKeyMap[v.nameZh] = k
  }
  const pokemonFields = t.fields.filter((f) => f.from !== 'moves')
  const pokemonObjs = []
  const movesMap = {}
  for (const o of rowsData) {
    const poke = {}
    for (const f of pokemonFields) {
      if (f.kind === 'stats') continue
      if (f.kind === 'id') {
        poke.id = parseCell(o[f.name], f)
        continue
      }
      poke[f.src] = parseCell(o[f.name], f)
    }
    poke.stats = pokemonFields
      .filter((f) => f.kind === 'stats')
      .map((f) => ({ key: f.statKey, nameZh: f.name, value: Number(o[f.name]) || 0 }))
    pokemonObjs.push(poke)
    const id = poke.id
    const level = parseLevelMoves(o['升级技能'], nameKeyMap)
    const machine = parseNameList(o['机器技能'], nameKeyMap)
    const egg = parseNameList(o['遗传技能'], nameKeyMap)
    movesMap[id] = { level, egg, machine }
  }
  if (dryRun) {
    console.log(`  [dry-run] 将写回 ${t.file} (${pokemonObjs.length} 只) 与 ${t.movesFile}`)
    return
  }
  // 写回 pokemon-db.ts
  const pokemonOut = serializePokemon(pokemonObjs.map((o) => ({ obj: o })))
  copyFileSync(t.file, t.file + '.bak')
  writeFileSync(t.file, pokemonOut, 'utf8')
  console.log(`  ✅ 写回 ${t.file} (${pokemonObjs.length} 只)`)
  // 写回 pokemon-moves.ts（保留 MOVE_DB 原样）
  const movesOrig = await loadTS(t.movesFile)
  const movesOut = serializeMovesFromPokemon(movesMap, movesOrig.MOVE_DB || {})
  copyFileSync(t.movesFile, t.movesFile + '.bak')
  writeFileSync(t.movesFile, movesOut, 'utf8')
  console.log(`  ✅ 写回 ${t.movesFile}`)
}

async function doImport(target, dryRun) {
  const t0 = performance.now()
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.readFile(target)
  } catch (e) {
    if (e && (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES')) {
      console.error(
        `\n[错误] 无法读取 ${target}\n` +
          `        该文件似乎正被 Excel 打开（被占用锁）。\n` +
          `        请先关闭 Excel 中该文件，再重新运行导入。\n`,
      )
      process.exit(1)
    }
    throw e
  }

  // 复合表（如宝可梦）单独处理；其余按文件分组整体写回
  const genericFiles = new Map()
  let tableCount = 0
  let totalRows = 0
  for (const t of TABLES) {
    const ws = wb.getWorksheet(t.sheet)
    if (!ws) {
      console.warn(`  ⚠ 跳过「${t.sheet}」（xlsx 无该 sheet）`)
      continue
    }
    if (t.composite) {
      tableCount++
      totalRows += Math.max(0, ws.rowCount - 1)
      await importComposite(t, ws, dryRun)
      continue
    }
    // 字符串矩阵（图鉴描述）列（各版本）在导入时按 Sheet 表头识别
    if (t.kind === 'matrix' && !t.matrixKeys) {
      const hr = ws.getRow(1)
      const keys = []
      hr.eachCell((cell, col) => {
        if (col > 1) keys.push(cell.value)
      })
      t.matrixKeys = keys
    }
    if (!genericFiles.has(t.file)) genericFiles.set(t.file, [])
    genericFiles.get(t.file).push({ t, ws })
    tableCount++
    totalRows += Math.max(0, ws.rowCount - 1)
  }

  for (const [file, items] of genericFiles) {
    const rawSrc = readFileSync(file, 'utf8')
    const rebuiltMap = {}
    for (const { t, ws } of items) {
      const rowsData = readRows(ws, t)
      const rebuilt = rowsData.map((r) => rebuildObject(t, r))
      rebuiltMap[t.constName] = rebuilt
      console.log(`  读取「${t.sheet}」: ${rebuilt.length} 行`)
    }
    if (Object.keys(rebuiltMap).length === 0) continue
    if (dryRun) {
      const consts = Object.keys(rebuiltMap).join(', ')
      console.log(`  [dry-run] 将写回 ${file}（${consts}）`)
      continue
    }
    const original = await loadTS(file)
    const out = serializeFile(
      file,
      items.map((i) => i.t),
      rebuiltMap,
      original,
      rawSrc,
    )
    copyFileSync(file, file + '.bak')
    writeFileSync(file, out, 'utf8')
    console.log(`  ✅ 写回 ${file}`)
  }

  const ms = (performance.now() - t0).toFixed(0)
  if (warnCount > 0) {
    console.log(`\n⚠ 共 ${warnCount} 条警告（详见上方 ⚠ 标记）`)
  }
  if (dryRun) {
    console.log(
      `✅ dry-run 完成：${tableCount} 张表 / ${totalRows} 行 / 耗时 ${ms}ms（未写回任何文件）`,
    )
  } else {
    console.log(
      `✅ 导入完成：${tableCount} 张表 / ${totalRows} 行 / 耗时 ${ms}ms（原文件已备份为 .bak）`,
    )
  }
}

// ===== CLI 入口 =====
const cmd = process.argv[2]
const rest = process.argv.slice(3)
const dryRun = rest.includes('--dry-run')
const pathArg = rest.find((a) => !a.startsWith('--'))
const target = resolve(process.cwd(), pathArg || OUT_XLSX)

if (cmd === 'export') {
  doExport(target).catch((e) => {
    console.error(e)
    process.exit(1)
  })
} else if (cmd === 'import') {
  doImport(target, dryRun).catch((e) => {
    console.error(e)
    process.exit(1)
  })
} else {
  console.log('用法:')
  console.log('  node scripts/data-excel.mjs export [path]               # TS -> xlsx')
  console.log('  node scripts/data-excel.mjs import [path] [--dry-run]   # xlsx -> TS')
  process.exit(1)
}
