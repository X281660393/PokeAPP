// 拉取超进化种族值并写回 src/data/pokemon/pokemon-mega.ts
// 通过 /pokemon-species/{baseId} 的 varieties(is_mega) 找到 mega 的 pokemon slug，
// 再 fetch /pokemon/{slug} 得到 stats，按 nameEn 后缀(X/Y)匹配回原表单。
import { readFileSync, writeFileSync } from "fs";

const SRC = "src/data/pokemon/pokemon-mega.ts";
const raw = readFileSync(SRC, "utf8");

// 解析现有表单（nameZh / nameEn / stoneZh），按 baseId 分组
const lines = raw.split("\n");
const result = {};
let curId = null;
for (const line of lines) {
  const idm = line.match(/^\s*(\d+):\s*/);
  if (idm) {
    curId = +idm[1];
    if (!result[curId]) result[curId] = [];
  }
  const fm = line.match(/nameZh:\s*'([^']+)',\s*nameEn:\s*'([^']+)',\s*stoneZh:\s*'([^']+)'/);
  if (fm && curId != null) {
    const exists = result[curId].some((f) => f.nameEn === fm[2]);
    if (!exists) result[curId].push({ nameZh: fm[1], nameEn: fm[2], stoneZh: fm[3], stats: null });
  }
}

const baseIds = Object.keys(result).map(Number);
console.log(`解析到 ${baseIds.length} 个基础形态，共 ${(baseIds).reduce((a,id)=>a+result[id].length,0)} 个表单`);

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

// 并发限制
async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

await mapLimit(baseIds, 5, async (id) => {
  try {
    const sp = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    // PokeAPI 的 varieties 不返回 is_mega 字段，用 slug 含 "-mega"（且非 "-gmax"）判断超进化形态
    const megaVars = (sp.varieties || []).filter(
      (v) => v.pokemon.name.includes("-mega") && !v.pokemon.name.includes("-gmax")
    );
    for (const v of megaVars) {
      const slug = v.pokemon.name; // e.g. venusaur-mega / charizard-mega-x / charizard-mega-y
      let suffix = "";
      if (slug.endsWith("-mega-x")) suffix = "X";
      else if (slug.endsWith("-mega-y")) suffix = "Y";
      const nameEn = result[id].find((f) =>
        suffix === "" ? !f.nameEn.includes("-") : f.nameEn.endsWith("-" + suffix)
      )?.nameEn;
      const poke = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${slug}`);
      const stats = {};
      for (const s of poke.stats) stats[s.stat.name] = s.base_stat;
      const target = result[id].find((f) => f.nameEn === nameEn) || result[id][0];
      if (target) {
        target.stats = stats;
        console.log(`  ✓ ${id} ${target.nameZh} (${slug})`, stats);
      } else {
        console.error(`  ✗ ${id} 无法匹配 ${slug} 到已知表单`);
      }
    }
  } catch (e) {
    console.error(`  ✗ base ${id} 失败:`, e.message);
  }
});

// 生成文件
let out = `// 超进化（Mega Evolution）数据
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
`;

for (const id of baseIds) {
  out += `  ${id}: [\n`;
  for (const f of result[id]) {
    const statsStr = f.stats
      ? JSON.stringify(f.stats).replace(/,/g, ", ").replace(/:/g, ": ")
      : "null";
    out += `    { nameZh: '${f.nameZh}', nameEn: '${f.nameEn}', stoneZh: '${f.stoneZh}', stats: ${statsStr} },\n`;
  }
  out += `  ],\n`;
}
out += `}\n`;

writeFileSync(SRC, out, "utf8");
const filled = baseIds.reduce((a, id) => a + result[id].filter((f) => f.stats).length, 0);
console.log(`\n已写回 ${SRC}，填充种族值的表单数：${filled}`);
