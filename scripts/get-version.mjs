#!/usr/bin/env node
/**
 * 读取 src/config/index.ts 中 APP_CONFIG.version 的版本号并输出
 * 供 app一键打包.bat 使用，避免在 cmd 里写复杂的 inline 正则。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configPath = process.argv[2] || path.resolve(__dirname, '../src/config/index.ts')
if (!fs.existsSync(configPath)) {
  console.error(`[ERR] 找不到配置文件: ${configPath}`)
  process.exit(1)
}

const text = fs.readFileSync(configPath, 'utf8')
const match = text.match(/version:\s*'([^']+)'/)
if (!match) {
  console.error("[ERR] 在 src/config/index.ts 中未匹配到 version: 'x.x.x'")
  process.exit(1)
}

console.log(match[1])
