/** 宝可梦属性颜色映射 */
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
}

/** 宝可梦属性中文名映射 */
export const TYPE_NAMES: Record<string, string> = {
  normal: '一般',
  fire: '火',
  water: '水',
  electric: '电',
  grass: '草',
  ice: '冰',
  fighting: '格斗',
  poison: '毒',
  ground: '地面',
  flying: '飞行',
  psychic: '超能',
  bug: '虫',
  rock: '岩石',
  ghost: '幽灵',
  dragon: '龙',
  dark: '恶',
  steel: '钢',
  fairy: '妖精',
}

/** 所有属性列表（固定 18 种，顺序按游戏内标准排列） */
export const ALL_TYPES = Object.keys(TYPE_COLORS)

/** 宝可梦地区（世代）定义 */
export interface Region {
  /** 世代编号 1-9 */
  gen: number
  /** 地区英文名（如 kanto） */
  region: string
  /** 地区中文名（如 关都） */
  regionZh: string
  /** 显示名称（如 第一世代） */
  label: string
  /** 起始编号（含） */
  start: number
  /** 结束编号（含） */
  end: number
}

/**
 * 地区分类（原「世代分类」改为按地区分类）。
 * 每一世代对应一个发地区域，这里以地区为主要分类维度。
 */
export const REGIONS: Region[] = [
  { gen: 1, region: 'kanto',     regionZh: '关都', label: '第一世代', start: 1,   end: 151  },
  { gen: 2, region: 'johto',     regionZh: '城都', label: '第二世代', start: 152, end: 251  },
  { gen: 3, region: 'hoenn',     regionZh: '丰缘', label: '第三世代', start: 252, end: 386  },
  { gen: 4, region: 'sinnoh',    regionZh: '神奥', label: '第四世代', start: 387, end: 493  },
  { gen: 5, region: 'unova',     regionZh: '合众', label: '第五世代', start: 494, end: 649  },
  { gen: 6, region: 'kalos',     regionZh: '卡洛斯', label: '第六世代', start: 650, end: 721  },
  { gen: 7, region: 'alola',     regionZh: '阿罗拉', label: '第七世代', start: 722, end: 809  },
  { gen: 8, region: 'galar',     regionZh: '伽勒尔', label: '第八世代', start: 810, end: 905  },
  { gen: 9, region: 'paldea',    regionZh: '帕底亚', label: '第九世代', start: 906, end: 1025 },
]

/** 兼容旧导出名（世代列表，保留 gen 字段供 store 使用） */
export const GENERATIONS = REGIONS.map((r) => ({
  gen: r.gen,
  label: r.label,
  start: r.start,
  end: r.end,
}))

/** 官方游戏版本（用于版本筛选）。key 用于数据匹配，label 为中文显示名 */
export interface GameVersion {
  /** 版本英文名（与宝可梦数据的 gameVersions 字段对应） */
  key: string
  /** 中文显示名 */
  label: string
  /** 所属世代 */
  gen: number
}

/** 主要官方游戏版本列表（覆盖 1-9 世代主系列） */
export const GAME_VERSIONS: GameVersion[] = [
  // 第一世代
  { key: 'red', label: '红', gen: 1 },
  { key: 'blue', label: '蓝', gen: 1 },
  { key: 'yellow', label: '黄', gen: 1 },
  // 第二世代
  { key: 'gold', label: '金', gen: 2 },
  { key: 'silver', label: '银', gen: 2 },
  { key: 'crystal', label: '水晶', gen: 2 },
  // 第三世代
  { key: 'ruby', label: '红宝石', gen: 3 },
  { key: 'sapphire', label: '蓝宝石', gen: 3 },
  { key: 'emerald', label: '绿宝石', gen: 3 },
  { key: 'firered', label: '火红', gen: 3 },
  { key: 'leafgreen', label: '叶绿', gen: 3 },
  // 第四世代
  { key: 'diamond', label: '钻石', gen: 4 },
  { key: 'pearl', label: '珍珠', gen: 4 },
  { key: 'platinum', label: '白金', gen: 4 },
  // 第五世代
  { key: 'black', label: '黑', gen: 5 },
  { key: 'white', label: '白', gen: 5 },
  { key: 'black-2', label: '黑2', gen: 5 },
  { key: 'white-2', label: '白2', gen: 5 },
  // 第六世代
  { key: 'x', label: 'X', gen: 6 },
  { key: 'y', label: 'Y', gen: 6 },
  { key: 'omega-ruby', label: '始源红宝石', gen: 6 },
  { key: 'alpha-sapphire', label: '终极蓝宝石', gen: 6 },
  // 第七世代
  { key: 'sun', label: '太阳', gen: 7 },
  { key: 'moon', label: '月亮', gen: 7 },
  { key: 'ultra-sun', label: '究极太阳', gen: 7 },
  { key: 'ultra-moon', label: '究极月亮', gen: 7 },
  // 第八世代
  { key: 'sword', label: '剑', gen: 8 },
  { key: 'shield', label: '盾', gen: 8 },
  // 第九世代
  { key: 'scarlet', label: '朱', gen: 9 },
  { key: 'violet', label: '紫', gen: 9 },
]

