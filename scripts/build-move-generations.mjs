/**
 * 招式世代补丁脚本
 * ---------------------------------------------------------------
 * 给现有 src/data/moves/pokemon-moves.ts 的 MOVE_DB 每只招式补上 gen
 * （引入世代，1-9）字段，数据来自 PokeAPI 的 move.generation。
 *
 * 与 build-pokemon-db.mjs 的区别：本脚本不重新抓取中文名/威力等，
 * 只按英文名向 PokeAPI 的 /move/{name} 取 generation，再基于现有 MOVE_DB
 * 重新序列化（保留其它字段原样），因此不会漂移已有数据。
 * POKEMON_MOVES 原样保留。
 *
 * 运行（需联网）：
 *   node scripts/build-move-generations.mjs
 */
import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/moves/pokemon-moves.ts')
const API = 'https://pokeapi.co/api/v2'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.status === 429) {
        await sleep(800 * (i + 1))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`)
      return await res.json()
    } catch (e) {
      if (i === tries - 1) throw e
      await sleep(500)
    }
  }
}

/** 从 generation.url（如 .../generation/7/）解析世代数字 */
function genFromUrl(url) {
  const m = String(url || '').match(/generation\/(\d+)/)
  return m ? Number(m[1]) : 0
}

async function main() {
  const src = readFileSync(OUT, 'utf8')
  const out = await esbuild.transform(src, { loader: 'ts', format: 'esm' })
  const tmp = resolve(__dirname, `._mvgen_tmp_${Date.now()}.mjs`)
  writeFileSync(tmp, out.code)
  const mod = await import('file://' + tmp)
  const MOVE_DB = mod.MOVE_DB
  const POKEMON_MOVES = mod.POKEMON_MOVES
  if (!MOVE_DB || !Object.keys(MOVE_DB).length) throw new Error('未能读取 MOVE_DB')
  // 清理临时模块
  setTimeout(() => {
    try {
      unlinkSync(tmp)
    } catch {}
  }, 500)

  const keys = Object.keys(MOVE_DB)
  console.log(`开始抓取 ${keys.length} 个招式的引入世代...`)
  const genMap = new Map()
  const BATCH = 25
  for (let i = 0; i < keys.length; i += BATCH) {
    const end = Math.min(i + BATCH, keys.length)
    const jobs = []
    for (let j = i; j < end; j++) {
      const key = keys[j]
      jobs.push(
        getJSON(`${API}/move/${key}`)
          .then((j) => [key, genFromUrl(j.generation?.url)])
          .catch((e) => {
            console.error(`  ✗ ${key} 失败: ${e.message}`)
            return [key, 0]
          }),
      )
    }
    const settled = await Promise.all(jobs)
    for (const [k, g] of settled) genMap.set(k, g)
    console.log(`  进度 ${end}/${keys.length}`)
    await sleep(200)
  }

  // 重新序列化（MOVE_DB 增加 gen，保留其它字段；POKEMON_MOVES 原样）
  const lines = []
  lines.push('// 此文件由 scripts/build-pokemon-db.mjs 自动生成，请勿手动编辑。')
  lines.push("import type { MoveInfo, PokemonMoves } from '@/types'")
  lines.push('')
  lines.push('export const MOVE_DB: Record<string, MoveInfo> = {')
  for (const key of keys) {
    const m = MOVE_DB[key]
    lines.push(`  ${JSON.stringify(key)}: {`)
    lines.push(`  nameZh: ${JSON.stringify(m.nameZh)},`)
    lines.push(`  type: ${JSON.stringify(m.type)},`)
    lines.push(`  category: ${JSON.stringify(m.category)},`)
    lines.push(`  power: ${m.power === null ? 'null' : m.power},`)
    lines.push(`  accuracy: ${m.accuracy === null ? 'null' : m.accuracy},`)
    lines.push(`  pp: ${m.pp === null ? 'null' : m.pp},`)
    lines.push(`  gen: ${genMap.get(key) || 0},`)
    lines.push(`  },`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export const POKEMON_MOVES: Record<number, PokemonMoves> = {')
  for (const [k, v] of Object.entries(POKEMON_MOVES || {})) {
    const level = (v.level || [])
      .map((x) => `{ name: ${JSON.stringify(x.name)}, level: ${x.level} }`)
      .join(', ')
    const egg = (v.egg || []).map((x) => JSON.stringify(x)).join(', ')
    const machine = (v.machine || []).map((x) => JSON.stringify(x)).join(', ')
    lines.push(`  ${k}: { level: [${level}], egg: [${egg}], machine: [${machine}] },`)
  }
  lines.push('}')
  lines.push('')

  const content = lines.join('\n')
  copyFileSync(OUT, OUT + '.bak')
  writeFileSync(OUT, content, 'utf8')
  const withGen = keys.filter((k) => (genMap.get(k) || 0) > 0).length
  console.log(`✅ 已写入 ${OUT}`)
  console.log(`   含世代标记的招式：${withGen} / ${keys.length}`)
  console.log('   原文件已备份为 pokemon-moves.ts.bak')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
