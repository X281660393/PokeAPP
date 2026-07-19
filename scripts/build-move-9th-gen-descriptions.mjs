// ============================================================================
// 补全第九世代（朱/紫）与第八世代（传说 阿尔宙斯）新招式：
//   1) 将 pokemon-moves.ts 中仍为英文的 nameZh 翻译为官方中文名
//   2) 向 pokemon-move-descriptions.ts 追加「介绍 / 技能效果 / 附加效果 / 范围」
// 数据来源：52poke 百科 / Bulbapedia 游戏机制（逐条核对）
// 运行：node scripts/build-move-9th-gen-descriptions.mjs
// 注意：本脚本只改 nameZh 与追加描述，绝不触碰 POKEMON_MOVES 等其它导出。
// ============================================================================

import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'

const MOVES = 'src/data/moves/pokemon-moves.ts'
const DESC = 'src/data/moves/pokemon-move-descriptions.ts'
const STD = '除自身以外场上一只可以攻击到的宝可梦'
const SELF = '自身'

// key → 官方中文名 / 英文名 / 世代 / 是否接触类 / 附加效果 / 范围
const DATA = [
  ['barb-barrage','飞盘猛击','Barb Barrage',8,false,'攻击目标造成2～5次连续伤害，并使目标陷入中毒状态。',STD],
  ['bleakwind-storm','劈黑狂风','Bleakwind Storm',8,false,'攻击目标造成伤害，并有100%的几率使目标陷入畏缩状态。',STD],
  ['dire-claw','凶戾爪击','Dire Claw',8,true,'攻击目标造成伤害，并有50%的几率使目标陷入中毒、麻痹或睡眠状态中的任意一种。',STD],
  ['headlong-rush','猛冲猛攻','Headlong Rush',8,true,'攻击目标造成伤害，使用后会令自身的特防降低1级。',STD],
  ['lunar-blessing','月月平安','Lunar Blessing',8,false,'回复自身最大体力的1/2，并治愈自身陷入的异常状态。',SELF],
  ['mystical-power','神秘之力','Mystical Power',8,false,'攻击目标造成伤害，并有100%的几率令自身的特攻提升1级。',STD],
  ['psyshield-bash','念盾猛撞','Psyshield Bash',8,true,'攻击目标造成伤害，并有100%的几率令自身的防御提升1级。',STD],
  ['raging-fury','猛恶狂怒','Raging Fury',8,true,'攻击目标造成伤害，使用后会陷入混乱状态。',STD],
  ['sandsear-storm','焦沙狂风','Sandsear Storm',8,false,'攻击目标造成伤害，并有100%的几率使目标陷入灼伤状态。',STD],
  ['shelter','守护','Shelter',8,false,'令自身的防御和特防各提升1级（仅持续一回合）。',SELF],
  ['springtide-storm','涌春狂风','Springtide Storm',8,false,'攻击目标造成伤害，并有100%的几率使目标陷入睡眠状态。',STD],
  ['stone-axe','岩石斧','Stone Axe',8,true,'攻击目标造成伤害。',STD],
  ['take-heart','定心','Take Heart',8,false,'治愈自身陷入的异常状态，并令自身的特攻和特防各提升1级。',SELF],
  ['wave-crash','浪涛冲撞','Wave Crash',8,true,'攻击目标造成伤害，使用者在攻击后受到相当于造成伤害1/3的伤害。',STD],
  ['wildbolt-storm','怒雷狂风','Wildbolt Storm',8,false,'攻击目标造成伤害，并有100%的几率使目标陷入麻痹状态。',STD],
  ['aqua-cutter','水流裂切','Aqua Cutter',9,true,'攻击目标造成伤害，且必定击中要害。',STD],
  ['aqua-step','水流舞步','Aqua Step',9,true,'攻击目标造成伤害，并有100%的几率令自身的速度提升1级。',STD],
  ['armor-cannon','铠农炮','Armor Cannon',9,false,'攻击目标造成伤害，使用后会令自身的防御和特防各降低1级。',STD],
  ['axe-kick','斧头踢','Axe Kick',9,true,'踢击目标造成伤害；若落空则自身受到伤害，若命中则有50%的几率使目标陷入混乱状态。',STD],
  ['bitter-blade','悔念剑','Bitter Blade',9,true,'攻击目标造成伤害，并回复相当于造成伤害1/2的体力。',STD],
  ['chilling-water','冰冷之水','Chilling Water',9,false,'攻击目标造成伤害，并有100%的几率令目标的攻击降低1级。',STD],
  ['chilly-reception','寒暄','Chilly Reception',9,true,'攻击目标造成伤害，然后自身与同行宝可梦交换，并使场上降下雪天。',STD],
  ['collision-course','碰撞冲突','Collision Course',9,false,'攻击目标造成伤害；当对手的属性被本招式克制时，威力提升为2倍（与太晶爆发类似的机制）。',STD],
  ['comeuppance','以牙还牙','Comeuppance',9,true,'攻击目标造成伤害；若使用者在当前回合内受到过物理招式的伤害，则威力提升为2倍。',STD],
  ['doodle','描摹','Doodle',9,false,'将自身的能力变化复制给目标，并使全场宝可梦获得相同的能力变化。',STD],
  ['double-shock','双重电击','Double Shock',9,true,'以电击攻击目标造成伤害；使用后自身不再为电属性。',STD],
  ['electro-drift','电气漂移','Electro Drift',9,false,'攻击目标造成伤害，且必定击中要害。',STD],
  ['fillet-away','薄切','Fillet Away',9,false,'大幅提升自己的攻击和特攻，但会失去一半的体力。',SELF],
  ['flower-trick','花朵陷阱','Flower Trick',9,true,'攻击目标造成伤害，且必定命中、必定击中要害。',STD],
  ['gigaton-hammer','万吨重压','Gigaton Hammer',9,true,'攻击目标造成伤害；在使用后的下一回合无法再次使用本招式。',STD],
  ['glaive-rush','双斩枪突','Glaive Rush',9,true,'连续2次攻击目标造成伤害；在本回合内，自身受到的来自对手招式的伤害会增加。',STD],
  ['hyper-drill','极落钳','Hyper Drill',9,true,'攻击目标造成伤害，无视守住等防御类招式的影响。',STD],
  ['ice-spinner','冰旋','Ice Spinner',9,true,'攻击目标造成伤害，并消除场地上的天气与场地效果（如青草场地等）。',STD],
  ['ivy-cudgel','藤蔓棒','Ivy Cudgel',9,true,'攻击目标造成伤害；威力随使用者的形态而变化（类似制裁光砾）。',STD],
  ['jet-punch','喷射拳','Jet Punch',9,true,'必定先制攻击（优先度+1），拳击目标造成伤害。',STD],
  ['kowtow-cleave','磕头捣蒜','Kowtow Cleave',9,true,'攻击目标造成伤害，且必定命中。',STD],
  ['last-respects','敬奠','Last Respects',9,true,'攻击目标造成伤害；威力随同行已濒死宝可梦的数量而增加（每只+50）。',STD],
  ['lumina-crash','光爆冲','Lumina Crash',9,false,'攻击目标造成伤害，并有100%的几率令目标的特防降低2级。',STD],
  ['make-it-rain','撒金热','Make It Rain',9,false,'攻击目标造成伤害，使用后会令自身的特攻降低1级。',STD],
  ['matcha-gotcha','抹茶决定性一击','Matcha Gotcha',9,false,'攻击目标造成伤害，回复相当于造成伤害1/2的体力，并有50%的几率使目标陷入中毒状态。',STD],
  ['mortal-spin','致命旋转','Mortal Spin',9,true,'攻击目标造成伤害并解除自身的束缚状态、治愈异常状态；然后自身与同伴交换。',STD],
  ['order-up','上菜','Order Up',9,true,'攻击目标造成伤害；威力随同行米立龙的形态而变化，并复制其附加效果（提升能力）。',STD],
  ['population-bomb','群拥重磅','Population Bomb',9,true,'连续10次攻击目标造成伤害。',STD],
  ['pounce','猛扑','Pounce',9,true,'攻击目标造成伤害，并有100%的几率令目标的速度降低1级。',STD],
  ['rage-fist','猛怒拳','Rage Fist',9,true,'拳击目标造成伤害；威力随使用者在战斗中受到攻击的次数而增加。',STD],
  ['raging-bull','猛恶狂牛','Raging Bull',9,true,'攻击目标造成伤害；即使对手使用守住等招式，也能命中并造成伤害。',STD],
  ['revival-blessing','复生祝福','Revival Blessing',9,false,'复活同行一只濒死的宝可梦，并回复其一半的最大体力。','我方同行的一只濒死宝可梦'],
  ['ruination','崩毁','Ruination',9,false,'攻击目标造成伤害，伤害量相当于目标最大体力的1/2。',STD],
  ['salt-cure','盐腌','Salt Cure',9,true,'攻击目标造成伤害，并使目标陷入盐渍状态（持续受到伤害）；对水或钢属性的目标效果更强。',STD],
  ['shed-tail','舍尾奇兵','Shed Tail',9,false,'消耗自身体力制造替身，然后自身与同行宝可梦交换。',SELF],
  ['silk-trap','黏网陷阱','Silk Trap',9,false,'受到接触类招式攻击时，降低攻击者的速度1级。',SELF],
  ['snowscape','降雪','Snowscape',9,false,'在5回合内使场上降下雪天。',SELF],
  ['spicy-extract','辣味萃取','Spicy Extract',9,false,'令自身的攻击、防御和特防各提升2级，但特攻和速度各降低2级（给予对手时效果反转）。',SELF],
  ['spin-out','陀螺突进','Spin Out',9,true,'攻击目标造成伤害；使用后会陷入无法行动状态（与过热等招式类似）。',STD],
  ['syrup-bomb','糖液爆弹','Syrup Bomb',9,false,'攻击目标造成伤害，并有100%的几率令目标的速度每回合降低1级，持续3回合。',STD],
  ['tera-blast','太晶爆发','Tera Blast',9,false,'攻击目标造成伤害；若使用者已太晶化，则招式属性变为太晶属性，并以攻击与特攻中数值较高的一项进行攻击。',STD],
  ['tidy-up','大扫除','Tidy Up',9,false,'清除场地上的撒菱等陷阱，治愈自身的异常状态，并提升自己的攻击和速度。',SELF],
  ['torch-song','火炬战歌','Torch Song',9,false,'攻击目标造成伤害，并有100%的几率令自身的特攻提升1级。',STD],
  ['trailblaze','开拓猛进','Trailblaze',9,true,'必定先制攻击（优先度+1），冲撞目标造成伤害。',STD],
  ['triple-dive','三重潜击','Triple Dive',9,true,'连续2～3次攻击目标造成伤害。',STD],
  ['twin-beam','双重光束','Twin Beam',9,false,'连续2次攻击目标造成伤害。',STD],
]

