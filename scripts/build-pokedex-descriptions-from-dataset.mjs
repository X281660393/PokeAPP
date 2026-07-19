/**
 * 从 pokemon-dataset-zh-main 转换各版本图鉴介绍
 * ---------------------------------------------------------------
 * 读取外部数据集 data/pokemon/*.json 中的 pokedex_entries，
 * 映射为当前项目格式后写入 src/data/pokemon/pokedex-descriptions.ts。
 * 输出包含中文图鉴文字，并补全晶灿钻石/明亮珍珠等版本。
 *
 * 运行：node scripts/build-pokedex-descriptions-from-dataset.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATASET_DIR = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/pokemon'
const OUT = resolve(__dirname, '../src/data/pokemon/pokedex-descriptions.ts')

// 中文版本名 -> 项目使用的英文 key
const VERSION_NAME_MAP = {
  '红': 'red',
  '绿': 'green',
  '蓝': 'blue',
  '皮卡丘': 'yellow',       // 第一世代黄版在中文数据集里叫"皮卡丘"
  '金': 'gold',
  '银': 'silver',
  '水晶版': 'crystal',      // 数据集里叫"水晶版"
  '水晶': 'crystal',
  '红宝石': 'ruby',
  '蓝宝石': 'sapphire',
  '绿宝石': 'emerald',
  '火红': 'firered',
  '叶绿': 'leafgreen',
  '钻石': 'diamond',
  '珍珠': 'pearl',
  '白金': 'platinum',
  '心金': 'heartgold',
  '魂银': 'soulsilver',
  '黑': 'black',
  '白': 'white',
  '黑2': 'black-2',
  '白2': 'white-2',
  'Ｘ': 'x',                // 全角 X
  'X': 'x',
  'x': 'x',
  'Ｙ': 'y',                // 全角 Y
  'Y': 'y',
  'y': 'y',
  '欧米伽红宝石': 'omega-ruby',
  '欧米加红宝石': 'omega-ruby',
  '阿尔法蓝宝石': 'alpha-sapphire',
  '阿爾法藍寶石': 'alpha-sapphire',
  '太阳': 'sun',
  '月亮': 'moon',
  '究极太阳': 'ultra-sun',
  '究極太陽': 'ultra-sun',
  '究极月亮': 'ultra-moon',
  '究極月亮': 'ultra-moon',
  'Let\'s Go! 皮卡丘': 'lets-go-pikachu',
  'Let\'s Go! 伊布': 'lets-go-eevee',
  '剑': 'sword',
  '盾': 'shield',
  '晶灿钻石': 'brilliant-diamond',
  '璀璨钻石': 'brilliant-diamond',
  '明亮珍珠': 'shining-pearl',
  '朱': 'scarlet',
  '紫': 'violet',
  '传说 阿尔宙斯': 'legends-arceus',
  '傳說 阿爾宙斯': 'legends-arceus',
  '传说 Z-A': 'legends-z-a',
  '傳說 Z-A': 'legends-z-a',
}

function normalizeName(name) {
  return (name || '').replace(/[\s]/g, ' ').trim()
}

function keyOf(name) {
  const n = normalizeName(name)
  return VERSION_NAME_MAP[n] || n.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

function escapeText(text) {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
}

function build() {
  const files = readdirSync(DATASET_DIR)
    .filter((f) => /^\d{4}-.*\.json$/.test(f))
    .sort()

  const out = []
  let total = 0

  for (const file of files) {
    const raw = readFileSync(resolve(DATASET_DIR, file), 'utf-8')
    let data
    try {
      data = JSON.parse(raw)
    } catch (e) {
      console.warn(`跳过解析失败文件: ${file}`, e.message)
      continue
    }

    const id = Number(data.pokedex_id)
    if (!id) continue

    const entries = []
    const seen = new Set()

    for (const gen of data.pokedex_entries || []) {
      for (const v of gen.versions || []) {
        const key = keyOf(v.name)
        if (seen.has(key)) continue
        seen.add(key)
        entries.push({ key, description: v.text || '' })
      }
    }

    if (!entries.length) continue

    total += entries.length
    out.push(`  ${id}: [`)
    for (const e of entries) {
      out.push(`    { key: "${e.key}", description: "${escapeText(e.description)}" },`)
    }
    out.push(`  ],`)
  }

  const content = `// ============================================================================
// 宝可梦图鉴介绍（各版本图鉴文字）— 由 scripts/build-pokedex-descriptions-from-dataset.mjs 自动生成
// 数据来源：pokemon-dataset-zh-main（中文各版本图鉴文字）
// 运行：node scripts/build-pokedex-descriptions-from-dataset.mjs
// ============================================================================

/** 单条版本图鉴介绍 */
export interface PokedexDescEntry {
  /** 游戏版本 key（对应 PokemonDetail.vue 的 DESC_VERSION_META） */
  key: string
  /** 该版本的图鉴介绍文字 */
  description: string
}

/** 某只宝可梦的全部版本图鉴介绍 */
export type PokemonPokedexDesc = PokedexDescEntry[]

/**
 * 图鉴介绍数据集。键为宝可梦全国图鉴编号，值为该宝可梦在各版本中的介绍数组。
 */
export const POKEDEX_DESCRIPTIONS: Record<number, PokemonPokedexDesc> = {
${out.join('\n')}
}

/** 获取某只宝可梦的全部图鉴介绍 */
export function getPokedexDescriptions(id: number): PokemonPokedexDesc {
  return POKEDEX_DESCRIPTIONS[id] || []
}

/** 某只宝可梦是否存在图鉴介绍 */
export function hasPokedexDescriptions(id: number): boolean {
  return !!POKEDEX_DESCRIPTIONS[id]?.length
}
`

  writeFileSync(OUT, content, 'utf-8')
  console.log(`已生成 ${OUT}`)
  console.log(`  - 宝可梦数量: ${files.length}`)
  console.log(`  - 有效条目: ${total}`)
}

build()
