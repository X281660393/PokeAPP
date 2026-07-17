// ============================================================================
// 数据层统一出口（分类导出）
// ----------------------------------------------------------------------------
// 后续新增 / 更新数据，请按分类放到对应子目录，本文件负责统一再导出：
//
//   pokemon/  宝可梦本体：物种图鉴库、版本/筛选辅助、超进化、进化链、地区分类
//   moves/    招式库（由 scripts/build-pokemon-extra.mjs 生成）
//   abilities/ 特性库（由 scripts/build-pokemon-extra.mjs 生成）
//   items/    道具库（手动维护，已按 精灵球/进化石/回复/… 分类）
//   battle/   战斗环境：异常状态 / 场地 / 天气 / 工具列表 + 属性相克矩阵
//   relations.ts 派生反向索引（招式 ↔ 宝可梦、特性 ↔ 宝可梦）
// ============================================================================

// —— 宝可梦本体 ——
export * from './pokemon/pokemon'
export * from './pokemon/pokemon-db'
export * from './pokemon/pokemon-mega'
export * from './pokemon/pokemon-evo'
export * from './pokemon/pokemon-regions'

// —— 招式 ——
export * from './moves/pokemon-moves'

// —— 特性 ——
export * from './abilities/pokemon-abilities'

// —— 道具 ——
export * from './items/pokemon-items'

// —— 战斗环境（异常状态 / 场地 / 天气 / 工具 + 相克矩阵）——
export * from './battle/pokemon-status'
export * from './battle/pokemon-terrain'
export * from './battle/pokemon-weather'
export * from './battle/tools'

// —— 派生反向索引（招式 / 特性 ↔ 宝可梦）——
export * from './relations'