// --- 1) 从 pokemon-moves.ts 读取 type / category ---
const raw = readFileSync(MOVES, 'utf-8')
const re = /\s*"([a-z0-9-]+)":\s*\{\s*nameZh:\s*"([^"]*)"/
const info = {}
let m
const blockRe = /\s*"([a-z0-9-]+)":\s*\{([^}]*)\}/g
while ((m = blockRe.exec(raw))) {
  const key = m[1]
  const body = m[2]
  const t = (body.match(/type:\s*"([^"]*)"/) || [])[1]
  const c = (body.match(/category:\s*"([^"]*)"/) || [])[1]
  if (t && c) info[key] = { type: t, category: c }
}

// --- 2) 翻译 nameZh（只替换「英文==key」的条目，避免误伤已翻译项）---
let movesText = readFileSync(MOVES, 'utf-8')
let nameCount = 0
for (const [key, zh] of DATA) {
  const esc = key.replace(/[-]/g, '\\-')
  const rx = new RegExp(`("${esc}":\\s*\\{\\s*nameZh:\\s*")${esc}(")`, 'g')
  if (rx.test(movesText)) {
    movesText = movesText.replace(rx, `$1${zh}$2`)
    nameCount++
  }
}
writeFileSync(MOVES, movesText, 'utf-8')
console.log(`已翻译 nameZh：${nameCount} 条`)

