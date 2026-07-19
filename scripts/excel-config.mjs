/**
 * 数据表 <-> Excel 双向转换配置
 * ---------------------------------------------------------------
 * 每个表声明：xlsx 里 Sheet 名、TS 源文件路径、导出常量名、类型名、
 * 以及字段列定义（字段如何展开成 Excel 列、导入时如何还原）。
 *
 * field.kind 取值：
 *   'id'       主键列（record 的 key / 数组的主键），导出但视为系统字段
 *   'str'      字符串标量
 *   'num'      数字标量
 *   'numOrNull' 数字或空（招式的威力/命中/PP，可为 null）
 *   'bool'     布尔（工具的 ready）
 *   'arr'      字符串数组，导出时用 sep 连接，导入时按逗号拆分
 *   'stats'    宝可梦种族值，按 statKey 从 stats 数组取/写单个数值列
 *
 * editable: true 的列是建议用户在 Excel 里修改的；其余为系统/只读字段。
 */
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

/** 种族值固定顺序（与 build-pokemon-db.mjs 一致） */
const STAT_FIELDS = [
  { statKey: 'hp', name: 'HP' },
  { statKey: 'attack', name: '攻击' },
  { statKey: 'defense', name: '防御' },
  { statKey: 'special-attack', name: '特攻' },
  { statKey: 'special-defense', name: '特防' },
  { statKey: 'speed', name: '速度' },
]

/** 18 个属性的固定顺序（与 tools.ts 中 CHART_ORDER 一致） */
export const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric',
  'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark',
  'steel', 'fairy',
]

/** 导出 xlsx 的目标路径 */
export const OUT_XLSX = resolve(ROOT, 'data-excel/宝可梦小图鉴_数据.xlsx')

/**
 * 数据表清单（覆盖 App 内全部静态数据，每个表一个中文 Sheet）：
 *   宝可梦 / 道具 / 招式 / 特性 / 天气 / 场地 / 异常状态 / 小工具 / 属性相克 / 防御矩阵
 * tools.ts 含多个导出（TOOLS / TYPE_MATCHUP_DATA / DEFENSE_MATRIX 等），
 * 这里拆成多个 TABLES 条目但指向同一文件，导入时按文件整体重建。
 */
