/**
 * add-effectzh.mjs —— 给 天气/场地/异常/特性/道具 五类数据注入 effectzh 字段
 * -----------------------------------------------------------------
 * 数据来源：
 *   - 天气/场地/异常：同名 .bak 备份（之前手工加过，被一次无该列的 round-trip 丢掉）
 *   - 特性：pokemon-dataset-zh/data/abilities/*.json 的 effect 字段（机械化效果文本，含换行）
 *   - 道具：item_list.json 无独立 effect 字段，暂留空（字段/配置就绪，后续可在 Excel 填）
 *
 * 序列化严格沿用现有 data-excel 生成的 2 空格格式：
 *   export const X: Record<string, T> = {
 *     "key": {
 *     field: value,
 *     effectzh: "...",
 *   },
 * 字段顺序保持原样，effectzh 插在 descZh 之后。
 */
import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATASET = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data'

// ===== 加载 TS（esbuild transform -> 临时 mjs -> import） =====
async function loadTS(file) {
  const src = readFileSync(file, 'utf8')
  const out = await esbuild.transform(src, { loader: 'ts', format: 'esm' })
  const tmp = resolve(
    __dirname,
    `poke_eff_${Date.now()}_${Math.random().toString(36).slice(2)}.mjs`,
  )
  writeFileSync(tmp, out.code)
  try {
    return await import('file://' + tmp)
  } finally {
    setTimeout(() => {
      try {
        unlinkSync(tmp)
      } catch {
        /* ignore */
      }
    }, 500)
  }
}

// ===== 值序列化（与现有文件一致） =====
function litVal(v) {
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]'
    return '[' + v.map((x) => JSON.stringify(x)).join(', ') + ']'
  }
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  return JSON.stringify(v)
}

// ===== DB 序列化（2 空格格式，注入 effectzh） =====
function serializeDB(constName, typeName, db, effectMap) {
  const lines = []
  lines.push('// 此文件由 scripts/data-excel.mjs 从 Excel 导回生成。')
  lines.push(`import type { ${typeName} } from '@/types'`)
  lines.push('')
  lines.push(`export const ${constName}: Record<string, ${typeName}> = {`)
  let injected = 0
  for (const [key, obj] of Object.entries(db)) {
    const fieldLines = []
    for (const [fk, fv] of Object.entries(obj)) {
      fieldLines.push(`  ${fk}: ${litVal(fv)},`)
    }
    const eff = effectMap[key]
    if (eff != null && eff !== '') {
      const idx = fieldLines.findIndex((l) => l.startsWith('  descZh:'))
      const effLine = `  effectzh: ${litVal(eff)},`
      if (idx >= 0) fieldLines.splice(idx + 1, 0, effLine)
      else fieldLines.push(effLine)
      injected++
    }
    lines.push(`  ${JSON.stringify(key)}: {`)
    lines.push(fieldLines.join('\n'))
    lines.push('  },')
  }
  lines.push('}')
  lines.push('')
  return { text: lines.join('\n'), injected }
}

// ===== slug：英文名 -> 与 ABILITY_DB key 一致的格式 =====
function slug(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const results = []

  // ---------- 1. 天气/场地/异常：从 .bak 恢复 effectzh ----------
  for (const [file, constName, typeName] of [
    ['src/data/battle/pokemon-weather.ts', 'WEATHER_DB', 'WeatherInfo'],
    ['src/data/battle/pokemon-terrain.ts', 'TERRAIN_DB', 'TerrainInfo'],
    ['src/data/battle/pokemon-status.ts', 'STATUS_DB', 'StatusInfo'],
  ]) {
    const curPath = resolve(ROOT, file)
    const bakPath = curPath + '.bak'
    const cur = await loadTS(curPath)
    const db = cur[constName] || {}
    const effectMap = {}
    try {
      const bak = await loadTS(bakPath)
      const bakDb = bak[constName] || {}
      for (const [k, v] of Object.entries(bakDb)) {
        if (v && v.effectzh) effectMap[k] = v.effectzh
      }
    } catch (e) {
      console.warn(`  ⚠ 读取 ${bakPath} 失败：${e.message}`)
    }
    const { text, injected } = serializeDB(constName, typeName, db, effectMap)
    writeFileSync(curPath, text)
    results.push(
      `${constName}: ${Object.keys(db).length} 条，注入 effectzh ${injected} 条`,
    )
  }

  // ---------- 2. 特性：从 data/abilities/*.json 的 effect 字段 ----------
  {
    const file = 'src/data/abilities/pokemon-abilities.ts'
    const constName = 'ABILITY_DB'
    const typeName = 'AbilityInfo'
    const curPath = resolve(ROOT, file)
    const cur = await loadTS(curPath)
    const db = cur[constName] || {}

    // 构建 effect 映射：slug(name_en) -> effect，以及 name_zh -> effect（双保险）
    const enMap = {}
    const zhMap = {}
    const dir = resolve(DATASET, 'abilities')
    for (const fn of readdirSync(dir)) {
      if (!fn.endsWith('.json')) continue
      try {
        const j = JSON.parse(readFileSync(resolve(dir, fn), 'utf8'))
        if (j.name_en) enMap[slug(j.name_en)] = j.effect || ''
        if (j.name_zh) zhMap[j.name_zh] = j.effect || ''
      } catch {
        /* 跳过坏文件 */
      }
    }

    const effectMap = {}
    let matched = 0
    for (const [k, v] of Object.entries(db)) {
      const eff = enMap[k] || (v && zhMap[v.nameZh]) || ''
      if (eff) {
        effectMap[k] = eff
        matched++
      }
    }
    const { text, injected } = serializeDB(constName, typeName, db, effectMap)
    writeFileSync(curPath, text)
    results.push(
      `${constName}: ${Object.keys(db).length} 条，匹配 effect ${matched} 条，注入 ${injected} 条`,
    )
  }

  // ---------- 3. 道具：无独立 effect 数据源，仅保证字段/配置就绪（不写空字段） ----------
  {
    const file = 'src/data/items/pokemon-items.ts'
    const constName = 'ITEM_DB'
    const curPath = resolve(ROOT, file)
    const cur = await loadTS(curPath)
    const db = cur[constName] || {}
    results.push(
      `${constName}: ${Object.keys(db).length} 条，道具无 effect 数据源，effectzh 留空（后续可在 Excel 填写）`,
    )
  }

  console.log('\n===== add-effectzh 完成 =====')
  for (const r of results) console.log('  ' + r)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