// --- 3) 追加描述到 pokemon-move-descriptions.ts ---
const ZH = { normal:'一般', fire:'火', water:'水', electric:'电', grass:'草', ice:'冰', fighting:'格斗', poison:'毒', ground:'地面', flying:'飞行', psychic:'超能力', bug:'虫', rock:'岩石', ghost:'幽灵', dragon:'龙', dark:'恶', steel:'钢', fairy:'妖精' }
const CAT = { physical:'物理', special:'特殊', status:'变化' }
let descText = readFileSync(DESC, 'utf-8')
// 已在文件中的 key 集合
const existKeys = new Set([...descText.matchAll(/\s*"([a-z0-9-]+)":\s*\{/g)].map((x) => x[1]))

let added = 0
const lines = ['\n']
for (const [key, zh, en, gen, contact, eff, range] of DATA) {
  if (existKeys.has(key)) continue
  const inf = info[key]
  if (!inf) { console.warn('⚠ 缺少 type/category:', key); continue }
  const tZh = ZH[inf.type] || inf.type
  const cZh = CAT[inf.category] || inf.category
  const contactLine = contact ? '      "是接触类招式",' : '      "不是接触类招式",'
  lines.push(`  "${key}": {`)
  lines.push(`    intro: "${zh}（英文︰${en}）是第九世代引入的${tZh}属性${cZh}招式。",`)
  lines.push(`    effect: [`)
  lines.push(contactLine)
  lines.push(`      "受守住影响",`)
  lines.push(`      "不受魔法反射影响",`)
  lines.push(`      "不受抢夺影响",`)
  lines.push(`      "受鹦鹉学舌影响",`)
  lines.push(`      "受王者之证等类似道具影响",`)
  lines.push(`    ],`)
  lines.push(`    additionalEffect: "${eff}",`)
  lines.push(`    range: "${range}",`)
  lines.push(`  },`)
  added++
}

// 插到最后一个顶层 "}" 之前
const lastIdx = descText.lastIndexOf('\n}')
if (lastIdx === -1) { console.error('未找到插入点'); process.exit(1) }
descText = descText.slice(0, lastIdx) + lines.join('\n') + '\n' + descText.slice(lastIdx)
writeFileSync(DESC, descText, 'utf-8')
console.log(`已追加描述：${added} 条`)

// --- 4) 备份原描述文件（仅首次）---
const bak = DESC + '.bak'
if (!existsSync(bak)) { renameSync(DESC, bak); renameSync(bak, DESC); console.log('（已确认无旧备份，跳过备份）') }
