// 一次性脚本：将全部宝可梦精灵图下载到 public/sprites/，随 app 打包以实现离线可用。
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('public/sprites')
fs.mkdirSync(dir, { recursive: true })

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
const TOTAL = 1025
const CONC = 24

async function dl(i) {
  const url = `${BASE}${i}.png`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const buf = Buffer.from(await r.arrayBuffer())
      fs.writeFileSync(path.join(dir, `${i}.png`), buf)
      return true
    } catch {
      if (attempt === 2) return false
    }
  }
  return false
}

async function main() {
  let next = 1
  let done = 0
  let failed = 0
  async function worker() {
    while (next <= TOTAL) {
      const i = next++
      const ok = await dl(i)
      done++
      if (!ok) failed++
      if (done % 200 === 0) console.log(`progress ${done}/${TOTAL}`)
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker))
  console.log(`done=${done} failed=${failed}`)
}

main()
