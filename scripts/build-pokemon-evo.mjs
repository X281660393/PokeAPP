// 生成 src/data/pokemon/pokemon-evo.ts
// 数据来源：PokeAPI（https://pokeapi.co）
// 为每只宝可梦抓取进化链（通过 species -> evolution_chain），
// 输出：EVO_ROOT（id -> 根形态 id）与 EVO_TREES（根id -> 进化树 EvoNode）
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const API = 'https://pokeapi.co/api/v2'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const idOf = (url) => parseInt(url.split('/').filter(Boolean).pop(), 10)

// 简单并发控制
async function mapPool(items, limit, fn) {
  const out = []
  let i = 0
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return out
}

let cacheCount = 0
const speciesCache = new Map()
async function getSpecies(id) {
  if (speciesCache.has(id)) return speciesCache.get(id)
  const r = await fetch(`${API}/pokemon-species/${id}`)
  const d = await r.json()
  speciesCache.set(id, d)
  cacheCount++
  if (cacheCount % 50 === 0) console.log('  fetched species', cacheCount)
  return d
}

const itemZhCache = new Map()
// 常见进化道具英文名 -> 中文兜底（API 无中文时也能显示中文）
const STONE_ZH = {
  'water-stone': '水之石',
  'thunder-stone': '雷之石',
  'fire-stone': '火之石',
  'leaf-stone': '叶之石',
  'moon-stone': '月之石',
  'sun-stone': '日之石',
  'dawn-stone': '觉醒之石',
  'dusk-stone': '夜之石',
  'shiny-stone': '光之石',
  'ice-stone': '冰之石',
  "king's-rock": '王之证',
  'metal-coat': '金属膜',
  'dragon-scale': '龙鳞',
  'electirizer': '电气场',
  'magmarizer': '熔岩场',
  'prism-scale': '光耀之鳞',
  'whipped-dream': '梦境之云',
  'sachet': '香袋',
  'reaper-cloth': '诅咒之布',
  ' protector': '保护装甲',
  'oval-stone': '圆石',
  'razor-claw': '锐利之爪',
  'razor-fang': '锐利之牙',
  'deep-sea-scale': '深海鳞片',
  'deep-sea-tooth': '深海之牙',
  'dubious-disc': '可疑光盘',
  'upgrade': '升级数据',
  'linking-cord': '连结绳',
  'peat-block': '泥炭块',
  'black-augurite': '黑色奇石',
  'auspicious-armor': '吉祥铠甲',
  'malicious-armor': '恶之铠甲',
  'galarica-cuff': '伽勒尔豆蔻手镯',
  'galarica-wreath': '伽勒尔豆蔻花环',
  'cracked-pot': '破损茶壶',
  'sweet-apple': '甜苹果',
  'tart-apple': '酸苹果',
  'adamant-crystal': '金刚宝珠',
  'rusty-sword': '锈蚀的剑',
  'rusted-sword': '碎裂的剑',
  'rusty-shield': '锈蚀的盾',
  'rusted-shield': '碎裂的盾',
}
async function getItemZh(nameEn) {
  if (itemZhCache.has(nameEn)) return itemZhCache.get(nameEn)
  let zh = STONE_ZH[nameEn] || nameEn
  try {
    const r = await fetch(`${API}/item/${nameEn}`)
    const d = await r.json()
    const apiZh = d.names?.find((n) => n.language.name === 'zh-Hans')?.name
    if (apiZh) zh = apiZh
  } catch { /* 使用兜底 */ }
  itemZhCache.set(nameEn, zh)
  return zh
}

async function methodOf(det) {
  if (!det) return ''
  const t = det.trigger?.name
  if (t === 'level-up') {
    if (det.min_level != null) return `Lv.${det.min_level}`
    if (det.item) return `使用${await getItemZh(det.item.name)}`
    if (det.time_of_day) return det.time_of_day === 'day' ? '白天' : det.time_of_day === 'night' ? '夜晚' : det.time_of_day
    if (det.known_move) return `学会招式`
    if (det.held_item) return `携带${await getItemZh(det.held_item.name)}`
    if (det.location) return '特定地点'
    return '满足条件'
  }
  if (t === 'use-item') return `使用${await getItemZh(det.item?.name || '道具')}`
  if (t === 'trade') return det.held_item ? `携带${await getItemZh(det.held_item.name)}交换` : '交换'
  if (t === 'shed') return '脱壳'
  if (t === 'spin') return '旋转'
  return '进化'
}

const chainCache = new Map()
async function getEvoTree(chainUrl) {
  if (chainCache.has(chainUrl)) return chainCache.get(chainUrl)
  const r = await fetch(chainUrl)
  const d = await r.json()
  // 解析进化树
  async function parse(node) {
    const id = idOf(node.species.url)
    const edge = node.evolution_details?.[0]
    const method = edge ? await methodOf(edge) : ''
    const children = []
    for (const child of node.evolves_to) {
      children.push(await parse(child))
    }
    return { id, method, evolvesTo: children }
  }
  const tree = await parse(d.chain)
  chainCache.set(chainUrl, tree)
  return tree
}

function findRoot(node) {
  return node.id
}

async function main() {
  const MAX = 1025
  console.log('Step 1: fetch all species (1..' + MAX + ')')
  const speciesList = await mapPool(
    Array.from({ length: MAX }, (_, i) => i + 1),
    12,
    (id) => getSpecies(id),
  )

  // 收集唯一进化链 url
  const chainUrls = [...new Set(speciesList.map((s) => s.evolution_chain.url))]
  console.log('Step 2: fetch', chainUrls.length, 'evolution chains')
  const trees = await mapPool(chainUrls, 8, async (url) => {
    const tree = await getEvoTree(url)
    return { url, tree }
  })

  // 建立 EVO_ROOT 与 EVO_TREES
  // 遍历每棵树，记录所有节点 id -> 根id
  const EVO_ROOT = {}
  const EVO_TREES = {}
  function walk(node, rootId) {
    EVO_ROOT[node.id] = rootId
    for (const c of node.evolvesTo) walk(c, rootId)
  }
  for (const { url, tree } of trees) {
    const rootId = findRoot(tree)
    EVO_TREES[rootId] = tree
    walk(tree, rootId)
  }

  // 没有进化的宝可梦：EVO_ROOT[id]=id，EVO_TREES 不建（组件据此判断"无进化"）
  for (let id = 1; id <= MAX; id++) {
    if (!(id in EVO_ROOT)) EVO_ROOT[id] = id
  }

  const out =
    `// 此文件由 scripts/build-pokemon-evo.mjs 自动生成，请勿手动编辑。\n` +
    `// 数据来源：PokeAPI（https://pokeapi.co）。\n` +
    `import type { EvoNode } from '@/types'\n\n` +
    `export const EVO_ROOT: Record<number, number> = ${JSON.stringify(EVO_ROOT)}\n\n` +
    `export const EVO_TREES: Record<number, EvoNode> = ${JSON.stringify(EVO_TREES)}\n`

  const target = path.join(ROOT, 'src/data/pokemon/pokemon-evo.ts')
  fs.writeFileSync(target, out, 'utf8')
  console.log('Done. root mappings:', Object.keys(EVO_ROOT).length, 'trees:', Object.keys(EVO_TREES).length)
  console.log('Wrote', target)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
