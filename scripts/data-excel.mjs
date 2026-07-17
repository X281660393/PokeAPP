/**
 * 数据 Excel 双向转换工具
 * ---------------------------------------------------------------
 * 把 App 内的静态数据表导出成 Excel（每个表一个 Sheet），方便在 Excel 里
 * 批量修改中文名/描述/属性等；改完再导回成对应的 TS 格式，App 直接可用。
 *
 * 运行：
 *   node scripts/data-excel.mjs export   # TS -> data-excel/宝可梦小图鉴_数据.xlsx
 *   node scripts/data-excel.mjs import   # xlsx -> TS（覆盖前自动 .bak 备份）
 *
 * 解析 TS：用 esbuild 把数据文件转成 ESM 后动态 import（自动剥离 import type / 类型声明）。
 * 安全：含多个导出的文件（如招式表 MOVE_DB + POKEMON_MOVES），只重建被编辑的常量，
 *       其余导出原样保留，不会误删数据。导入前对每个目标文件做 .bak 备份。
 */
import * as esbuild from 'esbuild'
import ExcelJS from 'exceljs'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { TABLES, OUT_XLSX, ALL_TYPES } from './excel-config.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 把 TS 数据文件转译后动态 import，返回其中的导出对象 */
async function loadTS(file) {
  const src = readFileSync(file, 'utf8')
  const out = await esbuild.transform(src, { loader: 'ts', format: 'esm' })
  const tmp = resolve(
    os.tmpdir(),
    `poke_excel_${Date.now()}_${Math.random().toString(36).slice(2)}.mjs`,
  )
  writeFileSync(tmp, out.code)
  try {
    const mod = await import('file://' + tmp)
    return mod
  } finally {
    setTimeout(() => {
      try {
        unlinkSync(tmp)
      } catch {
        /* Windows 下可能短暂占用，忽略 */
      }
    }, 500)
  }
}

/** 对象字段 -> Excel 单元格值 */
function cellValue(obj, f) {
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

/** ===== 导出 TS -> xlsx ===== */
async function doExport() {
  const wb = new ExcelJS.Workbook()
  for (const t of TABLES) {
    // 复合表优先：一行同时来自多文件，自行加载并建工作表后跳过通用流程
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
            row[f.name] = cellValue(p, f)
          }
        }
        ws.addRow(row)
        n2++
      }
      console.log(`  导出「${t.sheet}」: ${n2} 行`)
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
      for (const f of t.fields) row[f.name] = cellValue(obj, f)
      ws.addRow(row)
      n++
    }
    console.log(`  导出「${t.sheet}」: ${n} 行`)
  }
  mkdirSync(dirname(OUT_XLSX), { recursive: true })
  const target = resolve(process.cwd(), process.argv[3] || OUT_XLSX)
  try {
    await wb.xlsx.writeFile(target)
  } catch (e) {
    if (e && e.code === 'EBUSY') {
      console.error(
        `\n[错误] 无法写入 ${target}\n` +
          `        该文件似乎正被 Excel 打开（被占用锁）。\n` +
          `        请先关闭 Excel 中该文件，再重新运行导出。\n`,
      )
      process.exit(1)
    }
    throw e
  }
  console.log(`✅ 已生成: ${target}`)
}

/** 把值序列化成语义正确的 TS 字面量 */
function lit(v) {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0'
  if (Array.isArray(v)) return '[' + v.map((x) => lit(x)).join(', ') + ']'
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'object') {
    const inner = Object.entries(v)
      .map(([k, val]) => `  ${k}: ${lit(val)}`)
      .join(',\n')
    return `{\n${inner}\n}`
  }
  return JSON.stringify(v)
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

