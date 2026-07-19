/**
 * 从 pokemon-dataset-zh-main 转换特性「介绍 / 效果」中文数据
 * ---------------------------------------------------------------
 * 读取外部数据集 data/abilities/*.json 中的 introduction（介绍）、
 * effect（效果/技能介绍），映射到当前项目的 ABILITY_DB 英文 key
 * （kebab-case 的英文名）后，写入
 * src/data/abilities/pokemon-ability-descriptions.ts。
 *
 * 运行：node scripts/build-ability-descriptions-from-dataset.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATASET_DIR = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/abilities'
const ABILITY_DB_TS = resolve(__dirname, '../src/data/abilities/pokemon-abilities.ts')
const OUT = resolve(__dirname, '../src/data/abilities/pokemon-ability-descriptions.ts')

/** 英文名 -> kebab-case key（与 ABILITY_DB 的 key 规则一致） */
function kebab(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// 直接从 ABILITY_DB 提取合法 key，保证对齐（避免出现 ABILITY_DB 里没有的条目）
function loadDbKeys() {
  const raw = readFileSync(ABILITY_DB_TS, 'utf-8')
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
  const files = readdirSync(DATASET_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()

  const out = []
  let matched = 0
  let total = 0

  for (const file of files) {
    let data
    try {
      data = JSON.parse(readFileSync(resolve(DATASET_DIR, file), 'utf-8'))
    } catch (e) {
      console.warn(`跳过解析失败文件: ${file}`, e.message)
      continue
    }

    const key = kebab(data.name_en)
    if (!dbKeys.has(key)) continue

    matched++
    const intro = (data.introduction || '').trim()
    const effect = (data.effect || '').trim()

    if (!intro && !effect) continue

    total++
    out.push(`  "${key}": {`)
    if (intro) out.push(`    intro: "${escapeText(intro)}",`)
    if (effect) out.push(`    effect: "${escapeText(effect)}",`)
    out.push(`  },`)
  }

  const content = `// ============================================================================
// 特性「介绍 / 效果」中文数据 — 由 scripts/build-ability-descriptions-from-dataset.mjs 自动生成
// 数据来源：pokemon-dataset-zh-main（data/abilities/*.json 的 introduction/effect）
// 运行：node scripts/build-ability-descriptions-from-dataset.mjs
// key 与 src/data/abilities/pokemon-abilities.ts 的 ABILITY_DB 完全一致
// ============================================================================

/** 单条特性的介绍与效果信息 */
export interface AbilityDesc {
  /** 介绍（如「比较对手的防御和特防，根据较低的那项能力相应地提高自己的攻击或特攻。」） */
  intro?: string
  /** 效果（详细机制说明，含换行） */
  effect?: string
}

/**
 * 特性介绍与效果数据集。键为特性英文名（与 ABILITY_DB 同 key）。
 */
export const ABILITY_DESCRIPTIONS: Record<string, AbilityDesc> = {
${out.join('\n')}
}
`

  writeFileSync(OUT, content, 'utf-8')
  console.log(`已生成 ${OUT}`)
  console.log(`  - 外部 ability 文件匹配数: ${matched}`)
  console.log(`  - 有效（含非空字段）条目: ${total}`)
}

build()