/** 属性对应的 SVG 图标路径（简化的向量图形） */
export const TYPE_ICONS: Record<string, string> = {
  normal:   'M6 8h12M6 12h12M6 16h8',                          // 一般 — 横线（中性）
  fire:     'M12 4c-2 3-5 6-5 9a5 5 0 1 0 10 0c0-3-3-6-5-9z', // 火 — 火焰
  water:    'M12 4a6 6 0 0 0 0 11 6 6 0 0 0 0-11z',            // 水 — 水滴
  electric: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',                 // 电 — 闪电
  grass:    'M12 20v-4m0 0c-3 0-6-3-6-7s3-7 6-7 6 3 6 7-3 7-6 7zm0-14V2', // 草 — 叶子
  ice:      'M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z',         // 冰 — 雪花
  fighting: 'M12 2l3 4h5l-4 3 1 5-5-3-5 3 1-5-4-3h5z M12 22v-6', // 格斗 — 拳套
  poison:   'M12 2a6 6 0 0 0-6 6c0 4 6 8 6 12 0-4 6-8 6-12a6 6 0 0 0-6-6z', // 毒 — 骷髅/毒液
  ground:   'M2 17l10-15 10 15H2z',                              // 地面 — 三角形/山
  flying:   'M16 4l4 4-8 8-8-8 4-4 4 4zM4 18h16',               // 飞行 — 翅膀
  psychic:  'M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 6v6l4 4',  // 超能力 — 大脑/星星
  bug:      'M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z M12 20v-2', // 虫 — 甲虫
  rock:     'M4 18L12 4l8 14H4z M8 18l4-8 4 8',                  // 岩石 — 岩石
  ghost:    'M8 2a4 4 0 0 0-4 4v6a8 8 0 0 0 16 0V6a4 4 0 0 0-4-4H8z M8 20v-2h8v2', // 幽灵 — 鬼魂
  dragon:   'M12 2C7 2 3 6 3 11s4 9 9 9 9-4 9-9-4-9-9-9zm-1 6h2v6h-2z m0 8h2v2h-2z', // 龙 — 龙头
  dark:     'M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', // 恶 — 黑洞/眼
  steel:    'M4 4h16v16H4V4zm3 3v10h10V7H7z',                       // 钢 — 盾牌
  fairy:    'M12 2l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z',           // 妖精 — 星星
}

/** 获取属性图标 SVG path */
export function getTypeIconPath(type: string): string {
  return TYPE_ICONS[type] || ''
}

/** 种族值条形图最大值参考 */
export const MAX_STAT_VALUE = 160

/** 种族值 key 顺序（HP/攻击/防御/特攻/特防/速度） */
export const STAT_ORDER = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const

/** 种族值 key → 中文名 */
export const STAT_NAME_ZH: Record<string, string> = {
  hp: 'HP',
  attack: '攻击',
  defense: '防御',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
}

/** 根据种族值数值返回进度条颜色（>=130红 / >=100橙 / >=70绿 / 其余灰） */
export function statColor(value: number): string {
  if (value >= 130) return '#ff4459'
  if (value >= 100) return '#ff922b'
  if (value >= 70) return '#51cf66'
  return '#adb5bd'
}

/** 获取属性颜色 */
export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || '#777'
}

/** 获取属性中文名 */
export function getTypeName(type: string): string {
  return TYPE_NAMES[type] || type
}

/** 版本分组（用于设置页分组展示） */
export interface VersionGroup {
  /** 分组标签，按地区分类，如 "关都地区" */
  label: string
  /** 该组包含的版本 keys */
  versions: GameVersion[]
}

/** 版本选择列表行（用于设置页版本选择器） */
export interface VersionRow {
  /** 显示名，如 "红/绿/蓝" */
  label: string
  /** 缩写，如 "RGB" */
  abbr: string
  /** 所属地区中文名，如 "关都" */
  region: string
  /** 该行包含的游戏版本 key 列表（选中时匹配任一） */
  keys: string[]
}

