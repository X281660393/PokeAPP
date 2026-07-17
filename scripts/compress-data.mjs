/**
 * 数据压缩脚本：去除冗余字段
 * 1. pokemon-moves.ts: MOVE_DB 条目中的 "nameEn" 字段（与 key 重复）
 * 2. pokemon-abilities.ts: ABILITY_DB 条目中的 "nameEn" 字段（与 key 重复）
 * 3. pokemon-db.ts: 每条记录的 spriteUrl 行（运行时通过 spriteFor(id) 生成）
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const srcDir = join(process.cwd(), 'src', 'data')

// --- 1. Compress MOVE_DB ---
function compressMoveDb() {
  const file = join(srcDir, 'moves', 'pokemon-moves.ts')
  let content = readFileSync(file, 'utf-8')
  const before = content.length
  // Remove "nameEn":"..." from all entries (it's always the first field, identical to the key)
  content = content.replace(/"nameEn":"[^"]*",/g, '')
  writeFileSync(file, content, 'utf-8')
  const after = content.length
  console.log(`[moves] ${before} -> ${after} bytes (saved ${(before - after).toLocaleString()} = ${((before - after) / before * 100).toFixed(1)}%)`)
}

// --- 2. Compress ABILITY_DB ---
function compressAbilityDb() {
  const file = join(srcDir, 'abilities', 'pokemon-abilities.ts')
  let content = readFileSync(file, 'utf-8')
  const before = content.length
  content = content.replace(/"nameEn":"[^"]*",/g, '')
  writeFileSync(file, content, 'utf-8')
  const after = content.length
  console.log(`[abilities] ${before} -> ${after} bytes (saved ${(before - after).toLocaleString()} = ${((before - after) / before * 100).toFixed(1)}%)`)
}

// --- 3. Compress pokemon-db.ts (remove spriteUrl lines) ---
function compressPokemonDb() {
  const file = join(srcDir, 'pokemon', 'pokemon-db.ts')
  let content = readFileSync(file, 'utf-8')
  const before = content.length
  // Remove spriteUrl lines: "    spriteUrl: \"https://...\",\n"
  content = content.replace(/^\s*spriteUrl:\s*"[^"]*",\s*\n/gm, '')
  writeFileSync(file, content, 'utf-8')
  const after = content.length
  console.log(`[pokemon-db] ${before} -> ${after} bytes (saved ${(before - after).toLocaleString()} = ${((before - after) / before * 100).toFixed(1)}%)`)
}

compressMoveDb()
compressAbilityDb()
compressPokemonDb()
console.log('Done!')
