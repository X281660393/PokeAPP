import ExcelJS from 'exceljs'
import { resolve } from 'node:path'

async function regionMap(file) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(resolve(process.cwd(), file))
  const ws = wb.getWorksheet('宝可梦')
  const headers = ws.getRow(1).values.slice(1)
  const idIdx = headers.indexOf('编号')
  const regionIdx = headers.indexOf('地区')
  const genIdx = headers.indexOf('世代')
  const map = {}
  ws.eachRow((row, n) => {
    if (n === 1) return
    map[row.getCell(idIdx + 1).value] = {
      region: row.getCell(regionIdx + 1).value,
      gen: row.getCell(genIdx + 1).value,
    }
  })
  return map
}

const a = await regionMap(process.argv[2])
const b = await regionMap(process.argv[3])
const ids = Object.keys(a)
let diffs = 0
for (const id of ids) {
  if (a[id].region !== b[id].region || a[id].gen !== b[id].gen) {
    diffs++
    if (diffs <= 5) console.log(`  ✗ #${id}: a=${a[id].region}/${a[id].gen} b=${b[id].region}/${b[id].gen}`)
  }
}
console.log(`对比 ${ids.length} 行，地区/世代差异数: ${diffs}`)
