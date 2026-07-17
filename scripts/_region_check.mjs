import ExcelJS from 'exceljs'
import { resolve } from 'node:path'

const file = resolve(process.cwd(), process.argv[2] || 'data-excel/_region_check_a.xlsx')
const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(file)
const ws = wb.getWorksheet('宝可梦')
const headers = ws.getRow(1).values.slice(1)
const regionIdx = headers.indexOf('地区')
const genIdx = headers.indexOf('世代')
console.log('表头:', headers.join(' | '))
console.log('地区列索引:', regionIdx, ' 世代列索引:', genIdx)

let total = 0, withRegion = 0
const samples = []
ws.eachRow((row, n) => {
  if (n === 1) return
  total++
  const region = row.getCell(regionIdx + 1).value
  const gen = row.getCell(genIdx + 1).value
  if (region) withRegion++
  if (samples.length < 12) samples.push(`#${row.getCell(1).value} gen=${gen} region=${region}`)
})
console.log(`总行数: ${total}, 含地区: ${withRegion}`)
console.log('样本:')
for (const s of samples) console.log('  ', s)
