import type { ToolItem, TypeMatchup } from '@/types'

export const TOOLS: ToolItem[] = [
  {
    id: "type-matchup",
    name: "属性相克表",
    icon: "⚔️",
    color: "#e74c3c",
    desc: "查看各属性间的克制关系",
    ready: true
  },
  {
    id: "ev-calc",
    name: "努力值计算",
    icon: "🔢",
    color: "#3498db",
    desc: "规划努力值分配方案",
    ready: true
  },
  {
    id: "move-search",
    name: "招式查询",
    icon: "🎯",
    color: "#9b59b6",
    desc: "搜索和查看招式详情",
    ready: true
  },
  {
    id: "ability-search",
    name: "特性查询",
    icon: "✨",
    color: "#f1c40f",
    desc: "查看所有特性及效果",
    ready: true
  },
  {
    id: "item-search",
    name: "道具查询",
    icon: "🎒",
    color: "#e67e22",
    desc: "搜索查看道具详情",
    ready: true
  },
  {
    id: "weather-search",
    name: "天气查询",
    icon: "🌤️",
    color: "#3498db",
    desc: "查看各类天气效果",
    ready: true
  },
  {
    id: "terrain-search",
    name: "场地查询",
    icon: "🟩",
    color: "#27ae60",
    desc: "查看各类场地效果",
    ready: true
  },
  {
    id: "status-search",
    name: "异常状态查询",
    icon: "💢",
    color: "#e74c3c",
    desc: "查看中毒/麻痹等状态",
    ready: true
  },
  {
    id: "team-builder",
    name: "队伍组建",
    icon: "👥",
    color: "#1abc9c",
    desc: "组建对战队伍",
    ready: false
  },
]

export const TOOL_MAP: Record<string, ToolItem> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t]),
)

export const TYPE_MATCHUP_DATA: Record<string, TypeMatchup> = {
  "normal": {
    strong: [],
    weak: ["rock", "steel"],
    immune: ["ghost"]
  },
  "fire": {
    strong: ["grass", "ice", "bug", "steel"],
    weak: ["fire", "water", "rock", "dragon"],
    immune: []
  },
  "water": {
    strong: ["fire", "ground", "rock"],
    weak: ["water", "grass", "dragon"],
    immune: []
  },
  "electric": {
    strong: ["water", "flying"],
    weak: ["electric", "grass", "dragon"],
    immune: ["ground"]
  },
  "grass": {
    strong: ["water", "ground", "rock"],
    weak: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
    immune: []
  },
  "ice": {
    strong: ["grass", "ground", "flying", "dragon"],
    weak: ["fire", "water", "ice", "steel"],
    immune: []
  },
  "fighting": {
    strong: ["normal", "ice", "rock", "dark", "steel"],
    weak: ["poison", "flying", "psychic", "bug", "fairy"],
    immune: []
  },
  "poison": {
    strong: ["grass", "fairy"],
    weak: ["poison", "ground", "rock", "ghost"],
    immune: ["steel"]
  },
  "ground": {
    strong: ["fire", "electric", "poison", "rock", "steel"],
    weak: ["grass", "bug"],
    immune: ["flying"]
  },
  "flying": {
    strong: ["grass", "fighting", "bug"],
    weak: ["electric", "rock", "steel"],
    immune: []
  },
  "psychic": {
    strong: ["fighting", "poison"],
    weak: ["psychic", "steel"],
    immune: ["dark"]
  },
  "bug": {
    strong: ["grass", "psychic", "dark"],
    weak: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
    immune: []
  },
  "rock": {
    strong: ["fire", "ice", "flying", "bug"],
    weak: ["fighting", "ground", "steel"],
    immune: []
  },
  "ghost": {
    strong: ["psychic", "ghost"],
    weak: ["dark"],
    immune: ["normal"]
  },
  "dragon": {
    strong: ["dragon"],
    weak: ["steel"],
    immune: ["fairy"]
  },
  "dark": {
    strong: ["psychic", "ghost"],
    weak: ["fighting", "dark", "fairy"],
    immune: []
  },
  "steel": {
    strong: ["ice", "rock", "fairy"],
    weak: ["fire", "water", "electric", "steel"],
    immune: []
  },
  "fairy": {
    strong: ["fighting", "dragon", "dark"],
    weak: ["fire", "poison", "steel"],
    immune: []
  },
}

