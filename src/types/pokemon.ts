/** 宝可梦列表项 */
export interface PokemonListItem {
  id: number
  name: string
  nameZh: string
  types: string[]
  spriteUrl: string
  /** 该宝可梦出现的官方游戏版本列表（英文 key，用于版本筛选） */
  gameVersions?: string[]
}

/** 宝可梦详情 */
export interface PokemonDetail {
  id: number
  name: string
  nameZh: string
  types: string[]
  spriteUrl: string
  height: number
  weight: number
  stats: PokemonStat[]
  abilities: string[]
  /** 隐藏特性（仅含隐藏特性的 "中文(en)" 字符串，与 abilities 同格式） */
  hiddenAbilities: string[]
  /** 所属世代（1-9），按编号区间自动归属，可在 Excel 中调整 */
  gen?: number
  /** 所属地区（中文名，如 关都），按编号区间自动归属，可在 Excel 中调整 */
  region?: string
  description: string
  genera: string
}

/** 种族值单项 */
export interface PokemonStat {
  name?: string
  nameZh: string
  value: number
  key?: string
}

/** 工具项 */
export interface ToolItem {
  id: string
  name: string
  icon: string
  color: string
  desc: string
  /** 是否已实现可用（false 则显示在「即将上线」分区） */
  ready?: boolean
}

/** 属性相克数据 */
export interface TypeMatchup {
  strong: string[]
  weak: string[]
  immune: string[]
}

/** 技能信息（共享表，按英文名索引，key 即 nameEn） */
export interface MoveInfo {
  nameZh: string
  /** 技能属性（英文 key，如 grass / fire） */
  type: string
  /** physical(物理) / special(特殊) / status(变化) */
  category: string
  power: number | null
  accuracy: number | null
  pp: number | null
  /** 引入世代（1-9），用于列表/详情标注，可在 Excel 中调整 */
  gen: number
}

/** 单只宝可梦的技能引用（只存英文名 + 等级，详情查 MOVE_DB） */
export interface PokemonMoves {
  /** 升级可学习：name=技能英文名，level=学会等级 */
  level: { name: string; level: number }[]
  /** 蛋生可学习：技能英文名 */
  egg: string[]
  /** 学习机可学习：技能英文名 */
  machine: string[]
}

/** 特性信息（共享表，按英文名索引，key 即 nameEn） */
export interface AbilityInfo {
  nameZh: string
  /** 特性中文描述 */
  descZh: string
  /** 特性介绍（与 descZh 可能不同，详情页「特性介绍」块使用） */
  intro?: string
  /** 特性详细效果说明（含换行，详情页「效果」块使用） */
  effectzh?: string
}

/** 详情页使用的已解析特性（中文名 + 英文名 + 是否隐藏特性） */
export interface ParsedAbility {
  nameEn: string
  nameZh: string
  isHidden: boolean
  descZh: string
}

/** 进化链节点（只存 id + 进化方式，展示信息从图鉴列表查） */
export interface EvoNode {
  /** 该形态宝可梦 id */
  id: number
  /** 进化到该节点所需条件（如 "Lv.16" / "使用火之石" / "交换"），根节点为空 */
  method: string
  /** 后续进化 */
  evolvesTo: EvoNode[]
}

/** 超进化形态信息 */
export interface MegaForm {
  nameZh: string
  nameEn: string
  /** 所需超进化石（如 "妙蛙花进化石"） */
  stoneZh: string
  /** 超进化后种族值（key: hp/attack/defense/special-attack/special-defense/speed） */
  stats: Record<string, number>
}

/** 道具信息（共享表，按英文 slug 索引，key 即 slug） */
export interface ItemInfo {
  nameZh: string
  /** 道具日文名（可选） */
  nameJa?: string
  /** 道具英文全名（可选，如 "Poké Ball"） */
  nameEn?: string
  /** 道具分类（直接父分类，如 野外使用的道具 / 携带物品 / 精灵球 / 贵重道具） */
  category: string
  /** 道具图标相对路径（可选，如 ./items/poke-ball.png；缺失则不填） */
  icon?: string
  /** 道具中文描述 */
  descZh: string
  /** 道具详细效果说明（含换行，可在 Excel 中编辑） */
  effectzh?: string
}

/** 天气信息（共享表，按英文名索引，key 即 nameEn） */
export interface WeatherInfo {
  nameZh: string
  /** 天气中文描述 */
  descZh: string
  /** 天气详细效果（对战机制说明） */
  effectzh?: string
  /** 相关特性英文名（对应 ABILITY_DB 的 key），用于跨链接 */
  relatedAbilities?: string[]
}

/** 场地信息（共享表，按英文名索引，key 即 nameEn） */
export interface TerrainInfo {
  nameZh: string
  /** 场地中文描述 */
  descZh: string
  /** 场地详细效果（对战机制说明） */
  effectzh?: string
  /** 相关特性英文名（对应 ABILITY_DB 的 key） */
  relatedAbilities?: string[]
  /** 相关招式英文名（对应 MOVE_DB 的 key） */
  relatedMoves?: string[]
}

/** 异常状态信息（共享表，按英文名索引，key 即 nameEn） */
export interface StatusInfo {
  nameZh: string
  /** 状态颜色（用于标识） */
  color: string
  /** 异常状态中文描述 */
  descZh: string
  /** 异常状态详细效果（对战机制说明） */
  effectzh?: string
  /** 相关特性英文名（对应 ABILITY_DB 的 key） */
  relatedAbilities?: string[]
  /** 相关招式英文名（对应 MOVE_DB 的 key） */
  relatedMoves?: string[]
}