/** 把一行 Excel 数据还原成对象（record 返回 {key, obj}，数组返回 {key:null, obj}） */
function rebuildObject(t, row) {
  // 矩阵型（防御矩阵）：首列=攻击属性，其余列=防御属性->倍率
  if (t.kind === 'matrix') {
    const key = String(row[t.matrixKeyHeader]).trim()
    const obj = {}
    for (const k of t.matrixKeys) {
      const v = row[k]
      obj[k] = typeof v === 'number' ? v : Number(v) || 0
    }
    return { key, obj }
  }
  if (t.kind === 'record') {
    const obj = {}
    let key = ''
    for (const f of t.fields) {
      if (f.kind === 'id') {
        key = parseCell(row[f.name], f)
        continue
      }
      if (f.kind === 'stats') continue
      obj[f.src] = parseCell(row[f.name], f)
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
  for (const { obj } of rebuilt) lines.push(`  ${lit(obj)},`)
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
  for (const { key, obj } of rebuilt) lines.push(`  ${JSON.stringify(key)}: ${lit(obj)},`)
  lines.push('}')
  lines.push('')
  lines.push('export const POKEMON_MOVES: Record<number, PokemonMoves> = {')
  for (const [k, v] of Object.entries(original.POKEMON_MOVES || {})) {
    lines.push(`  ${k}: ${lit(v)},`)
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
  for (const { key, obj } of rebuilt) lines.push(`  ${JSON.stringify(key)}: ${lit(obj)},`)
  lines.push('}')
  lines.push('')
  return lines.join('\n')
}

/** 工具表 tools.ts：多个导出整体重建（TOOLS/TOOL_MAP/类型相克/防御矩阵/顺序），并保留末尾工具函数 */
function serializeTools(tables, rebuiltMap, original) {
  const src = readFileSync(tables[0].file, 'utf8')

  // 小工具
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
  for (const obj of tools) lines.push(`  ${lit(obj)},`)
  lines.push(']')
  lines.push('')
  lines.push('export const TOOL_MAP: Record<string, ToolItem> = Object.fromEntries(')
  lines.push('  TOOLS.map((t) => [t.id, t]),')
  lines.push(')')
  lines.push('')
  lines.push('export const TYPE_MATCHUP_DATA: Record<string, TypeMatchup> = {')
  for (const k of Object.keys(tum)) lines.push(`  ${JSON.stringify(k)}: ${lit(tum[k])},`)
  lines.push('}')
  lines.push('')
  lines.push('export const DEFENSE_MATRIX: Record<string, Record<string, number>> = {')
  for (const k of Object.keys(dm)) lines.push(`  ${JSON.stringify(k)}: ${lit(dm[k])},`)
  lines.push('}')
  lines.push('')
  lines.push(`export const CHART_ORDER = ${lit(chartOrder)} as const`)
  lines.push(fns)
  lines.push('')
  return lines.join('\n')
}

/** 按文件统一序列化（同一文件可能含多个导出，如 tools.ts） */
function serializeFile(file, tables, rebuiltMap, original) {
  if (file.endsWith('pokemon-db.ts')) return serializePokemon(rebuiltMap['POKEMON_DB'])
  if (file.endsWith('pokemon-moves.ts')) return serializeMoves(rebuiltMap['MOVE_DB'], original)
  if (file.endsWith('tools.ts')) return serializeTools(tables, rebuiltMap, original)
  return serializeSingle(tables[0], rebuiltMap[tables[0].constName])
}

/** 读取一个 Sheet 的所有数据行（跳过表头），返回行对象数组 */
function readRows(ws, t) {
  const rowsData = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // 跳过表头
    const rowObj = {}
    if (t.kind === 'matrix') {
      rowObj[t.matrixKeyHeader] = row.getCell(1).value
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
        console.warn(`    ⚠ 升级技能格式无法解析：「${s}」`)
        return null
      }
      const level = Number(m[1])
      const nameZh = m[2].trim()
      const key = nameKeyMap[nameZh]
      if (!key) {
        console.warn(`    ⚠ 升级技能找不到招式「${nameZh}」`)
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
        console.warn(`    ⚠ 技能找不到招式「${name}」`)
        return null
      }
      return key
    })
    .filter(Boolean)
}

/** 复合表（宝可梦）导入：一行拆成 POKEMON_DB + POKEMON_MOVES，写回两个文件 */
async function importComposite(t, ws) {
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

/** 由「编号 -> 技能」映射重建 pokemon-moves.ts 的 POKEMON_MOVES（MOVE_DB 原样保留） */
function serializeMovesFromPokemon(movesMap, moveDB) {
  const lines = []
  lines.push('// 此文件由 scripts/data-excel.mjs 从 Excel 导回生成（POKEMON_MOVES 由宝可梦表更新，MOVE_DB 原样保留）。')
  lines.push("import type { MoveInfo, PokemonMoves } from '@/types'")
  lines.push('')
  lines.push('export const MOVE_DB: Record<string, MoveInfo> = {')
  for (const [k, v] of Object.entries(moveDB)) lines.push(`  ${JSON.stringify(k)}: ${lit(v)},`)
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

/** ===== 导入 xlsx -> TS ===== */
async function doImport() {
  const wb = new ExcelJS.Workbook()
  const target = resolve(process.cwd(), process.argv[3] || OUT_XLSX)
  await wb.xlsx.readFile(target)

  // 复合表（如宝可梦）单独处理；其余按文件分组整体写回
  const genericFiles = new Map()
  for (const t of TABLES) {
    const ws = wb.getWorksheet(t.sheet)
    if (!ws) {
      console.warn(`  ⚠ 跳过「${t.sheet}」（xlsx 无该 sheet）`)
      continue
    }
    if (t.composite) {
      await importComposite(t, ws)
      continue
    }
    if (!genericFiles.has(t.file)) genericFiles.set(t.file, [])
    genericFiles.get(t.file).push({ t, ws })
  }

  for (const [file, items] of genericFiles) {
    const rebuiltMap = {}
    for (const { t, ws } of items) {
      const rowsData = readRows(ws, t)
      const rebuilt = rowsData.map((r) => rebuildObject(t, r))
      rebuiltMap[t.constName] = rebuilt
      console.log(`  读取「${t.sheet}」: ${rebuilt.length} 行`)
    }
    if (Object.keys(rebuiltMap).length === 0) continue
    const original = await loadTS(file)
    const out = serializeFile(
      file,
      items.map((i) => i.t),
      rebuiltMap,
      original,
    )
    copyFileSync(file, file + '.bak')
    writeFileSync(file, out, 'utf8')
    console.log(`  ✅ 写回 ${file}`)
  }
  console.log('✅ 导入完成（原文件已备份为 .bak，可随时还原）')
}

const cmd = process.argv[2]
if (cmd === 'export') {
  doExport().catch((e) => {
    console.error(e)
    process.exit(1)
  })
} else if (cmd === 'import') {
  doImport().catch((e) => {
    console.error(e)
    process.exit(1)
  })
} else {
  console.log('用法: node scripts/data-excel.mjs <export|import>')
  process.exit(1)
}