export const DEFENSE_MATRIX: Record<string, Record<string, number>> = {
  "normal": {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 0.5,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 0.5,
    ghost: 0,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1
  },
  "fire": {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 1,
    grass: 2,
    ice: 2,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 2,
    psychic: 1,
    bug: 2,
    rock: 0.5,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 2,
    fairy: 1
  },
  "water": {
    normal: 1,
    fire: 2,
    water: 0.5,
    electric: 1,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 2,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 2,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 1,
    fairy: 1
  },
  "electric": {
    normal: 1,
    fire: 1,
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 0,
    flying: 2,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 1,
    fairy: 1
  },
  "grass": {
    normal: 1,
    fire: 0.5,
    water: 2,
    electric: 1,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    psychic: 1,
    bug: 0.5,
    rock: 2,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 0.5,
    fairy: 1
  },
  "ice": {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 1,
    grass: 2,
    ice: 0.5,
    fighting: 1,
    poison: 1,
    ground: 2,
    flying: 2,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 1,
    steel: 0.5,
    fairy: 1
  },
  "fighting": {
    normal: 2,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 2,
    fighting: 0.5,
    poison: 0.5,
    ground: 1,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dragon: 1,
    dark: 2,
    steel: 2,
    fairy: 0.5
  },
  "poison": {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 2,
    ice: 1,
    fighting: 0.5,
    poison: 0.5,
    ground: 0.5,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 0.5,
    ghost: 0.5,
    dragon: 1,
    dark: 1,
    steel: 0,
    fairy: 2
  },
  "ground": {
    normal: 1,
    fire: 2,
    water: 1,
    electric: 2,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 2,
    ground: 1,
    flying: 0,
    psychic: 1,
    bug: 0.5,
    rock: 2,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 2,
    fairy: 1
  },
  "flying": {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 0.5,
    grass: 2,
    ice: 1,
    fighting: 2,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 2,
    rock: 0.5,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1
  },
  "psychic": {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 2,
    poison: 2,
    ground: 1,
    flying: 1,
    psychic: 0.5,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0,
    steel: 0.5,
    fairy: 1
  },
  "bug": {
    normal: 1,
    fire: 0.5,
    water: 1,
    electric: 1,
    grass: 2,
    ice: 1,
    fighting: 0.5,
    poison: 0.5,
    ground: 1,
    flying: 0.5,
    psychic: 2,
    bug: 0.5,
    rock: 1,
    ghost: 0.5,
    dragon: 1,
    dark: 2,
    steel: 0.5,
    fairy: 0.5
  },
  "rock": {
    normal: 1,
    fire: 2,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 2,
    fighting: 0.5,
    poison: 1,
    ground: 0.5,
    flying: 2,
    psychic: 1,
    bug: 2,
    rock: 1,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1
  },
  "ghost": {
    normal: 0,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 2,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0.5,
    steel: 1,
    fairy: 1
  },
  "dragon": {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 1,
    steel: 0.5,
    fairy: 0
  },
  "dark": {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 0.5,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 2,
    bug: 2,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0.5,
    steel: 1,
    fairy: 0.5
  },
  "steel": {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    grass: 1,
    ice: 2,
    fighting: 0.5,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 2,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 2
  },
  "fairy": {
    normal: 1,
    fire: 0.5,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 2,
    poison: 0.5,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 2,
    dark: 2,
    steel: 0.5,
    fairy: 1
  },
}

export const CHART_ORDER = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"] as const

export function getMatchupCell(atkType: string, defType: string): {
  value: number
  label: string
} {
  const value = DEFENSE_MATRIX[atkType]?.[defType] ?? 1
  let label: string
  if (value === 2) label = '2×'
  else if (value === 0.5) label = '½×'
  else if (value === 0) label = '0×'
  else label = '1×'
  return { value, label }
}

/** 获取单元格背景色类名 */
export function getMatchupCellClass(value: number): string {
  if (value === 2) return 'cell-super'
  if (value === 0.5) return 'cell-not'
  if (value === 0) return 'cell-immune'
  return 'cell-normal'
}
