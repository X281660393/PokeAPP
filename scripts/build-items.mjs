// ============================================================================
// build-items.mjs
// ----------------------------------------------------------------------------
// 从 pokemon-dataset-zh 的 data/item_list.json 生成 src/data/items/pokemon-items.ts
// （1425 条完整道具库），并把道具图标复制到 public/items/{key}.png。
//
// key 策略：slug(name_en) + 去重后缀（与旧 102 条英文 slug 风格一致，URL 友好）。
// category：道具所在「直接父分类」名（最准确，如 野外使用的道具 / 携带物品 / 精灵球）。
// 字段：nameZh / nameJa / nameEn / category / icon(可选) / descZh。
//
// 生成结果同时兼容 scripts/data-excel.mjs 的「道具」表往返（见 excel-config.mjs）。
//
// 用法：
//   node scripts/build-items.mjs            # 生成 TS + 复制图标
//   node scripts/build-items.mjs --no-copy  # 仅生成 TS，不复制图标
// ============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// 数据源（pokemon-dataset-zh 仓库，绝对路径指向用户桌面）
const SRC_JSON = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/item_list.json'
const SRC_ICONS = 'C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/images/items'
const OUT_TS = path.resolve(ROOT, 'src/data/items/pokemon-items.ts')
const OUT_ICONS = path.resolve(ROOT, 'public/items')

const NO_COPY = process.argv.includes('--no-copy')

// —— slugify：去重音、转小写、非字母数字变连字符 ——
function slugify(en) {
  return en
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // 去掉变音符号（é → e）
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// —— 扁平化 JSON 树，记录每条道具的「直接父分类」——
function flatten(nodes, parentCat, out) {
  for (const n of nodes) {
    if (n.type === 'item') {
      out.push({ ...n, _cat: parentCat })
    } else if (n.type === 'category') {
      // 该分类下若有直接道具，父分类即本分类名；否则继续下钻
      const directItems = (n.children || []).filter((c) => c.type === 'item')
      const childCats = (n.children || []).filter((c) => c.type === 'category')
      for (const it of directItems) out.push({ ...it, _cat: n.name })
      if (childCats.length) flatten(childCats, n.name, out)
    }
  }
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'))
  const items = []
  flatten(raw, '', items)

  // —— 生成 key（slug + 去重）——
  const used = new Map()
  const records = []
  let collisions = 0
  let missingIcons = 0
  const catOrder = []
  const iconPlan = [] // {src, dest}

  for (const it of items) {
    const en = it.name_en || ''
    let base = slugify(en)
    if (!base) base = 'item' // 兜底（极少见）
    let key = base
    if (used.has(base)) {
      let n = used.get(base) + 1
      while (used.has(`${base}-${n}`)) n++
      key = `${base}-${n}`
      used.set(base, n)
      collisions++
    } else {
      used.set(base, 1)
    }
    used.set(key, 1)

    // 图标：优先用数据源图（icon 可能是数组，取首个存在的）；
    // 数据源缺失则回退到已存在的 public/items/{key}.png（旧英文 slug 资源）。
    let iconField = undefined
    const iconCands = Array.isArray(it.icon) ? it.icon : it.icon ? [it.icon] : []
    let srcPath = null
    for (const c of iconCands) {
      const p = path.join(SRC_ICONS, c)
      if (fs.existsSync(p)) { srcPath = p; break }
    }
    const pubPath = path.join(OUT_ICONS, `${key}.png`)
    if (srcPath) {
      iconField = `./items/${key}.png`
      iconPlan.push({ src: srcPath, dest: pubPath })
    } else if (fs.existsSync(pubPath)) {
      iconField = `./items/${key}.png` // 旧资源同名仍可用，直接引用
    } else {
      missingIcons++
    }

    if (!catOrder.includes(it._cat)) catOrder.push(it._cat)

    const descZh = Array.isArray(it.description) ? it.description.join('\n') : (it.description || '')
    records.push({
      key,
      nameZh: it.name_zh || '',
      nameJa: it.name_ja || '',
      nameEn: en,
      category: it._cat || '',
      icon: iconField,
      descZh,
      // 道具源数据(item_list.json)只有 description 一个文本字段，它本身即描述效果
      // （如「喷雾式伤药。能让１只宝可梦回复２０ＨＰ。」），故 effectzh 直接镜像 descZh，
      // 使「效果」字段完整、Excel 往返不丢；页面渲染时若与 descZh 相同则不重复显示。
      effectzh: descZh,
    })
  }

  // —— 写 TS ——
  const lines = []
  lines.push('// 此文件由 scripts/build-items.mjs 从 pokemon-dataset-zh 的 item_list.json 生成。')
  lines.push('// 字段：key=英文 slug；nameZh / nameJa / nameEn / category(直接父分类) / icon(可选) / descZh / effectzh。')
  lines.push('// 同时兼容 scripts/data-excel.mjs 的「道具」表双向往返（见 excel-config.mjs）。')
  lines.push("import type { ItemInfo } from '@/types'")
  lines.push('')
  lines.push('export const ITEM_DB: Record<string, ItemInfo> = {')
  for (const r of records) {
    lines.push(`  ${JSON.stringify(r.key)}: {`)
    lines.push(`  nameZh: ${JSON.stringify(r.nameZh)},`)
    if (r.nameJa) lines.push(`  nameJa: ${JSON.stringify(r.nameJa)},`)
    if (r.nameEn) lines.push(`  nameEn: ${JSON.stringify(r.nameEn)},`)
    lines.push(`  category: ${JSON.stringify(r.category)},`)
    if (r.icon) lines.push(`  icon: ${JSON.stringify(r.icon)},`)
    lines.push(`  descZh: ${JSON.stringify(r.descZh)},`)
    if (r.effectzh) lines.push(`  effectzh: ${JSON.stringify(r.effectzh)},`)
    lines.push('},')
  }
  lines.push('}')
  lines.push('')
  fs.writeFileSync(OUT_TS, lines.join('\n'), 'utf8')

  // —— 复制图标 ——
  let copied = 0
  if (!NO_COPY) {
    if (!fs.existsSync(OUT_ICONS)) fs.mkdirSync(OUT_ICONS, { recursive: true })
    for (const { src, dest } of iconPlan) {
      fs.copyFileSync(src, dest)
      copied++
    }
  }

  // —— 统计 ——
  console.log('=== build-items 完成 ===')
  console.log('道具总数      :', records.length)
  console.log('分类数(叶子)  :', catOrder.length)
  console.log('slug 去重冲突  :', collisions)
  console.log('缺图标(数据源) :', missingIcons)
  console.log('图标已复制     :', copied, NO_COPY ? '(跳过 --no-copy)' : '')
  console.log('分类顺序       :', catOrder.join(' | '))
  console.log('TS 已写入      :', path.relative(ROOT, OUT_TS))
}

main()
