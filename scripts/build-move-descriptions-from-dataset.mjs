/**
 * 从 pokemon-dataset-zh-main 转换招式「介绍 / 技能效果」中文数据
 * ---------------------------------------------------------------
 * 读取外部数据集 data/moves/*.json 中的 description（描述）、intro（介绍）、
 * effect（技能效果）、additional_effect（附加效果）、range（攻击范围），映射到当前项目的
 * MOVE_DB 英文 key（kebab-case 的英文名）后，写入
 * src/data/moves/pokemon-move-descriptions.ts。
 *
 * 运行：node scripts/build-move-descriptions-from-dataset.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATASET_DIR = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/moves'
const MOVE_LIST_JSON = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/move_list.json'
const MOVE_DB_TS = resolve(__dirname, '../src/data/moves/pokemon-moves.ts')
const OUT = resolve(__dirname, '../src/data/moves/pokemon-move-descriptions.ts')

/** 英文名 -> kebab-case key（与 MOVE_DB 的 key 规则一致） */
function kebab(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// 个别外部数据集英文名与本项目 key 的偏差修正
const KEY_ALIASES = {
  'vise-grip': 'vice-grip',
  struggle: 'struggle-bug',
}

// 直接从 MOVE_DB 提取合法 key，保证对齐（避免出现 MOVE_DB 里没有的条目）
function loadDbKeys() {
  const raw = readFileSync(MOVE_DB_TS, 'utf-8')
  const keys = new Set()
  for (const m of raw.matchAll(/"([a-z0-9-]+)":\s*\{/g)) keys.add(m[1])
  return keys
}

function escapeText(text) {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
}

function build() {
  const dbKeys = loadDbKeys()

  /** @type {Record<string, MoveDesc>} */
  const map = {}

  // 1) 优先从 data/moves/*.json 读取完整字段（description / intro / effect / ...）
  const files = readdirSync(DATASET_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()

  let detailMatched = 0
  let detailTotal = 0

  for (const file of files) {
    let data
    try {
      data = JSON.parse(readFileSync(resolve(DATASET_DIR, file), 'utf-8'))
    } catch (e) {
      console.warn(`跳过解析失败文件: ${file}`, e.message)
      continue
    }

    let key = kebab(data.name_en)
    if (KEY_ALIASES[key]) key = KEY_ALIASES[key]
    if (!dbKeys.has(key)) continue

    detailMatched++
    const description = (data.description || '').trim()
    const intro = (data.intro || '').trim()
    const effect = Array.isArray(data.effect) ? data.effect.map((s) => String(s).trim()).filter(Boolean) : []
    const additionalEffect = (data.additional_effect || '').trim()
    const range = (data.range || '').trim()

    if (!description && !intro && !effect.length && !additionalEffect && !range) continue

    detailTotal++
    map[key] = {
      ...(description ? { description } : {}),
      ...(intro ? { intro } : {}),
      ...(effect.length ? { effect } : {}),
      ...(additionalEffect ? { additionalEffect } : {}),
      ...(range ? { range } : {}),
    }
  }

  // 2) 用 move_list.json 兜底补 description（很多招式只有汇总列表里有标准描述）
  let listTotal = 0
  let listAdded = 0
  try {
    const moveList = JSON.parse(readFileSync(MOVE_LIST_JSON, 'utf-8'))
    for (const item of moveList) {
      const description = (item.description || '').trim()
      if (!description) continue

      let key = kebab(item.name_en)
      if (KEY_ALIASES[key]) key = KEY_ALIASES[key]
      if (!dbKeys.has(key)) continue

      listTotal++
      if (map[key]) {
        if (!map[key].description) map[key].description = description
      } else {
        listAdded++
        map[key] = { description }
      }
    }
  } catch (e) {
    console.warn('读取 move_list.json 兜底失败:', e.message)
  }

  // 3) 按 key 排序写入
  const keys = Object.keys(map).sort((a, b) => a.localeCompare(b))
  const out = []
  for (const key of keys) {
    const desc = map[key]
    out.push(`  "${key}": {`)
    if (desc.description) out.push(`    description: "${escapeText(desc.description)}",`)
    if (desc.intro) out.push(`    intro: "${escapeText(desc.intro)}",`)
    if (desc.effect && desc.effect.length) {
      out.push(`    effect: [`)
      for (const e of desc.effect) out.push(`      "${escapeText(e)}",`)
      out.push(`    ],`)
    }
    if (desc.additionalEffect) out.push(`    additionalEffect: "${escapeText(desc.additionalEffect)}",`)
    if (desc.range) out.push(`    range: "${escapeText(desc.range)}",`)
    out.push(`  },`)
  }

  const content = `// ============================================================================
// 招式「介绍 / 技能效果」中文数据 — 由 scripts/build-move-descriptions-from-dataset.mjs 自动生成
// 数据来源：pokemon-dataset-zh-main（data/moves/*.json 的 description/intro/effect/additional_effect/range
//         + move_list.json 的 description 兜底补全）
// 运行：node scripts/build-move-descriptions-from-dataset.mjs
// key 与 src/data/moves/pokemon-moves.ts 的 MOVE_DB 完全一致
// ============================================================================

/** 单条招式的介绍与效果信息 */
export interface MoveDesc {
  /** 介绍（如「藤鞭是第一世代引入的草属性招式。」） */
  intro?: string
  /** 描述（游戏内标准说明，如「用藤蔓抽打对手进行攻击。」） */
  description?: string
  /** 技能效果（分项列表，如 接触类招式 / 受守住影响 …） */
  effect?: string[]
  /** 附加效果（如「攻击目标造成伤害。」） */
  additionalEffect?: string
  /** 攻击范围 */
  range?: string
}

/**
 * 招式介绍与效果数据集。键为招式英文名（与 MOVE_DB 同 key）。
 */
export const MOVE_DESCRIPTIONS: Record<string, MoveDesc> = {
${out.join('\n')}
}
`

  writeFileSync(OUT, content, 'utf-8')
  console.log(`已生成 ${OUT}`)
  console.log(`  - 外部 moves/*.json 匹配数: ${detailMatched}`)
  console.log(`  - 外部 moves/*.json 有效条目: ${detailTotal}`)
  console.log(`  - move_list.json 兜底可匹配: ${listTotal}`)
  console.log(`  - move_list.json 新增条目: ${listAdded}`)
  console.log(`  - 最终总条目: ${keys.length}`)
}

build()