export const TABLES = [
  {
    sheet: '宝可梦',
    file: resolve(ROOT, 'src/data/pokemon/pokemon-db.ts'),
    constName: 'POKEMON_DB',
    kind: 'array',
    typeName: 'PokemonFull',
    // 复合表：一行同时来自 pokemon-db.ts（基础信息 + 世代）与 pokemon-moves.ts（技能）
    composite: true,
    movesFile: resolve(ROOT, 'src/data/moves/pokemon-moves.ts'),
    movesConst: 'POKEMON_MOVES',
    fields: [
      { name: '编号', src: 'id', kind: 'num', sys: true },
      { name: '英文名', src: 'name', kind: 'str', sys: true },
      { name: '中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '属性', src: 'types', kind: 'arr', sep: ', ', editable: true },
      { name: '图片URL', src: 'spriteUrl', kind: 'str', sys: true },
      { name: '身高(dm)', src: 'height', kind: 'num', sys: true },
      { name: '体重(hg)', src: 'weight', kind: 'num', sys: true },
      ...STAT_FIELDS.map((f) => ({
        name: f.name,
        src: 'stats',
        kind: 'stats',
        statKey: f.statKey,
        editable: true,
      })),
      { name: '特性', src: 'abilities', kind: 'arr', sep: ', ', editable: true },
      { name: '隐藏特性', src: 'hiddenAbilities', kind: 'arr', sep: ', ', editable: true },
      { name: '世代', src: 'gen', kind: 'num', editable: true },
      { name: '地区', src: 'region', kind: 'str', editable: true },
      { name: '分类', src: 'genera', kind: 'str', editable: true },
      { name: '描述', src: 'description', kind: 'str', editable: true },
      { name: '升级技能', src: 'levelMoves', kind: 'arr', sep: ', ', editable: true, from: 'moves' },
      { name: '机器技能', src: 'machineMoves', kind: 'arr', sep: ', ', editable: true, from: 'moves' },
      { name: '遗传技能', src: 'eggMoves', kind: 'arr', sep: ', ', editable: true, from: 'moves' },
    ],
  },
  {
    sheet: '道具',
    file: resolve(ROOT, 'src/data/items/pokemon-items.ts'),
    constName: 'ITEM_DB',
    kind: 'record',
    typeName: 'ItemInfo',
    fields: [
      { name: '英文名', src: 'key', kind: 'id', sys: true },
      { name: '中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '日文名', src: 'nameJa', kind: 'str', editable: true, optional: true },
      { name: '英文全名', src: 'nameEn', kind: 'str', editable: true, optional: true },
      { name: '分类', src: 'category', kind: 'str', editable: true },
      { name: '图标', src: 'icon', kind: 'str', editable: true, optional: true },
      { name: '描述', src: 'descZh', kind: 'str', editable: true },
      { name: '效果', src: 'effectzh', kind: 'str', editable: true, optional: true },
    ],
  },
  {
    sheet: '招式',
    file: resolve(ROOT, 'src/data/moves/pokemon-moves.ts'),
    constName: 'MOVE_DB',
    kind: 'record',
    typeName: 'MoveInfo',
    fields: [
      { name: '英文名', src: 'key', kind: 'id', sys: true },
      { name: '中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '属性', src: 'type', kind: 'str', editable: true },
      { name: '类别', src: 'category', kind: 'str', editable: true },
      { name: '威力', src: 'power', kind: 'numOrNull', editable: true },
      { name: '命中', src: 'accuracy', kind: 'numOrNull', editable: true },
      { name: 'PP', src: 'pp', kind: 'numOrNull', editable: true },
      { name: '世代', src: 'gen', kind: 'num', editable: true },
    ],
  },
  {
    sheet: '特性',
    file: resolve(ROOT, 'src/data/abilities/pokemon-abilities.ts'),
    constName: 'ABILITY_DB',
    kind: 'record',
    typeName: 'AbilityInfo',
    fields: [
      { name: '英文名', src: 'key', kind: 'id', sys: true },
      { name: '中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '描述', src: 'descZh', kind: 'str', editable: true },
      { name: '效果', src: 'effectzh', kind: 'str', editable: true, optional: true },
    ],
  },
  {
    sheet: '天气',
    file: resolve(ROOT, 'src/data/battle/pokemon-weather.ts'),
    constName: 'WEATHER_DB',
    kind: 'record',
    typeName: 'WeatherInfo',
    fields: [
      { name: '英文名', src: 'key', kind: 'id', sys: true },
      { name: '中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '描述', src: 'descZh', kind: 'str', editable: true },
      { name: '效果', src: 'effectzh', kind: 'str', editable: true, optional: true },
      { name: '相关特性', src: 'relatedAbilities', kind: 'arr', sep: ', ', editable: true },
    ],
  },
  {
    sheet: '场地',
    file: resolve(ROOT, 'src/data/battle/pokemon-terrain.ts'),
    constName: 'TERRAIN_DB',
    kind: 'record',
    typeName: 'TerrainInfo',
    fields: [
      { name: '英文名', src: 'key', kind: 'id', sys: true },
      { name: '中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '描述', src: 'descZh', kind: 'str', editable: true },
      { name: '效果', src: 'effectzh', kind: 'str', editable: true, optional: true },
      { name: '相关特性', src: 'relatedAbilities', kind: 'arr', sep: ', ', editable: true },
      { name: '相关招式', src: 'relatedMoves', kind: 'arr', sep: ', ', editable: true },
    ],
  },
  {
    sheet: '异常状态',
    file: resolve(ROOT, 'src/data/battle/pokemon-status.ts'),
    constName: 'STATUS_DB',
    kind: 'record',
    typeName: 'StatusInfo',
    fields: [
      { name: '英文名', src: 'key', kind: 'id', sys: true },
      { name: '中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '颜色', src: 'color', kind: 'str', editable: true },
      { name: '描述', src: 'descZh', kind: 'str', editable: true },
      { name: '效果', src: 'effectzh', kind: 'str', editable: true, optional: true },
      { name: '相关特性', src: 'relatedAbilities', kind: 'arr', sep: ', ', editable: true },
      { name: '相关招式', src: 'relatedMoves', kind: 'arr', sep: ', ', editable: true },
    ],
  },
  {
    sheet: '小工具',
    file: resolve(ROOT, 'src/data/battle/tools.ts'),
    constName: 'TOOLS',
    kind: 'array',
    typeName: 'ToolItem',
    fields: [
      { name: 'id', src: 'id', kind: 'str', sys: true },
      { name: '名称', src: 'name', kind: 'str', editable: true },
      { name: '图标', src: 'icon', kind: 'str', sys: true },
      { name: '颜色', src: 'color', kind: 'str', sys: true },
      { name: '描述', src: 'desc', kind: 'str', editable: true },
      { name: '已就绪', src: 'ready', kind: 'bool', editable: true },
    ],
  },
  {
    sheet: '属性相克',
    file: resolve(ROOT, 'src/data/battle/tools.ts'),
    constName: 'TYPE_MATCHUP_DATA',
    kind: 'record',
    typeName: 'TypeMatchup',
    fields: [
      { name: '属性', src: 'key', kind: 'id', sys: true },
      { name: '效果绝佳', src: 'strong', kind: 'arr', sep: ',', editable: true },
      { name: '效果不佳', src: 'weak', kind: 'arr', sep: ',', editable: true },
      { name: '无效', src: 'immune', kind: 'arr', sep: ',', editable: true },
    ],
  },
  {
    sheet: '防御矩阵',
    file: resolve(ROOT, 'src/data/battle/tools.ts'),
    constName: 'DEFENSE_MATRIX',
    kind: 'matrix',
    matrixKeyHeader: '攻击属性',
    matrixKeys: ALL_TYPES,
  },
  {
    sheet: '招式描述',
    file: resolve(ROOT, 'src/data/moves/pokemon-move-descriptions.ts'),
    constName: 'MOVE_DESCRIPTIONS',
    kind: 'record',
    typeName: 'MoveDesc',
    // 用英文名(主键)反查 MOVE_DB 的中文名作为只读参考列
    serialize: 'moveDesc',
    fields: [
      { name: '英文名', src: 'key', kind: 'id', sys: true },
      {
        name: '中文名',
        src: 'nameZh',
        kind: 'fk',
        sys: true,
        lookupFile: resolve(ROOT, 'src/data/moves/pokemon-moves.ts'),
        lookupConst: 'MOVE_DB',
        lookupField: 'nameZh',
      },
      { name: '介绍', src: 'intro', kind: 'str', optional: true, editable: true },
      { name: '描述', src: 'description', kind: 'str', optional: true, editable: true },
      { name: '技能效果', src: 'effect', kind: 'arr', sep: ', ', optional: true, editable: true },
      { name: '附加效果', src: 'additionalEffect', kind: 'str', optional: true, editable: true },
      { name: '范围', src: 'range', kind: 'str', optional: true, editable: true },
    ],
  },
  {
    sheet: '图鉴描述',
    file: resolve(ROOT, 'src/data/pokemon/pokedex-descriptions.ts'),
    constName: 'POKEDEX_DESCRIPTIONS',
    kind: 'matrix',
    matrixKind: 'str',
    matrixKeyHeader: '编号',
    // 列（各游戏版本）在导出时按数据动态收集，导入时按 Sheet 表头识别
    serialize: 'pokedex',
  },
  {
    sheet: '超级进化',
    file: resolve(ROOT, 'src/data/pokemon/pokemon-mega.ts'),
    constName: 'MEGA_EVOLUTIONS',
    kind: 'mega',
    typeName: 'MegaForm',
    // 每个基础宝可梦一行一个形态；stats 为六维种族值
    serialize: 'mega',
    fields: [
      { name: '基础编号', src: 'baseId', kind: 'id', sys: true },
      { name: '超进化中文名', src: 'nameZh', kind: 'str', editable: true },
      { name: '英文名', src: 'nameEn', kind: 'str', editable: true },
      { name: '进化石', src: 'stoneZh', kind: 'str', editable: true },
      { name: 'HP', src: 'stats', kind: 'stats', statKey: 'hp', editable: true },
      { name: '攻击', src: 'stats', kind: 'stats', statKey: 'attack', editable: true },
      { name: '防御', src: 'stats', kind: 'stats', statKey: 'defense', editable: true },
      { name: '特攻', src: 'stats', kind: 'stats', statKey: 'special-attack', editable: true },
      { name: '特防', src: 'stats', kind: 'stats', statKey: 'special-defense', editable: true },
      { name: '速度', src: 'stats', kind: 'stats', statKey: 'speed', editable: true },
    ],
  },
  {
    sheet: '进化链',
    file: resolve(ROOT, 'src/data/pokemon/pokemon-evo.ts'),
    constName: 'EVO_TREES',
    kind: 'tree',
    typeName: 'EvoNode',
    // 嵌套进化树在 Excel 中展开为「边表」：根编号 / 是否根 / 源编号 / 进化方式 / 目标编号
    serialize: 'tree',
    fields: [
      { name: '根编号', src: 'rootId', kind: 'num', sys: true },
      { name: '是否根', src: 'isRoot', kind: 'bool', sys: true },
      { name: '源编号', src: 'fromId', kind: 'num', sys: true },
      { name: '进化方式', src: 'method', kind: 'str', editable: true },
      { name: '目标编号', src: 'toId', kind: 'num', sys: true },
    ],
  },
]
