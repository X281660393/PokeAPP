// 超进化（Mega Evolution）数据
// Gen6 引入的战斗中临时进化机制，需要对应超进化石 + 钥石
// 格式: baseId → 超进化形态列表（一个宝可梦可有多个超进化形态，如喷火龙X/Y）
// stats: 超进化后的种族值，key 为 PokeAPI 的 stat name
//        (hp / attack / defense / special-attack / special-defense / speed)

export interface MegaForm {
  /** 超进化名称中文 */
  nameZh: string
  /** 超进化英文名 */
  nameEn: string
  /** 所需超进化石 */
  stoneZh: string
  /** 超进化后种族值 */
  stats: Record<string, number>
}

/** baseId → 超进化形态列表 */
export const MEGA_EVOLUTIONS: Record<number, MegaForm[]> = {
  3: [
    { nameZh: '妙蛙花', nameEn: 'Venusaur', stoneZh: '妙蛙花进化石', stats: {"hp": 80, "attack": 100, "defense": 123, "special-attack": 122, "special-defense": 120, "speed": 80} },
  ],
  6: [
    { nameZh: '喷火龙X', nameEn: 'Charizard-X', stoneZh: '喷火龙X进化石', stats: {"hp": 78, "attack": 130, "defense": 111, "special-attack": 130, "special-defense": 85, "speed": 100} },
    { nameZh: '喷火龙Y', nameEn: 'Charizard-Y', stoneZh: '喷火龙Y进化石', stats: {"hp": 78, "attack": 104, "defense": 78, "special-attack": 159, "special-defense": 115, "speed": 100} },
  ],
  9: [
    { nameZh: '水箭龟', nameEn: 'Blastoise', stoneZh: '水箭龟进化石', stats: {"hp": 79, "attack": 103, "defense": 120, "special-attack": 135, "special-defense": 115, "speed": 78} },
  ],
  15: [
    { nameZh: '大针蜂', nameEn: 'Beedrill', stoneZh: '大针蜂进化石', stats: {"hp": 65, "attack": 150, "defense": 40, "special-attack": 15, "special-defense": 80, "speed": 145} },
  ],
  18: [
    { nameZh: '比鸟', nameEn: 'Pidgeot', stoneZh: '比鸟进化石', stats: {"hp": 83, "attack": 80, "defense": 80, "special-attack": 135, "special-defense": 80, "speed": 121} },
  ],
  65: [
    { nameZh: '胡地', nameEn: 'Alakazam', stoneZh: '胡地进化石', stats: {"hp": 55, "attack": 50, "defense": 65, "special-attack": 175, "special-defense": 105, "speed": 150} },
  ],
  94: [
    { nameZh: '耿鬼', nameEn: 'Gengar', stoneZh: '耿鬼进化石', stats: {"hp": 60, "attack": 65, "defense": 80, "special-attack": 170, "special-defense": 95, "speed": 130} },
  ],
  115: [
    { nameZh: '袋兽', nameEn: 'Kangaskhan', stoneZh: '袋兽进化石', stats: {"hp": 105, "attack": 125, "defense": 100, "special-attack": 60, "special-defense": 100, "speed": 100} },
  ],
  127: [
    { nameZh: '赫拉克罗斯', nameEn: 'Pinsir', stoneZh: '赫拉克罗斯进化石', stats: {"hp": 65, "attack": 155, "defense": 120, "special-attack": 65, "special-defense": 90, "speed": 105} },
  ],
  130: [
    { nameZh: '暴鲤龙', nameEn: 'Gyarados', stoneZh: '暴鲤龙进化石', stats: {"hp": 95, "attack": 155, "defense": 109, "special-attack": 70, "special-defense": 130, "speed": 81} },
  ],
  142: [
    { nameZh: '化石翼龙', nameEn: 'Aerodactyl', stoneZh: '化石翼龙进化石', stats: {"hp": 80, "attack": 135, "defense": 85, "special-attack": 70, "special-defense": 95, "speed": 150} },
  ],
  150: [
    { nameZh: '超梦X', nameEn: 'Mewtwo-X', stoneZh: '超梦X进化石', stats: {"hp": 106, "attack": 190, "defense": 100, "special-attack": 154, "special-defense": 100, "speed": 130} },
    { nameZh: '超梦Y', nameEn: 'Mewtwo-Y', stoneZh: '超梦Y进化石', stats: {"hp": 106, "attack": 150, "defense": 70, "special-attack": 194, "special-defense": 120, "speed": 140} },
  ],
  181: [
    { nameZh: '电龙', nameEn: 'Ampharos', stoneZh: '电龙进化石', stats: {"hp": 90, "attack": 95, "defense": 105, "special-attack": 165, "special-defense": 110, "speed": 45} },
  ],
  208: [
    { nameZh: '大钢蛇', nameEn: 'Steelix', stoneZh: '大钢蛇进化石', stats: {"hp": 75, "attack": 125, "defense": 230, "special-attack": 55, "special-defense": 95, "speed": 30} },
  ],
  212: [
    { nameZh: '巨钳螳螂', nameEn: 'Scizor', stoneZh: '巨钳螳螂进化石', stats: {"hp": 70, "attack": 150, "defense": 140, "special-attack": 65, "special-defense": 100, "speed": 75} },
  ],
  214: [
    { nameZh: '赫拉克罗斯', nameEn: 'Heracross', stoneZh: '赫拉克罗斯进化石', stats: {"hp": 80, "attack": 185, "defense": 115, "special-attack": 40, "special-defense": 105, "speed": 75} },
  ],
  229: [
    { nameZh: '黑鲁加', nameEn: 'Houndoom', stoneZh: '黑鲁加进化石', stats: {"hp": 75, "attack": 90, "defense": 90, "special-attack": 140, "special-defense": 90, "speed": 115} },
  ],
  248: [
    { nameZh: '班基拉斯', nameEn: 'Tyranitar', stoneZh: '班基拉斯进化石', stats: {"hp": 100, "attack": 164, "defense": 150, "special-attack": 95, "special-defense": 120, "speed": 71} },
  ],
  254: [
    { nameZh: '蜥蜴王', nameEn: 'Sceptile', stoneZh: '蜥蜴王进化石', stats: {"hp": 70, "attack": 110, "defense": 75, "special-attack": 145, "special-defense": 85, "speed": 145} },
  ],
  257: [
    { nameZh: '火焰鸡', nameEn: 'Blaziken', stoneZh: '火焰鸡进化石', stats: {"hp": 80, "attack": 160, "defense": 80, "special-attack": 130, "special-defense": 80, "speed": 100} },
  ],
  260: [
    { nameZh: '巨沼怪', nameEn: 'Swampert', stoneZh: '巨沼怪进化石', stats: {"hp": 100, "attack": 150, "defense": 110, "special-attack": 95, "special-defense": 110, "speed": 70} },
  ],
  282: [
    { nameZh: '沙奈朵', nameEn: 'Gardevoir', stoneZh: '沙奈朵进化石', stats: {"hp": 68, "attack": 85, "defense": 65, "special-attack": 165, "special-defense": 135, "speed": 100} },
  ],
  302: [
    { nameZh: '大嘴娃', nameEn: 'Mawile', stoneZh: '大嘴娃进化石', stats: {"hp": 50, "attack": 85, "defense": 125, "special-attack": 85, "special-defense": 115, "speed": 20} },
  ],
  306: [
    { nameZh: '波士可多拉', nameEn: 'Aggron', stoneZh: '波士可多拉进化石', stats: {"hp": 70, "attack": 140, "defense": 230, "special-attack": 60, "special-defense": 80, "speed": 50} },
  ],
  308: [
    { nameZh: '恰雷姆', nameEn: 'Medicham', stoneZh: '恰雷姆进化石', stats: {"hp": 60, "attack": 100, "defense": 85, "special-attack": 80, "special-defense": 85, "speed": 100} },
  ],
  310: [
    { nameZh: '雷电兽', nameEn: 'Manectric', stoneZh: '雷电兽进化石', stats: {"hp": 70, "attack": 75, "defense": 80, "special-attack": 135, "special-defense": 80, "speed": 135} },
  ],
  354: [
    { nameZh: '诅咒娃娃', nameEn: 'Banette', stoneZh: '诅咒娃娃进化石', stats: {"hp": 64, "attack": 165, "defense": 75, "special-attack": 93, "special-defense": 83, "speed": 75} },
  ],
  359: [
    { nameZh: '阿勃梭鲁', nameEn: 'Absol', stoneZh: '阿勃梭鲁进化石', stats: {"hp": 65, "attack": 154, "defense": 60, "special-attack": 75, "special-defense": 60, "speed": 151} },
  ],
  362: [
    { nameZh: '冰鬼护', nameEn: 'Glalie', stoneZh: '冰鬼护进化石', stats: {"hp": 80, "attack": 120, "defense": 80, "special-attack": 120, "special-defense": 80, "speed": 100} },
  ],
  376: [
    { nameZh: '巨金怪', nameEn: 'Metagross', stoneZh: '巨金怪进化石', stats: {"hp": 80, "attack": 145, "defense": 150, "special-attack": 105, "special-defense": 110, "speed": 110} },
  ],
  380: [
    { nameZh: '拉帝亚斯', nameEn: 'Latias', stoneZh: '拉帝亚斯进化石', stats: {"hp": 80, "attack": 100, "defense": 120, "special-attack": 140, "special-defense": 150, "speed": 110} },
  ],
  381: [
    { nameZh: '拉帝欧斯', nameEn: 'Latios', stoneZh: '拉帝欧斯进化石', stats: {"hp": 80, "attack": 130, "defense": 100, "special-attack": 160, "special-defense": 120, "speed": 110} },
  ],
  384: [
    { nameZh: '烈空坐', nameEn: 'Rayquaza', stoneZh: '烈空坐无需进化石', stats: {"hp": 105, "attack": 180, "defense": 100, "special-attack": 180, "special-defense": 100, "speed": 115} },
  ],
  445: [
    { nameZh: '烈咬陆鲨', nameEn: 'Garchomp', stoneZh: '烈咬陆鲨进化石', stats: {"hp": 108, "attack": 130, "defense": 85, "special-attack": 141, "special-defense": 85, "speed": 151} },
  ],
  448: [
    { nameZh: '路卡利欧', nameEn: 'Lucario', stoneZh: '路卡利欧进化石', stats: {"hp": 70, "attack": 100, "defense": 70, "special-attack": 164, "special-defense": 70, "speed": 151} },
  ],
  460: [
    { nameZh: '暴雪王', nameEn: 'Abomasnow', stoneZh: '暴雪王进化石', stats: {"hp": 90, "attack": 132, "defense": 105, "special-attack": 132, "special-defense": 105, "speed": 30} },
  ],
}