/** 按地区对 GAME_VERSIONS 进行分组（原按世代分组，现改为地区分类） */
export const VERSION_GROUPS: VersionGroup[] = [
  { label: '关都地区',   versions: GAME_VERSIONS.filter(v => v.gen === 1) }, // 红 / 蓝 / 黄
  { label: '城都地区',   versions: GAME_VERSIONS.filter(v => v.gen === 2) }, // 金 / 银 / 水晶
  { label: '丰缘地区',   versions: GAME_VERSIONS.filter(v => v.gen === 3) }, // 红宝石 / 蓝宝石 / 绿宝石 / 火红 / 叶绿
  { label: '神奥地区',   versions: GAME_VERSIONS.filter(v => v.gen === 4) }, // 钻石 / 珍珠 / 白金
  { label: '合众地区',   versions: GAME_VERSIONS.filter(v => v.gen === 5) }, // 黑 / 白 / 黑2 / 白2
  { label: '卡洛斯地区', versions: GAME_VERSIONS.filter(v => v.gen === 6) }, // X / Y / 始源红宝石 / 终极蓝宝石
  { label: '阿罗拉地区', versions: GAME_VERSIONS.filter(v => v.gen === 7) }, // 太阳 / 月亮 / 究极太阳 / 究极月亮
  { label: '伽勒尔地区', versions: GAME_VERSIONS.filter(v => v.gen === 8) }, // 剑 / 盾
  { label: '帕底亚地区', versions: GAME_VERSIONS.filter(v => v.gen === 9), }, // 朱 / 紫
]

/** 版本选择列表（整行可点击，格式：名称（缩写）），按地区分类 */
export const VERSION_ROWS: VersionRow[] = [
  { label: '红/绿/蓝',    abbr: 'RGB',  region: '关都', keys: ['red', 'blue'] },
  { label: '皮卡丘',      abbr: 'Ye',   region: '关都', keys: ['yellow'] },
  { label: '金/银',       abbr: 'GS',   region: '城都', keys: ['gold', 'silver'] },
  { label: '水晶',        abbr: 'C',    region: '城都', keys: ['crystal'] },
  { label: '红宝石/蓝宝石',abbr:'RS',  region: '丰缘', keys: ['ruby', 'sapphire'] },
  { label: '绿宝石',      abbr: 'E',    region: '丰缘', keys: ['emerald'] },
  { label: '火红/叶绿',   abbr: 'FRLG', region: '丰缘', keys: ['firered', 'leafgreen'] },
  { label: '钻石/珍珠',   abbr: 'DP',   region: '神奥', keys: ['diamond', 'pearl'] },
  { label: '白金',        abbr: 'Pt',   region: '神奥', keys: ['platinum'] },
  { label: '心金/魂银',   abbr: 'HGSS', region: '神奥', keys: ['heartgold', 'soulsilver'] },
  { label: '黑/白',       abbr: 'BW',   region: '合众', keys: ['black', 'white'] },
  { label: '黑 2/白 2',   abbr: 'BW2',  region: '合众', keys: ['black-2', 'white-2'] },
  { label: 'X/Y',         abbr: 'XY',   region: '卡洛斯', keys: ['x', 'y'] },
  { label: '欧米加红宝石/阿尔法蓝宝石', abbr: 'ΩRaS', region: '卡洛斯', keys: ['omega-ruby', 'alpha-sapphire'] },
  { label: '太阳/月亮',   abbr: 'SM',   region: '阿罗拉', keys: ['sun', 'moon'] },
  { label: '究极太阳/究极月亮', abbr: 'USUM', region: '阿罗拉', keys: ['ultra-sun', 'ultra-moon'] },
  { label: '剑/盾',       abbr: 'SwSh', region: '伽勒尔', keys: ['sword', 'shield'] },
  { label: '朱/紫',       abbr: 'SV',   region: '帕底亚', keys: ['scarlet', 'violet'] },
  { label: '宝可梦冠军',   abbr: 'PC',   region: '跨地区', keys: ['champions'] },
]

/**
 * 判断颜色是否为浅色（用于决定文字颜色）
 * 基于 YIQ 色彩空间亮度公式
 */
export function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128
}

/** 根据背景色返回合适的文字颜色 */
export function getTextColorOn(bgColor: string): string {
  return isLightColor(bgColor) ? '#1a1a1a' : '#ffffff'
}
