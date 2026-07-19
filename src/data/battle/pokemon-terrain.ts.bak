// 此文件由 scripts/data-excel.mjs 从 Excel 导回生成。
import type { TerrainInfo } from '@/types'

export const TERRAIN_DB: Record<string, TerrainInfo> = {
  "none": {
    nameZh: "无场地",
    descZh: "没有特殊场地的通常状态。",
    effectzh: "无特殊场地时，所有场地相关的特性、招式与增益效果均不发动。",
    relatedAbilities: [],
    relatedMoves: []
  },
  "electric": {
    nameZh: "电气场地",
    descZh: "脚下带电的场地。电属性招式威力提升，且不会陷入睡眠状态。由「电气制造者」「强子引擎」等特性或招式「电气场地」引发。",
    effectzh: "脚下带电的场地。电属性招式威力提升为 1.5×；处于场地的宝可梦不会陷入睡眠状态，「食梦」无法命中。由特性「电气制造者」「强子引擎」或招式「电气场地」引发，特性引发为永久，招式引发持续 5 回合。",
    relatedAbilities: ["electric-surge", "hadron-engine"],
    relatedMoves: ["electric-terrain"]
  },
  "grassy": {
    nameZh: "青草场地",
    descZh: "长满青草的场地。草属性招式威力提升，地面上的宝可梦每回合回复少量HP。由「青草制造者」「掉出种子」等特性或招式「青草滑梯」引发。",
    effectzh: "长满青草的场地。草属性招式威力提升为 1.5×；处于地面上的宝可梦每回合回复最大HP的 1/16。拥有青草毛皮特性的宝可梦防御提升 50%。由特性「青草制造者」「掉出种子」或招式「青草滑梯」引发，招式引发持续 5 回合。",
    relatedAbilities: ["grassy-surge", "seed-sower", "grass-pelt"],
    relatedMoves: ["grassy-glide"]
  },
  "misty": {
    nameZh: "薄雾场地",
    descZh: "飘浮薄雾的场地。龙属性招式威力下降，且宝可梦不会陷入状态异常。由「薄雾制造者」等特性或招式「薄雾场地」引发。",
    effectzh: "飘浮薄雾的场地。龙属性招式威力下降为 0.5×；处于场地的宝可梦不会陷入任何异常状态（中毒、麻痹、灼伤、冰冻、睡眠、混乱、着迷等），「自我暗示」也无法命中。由特性「薄雾制造者」或招式「薄雾场地」引发，招式引发持续 5 回合。",
    relatedAbilities: ["misty-surge"],
    relatedMoves: ["misty-terrain"]
  },
  "psychic": {
    nameZh: "精神场地",
    descZh: "充满精神能量的场地。先制招式无法命中，超能力属性招式威力提升。由「精神制造者」等特性或招式「精神场地」引发。",
    effectzh: "充满精神能量的场地。优先度大于 0 的先制招式无法命中处于场地的宝可梦；超能力属性招式威力提升为 1.5×。由特性「精神制造者」或招式「精神场地」引发，招式引发持续 5 回合。",
    relatedAbilities: ["psychic-surge"],
    relatedMoves: ["psychic-terrain"]
  },
}
