# poke 项目记忆

## 项目概况
- 路径：`C:/Users/28166/Desktop/poke/`
- 类型：Vue 3 + Capacitor Android 应用
- appId：com.example.androidvueapp
- **显示名：宝可梦小图鉴**（capacitor.config.ts appName / strings.xml / index.html title）
- **图标：自绘精灵球**（Pillow 程序化生成，`scripts/make-icon.py`；网站 favicon `public/pokeball.svg`）
- 原路径：`C:/Users/28166/WorkBuddy/安卓/`（已迁移至桌面）

## 技术栈
- Vue 3 (Composition API + `<script setup>`)
- Vite 6 构建
- TypeScript
- Vue Router 4（hash 模式，适配 Capacitor file://）
- Pinia 3 状态管理
- Vant 4 移动端 UI 组件库
- Capacitor 7 原生桥接

## 开发流程
新路径无中文字符，npm 可直接运行：

| 操作 | 命令 |
|------|------|
| 启动开发 | `npm run dev` |
| 构建 Web | `npm run build` |
| 安装依赖 | `npm install` |
| 构建 Android | `npm run build && npx cap sync android` |

`scripts/` 辅助脚本仍保留，但不再必需（仅供备用）。

## 项目结构（2026-07-17 数据按地区分类优化后）
```
poke/
├── src/
│   ├── main.ts              # 入口（挂载 Pinia + Router）
│   ├── App.vue              # 根组件（router-view + tabbar + 过渡动画）
│   ├── assets/              # 本地资源（预留）
│   ├── components/          # 可复用组件
│   │   ├── index.ts         # 统一导出
│   │   ├── TypeBadge.vue    # 属性徽章（sm/md 两种尺寸）
│   │   ├── PokemonCard.vue  # 宝可梦列表卡片
│   │   ├── StatBar.vue      # 种族值条形图
│   │   ├── ArrowIcon.vue    # CSP 安全内联 SVG 箭头（4 方向）
│   │   ├── DetailNav.vue    # 统一详情导航栏（返回+标题）
│   │   └── InfoCard.vue     # 统一信息卡片（标题+slot）
│   ├── composables/         # Vue composables（预留）
│   ├── constants/           # 常量定义
│   │   ├── index.ts
│   │   └── pokemon.ts       # TYPE_COLORS / TYPE_NAMES / STAT_ORDER / STAT_NAME_ZH / statColor / VERSION_ROWS 等
│   ├── data/                # 静态数据（按分类分子目录；index.ts 统一导出）
│   │   ├── index.ts         # 分类再导出（宝可梦/招式/特性/道具/战斗环境/派生）
│   │   ├── relations.ts     # 派生反向索引（招式↔宝可梦、特性↔宝可梦）
│   │   ├── pokemon/         # 宝可梦本体
│   │   │   ├── pokemon.ts       # ALL_POKEMON / withVersions / spriteFor / getPokemonById
│   │   │   ├── pokemon-db.ts    # POKEMON_DB（1025只，脚本生成）
│   │   │   ├── pokemon-mega.ts  # MEGA_EVOLUTIONS 超进化
│   │   │   ├── pokemon-evo.ts   # EVO_ROOT + EVO_TREES 进化链
│   │   │   └── pokemon-regions.ts # 【新增】按地区分类：POKEMON_BY_REGION / REGION_LIST / MEGA_BY_REGION
│   │   ├── moves/           # 招式库（pokemon-moves.ts，脚本生成）
│   │   ├── abilities/       # 特性库（pokemon-abilities.ts，脚本生成）
│   │   ├── items/           # 道具库（pokemon-items.ts → 单一 `ITEM_DB` 扁平字面量，102 条）
│   │   └── battle/          # 战斗环境
│   │       ├── pokemon-status.ts   # 异常状态
│   │       ├── pokemon-terrain.ts  # 场地
│   │       ├── pokemon-weather.ts  # 天气
│   │       └── tools.ts            # TOOLS 工具列表 + DEFENSE_MATRIX 相克表
│   ├── router/index.ts      # 路由配置（hash 模式）
│   ├── stores/
│   │   └── pokedex.ts       # Pinia store（搜索/筛选/详情）
│   ├── styles/
│   │   └── global.css       # 全局样式 + CSS 变量 + Vant 主题覆盖
│   ├── types/               # TypeScript 类型定义
│   │   ├── index.ts
│   │   └── pokemon.ts       # PokemonListItem / PokemonDetail / ToolItem 等
│   ├── utils/               # 工具函数（预留）
│   └── views/               # 按功能分组的页面
│       ├── pokedex/
│       │   ├── Pokedex.vue
│       │   └── PokemonDetail.vue
│       ├── tools/
│       │   ├── Tools.vue
│       │   └── ToolDetail.vue
│       └── settings/
│           └── Settings.vue
├── android/                 # Capacitor Android 原生工程
├── capacitor.config.ts      # Capacitor 配置
├── scripts/                 # 开发辅助脚本（不再必需）
├── vite.config.ts           # Vite 配置（alias @, base ./）
└── package.json
```

### 重构要点
- 类型、常量、数据从 store 中拆分到独立模块（types/ constants/ data/）
- 可复用组件提取到 components/（TypeBadge、PokemonCard、StatBar）
- views 按功能分组到子目录（pokedex/ tools/ settings/）
- 全局样式移至 styles/global.css
- 删除未使用的 stores/app.ts（旧模板 counter demo）
- 每个模块目录都有 index.ts 统一导出，方便导入
- 2026-07-17：data/ 按分类拆为 pokemon/ moves/ abilities/ items/ battle/ 子目录；新增 pokemon-regions.ts 按地区（关都…帕底亚）派生分类宝可梦，并更新 4 个生成脚本与所有导入路径，保证后续可重新生成数据

### 道具数据（2026-07-19 重写为 1425 条）
- `src/data/items/pokemon-items.ts` 现由 **`scripts/build-items.mjs`** 从 `C:/Users/28166/Desktop/pokemon-dataset-zh-main/data/item_list.json` 生成（1425 条，替代旧 102 条手工维护）。改道具数据请**改 JSON 源或调脚本后重跑 `node scripts/build-items.mjs`**，不要手编 TS。
- ITEM_DB 每条字段：`nameZh` / `nameJa?` / `nameEn?` / `category`(直接父分类) / `icon?`(`./items/{key}.png`) / `descZh`(数组描述已 join '\n')。`ItemInfo` 类型已同步扩展这 3 个可选字段。
- **key 策略**：slug(name_en)+去重后缀（与旧 102 条英文 slug 风格一致；`Poké Ball`→`poke-ball`）。`name_en` 有 39 重复、19 重音，不能直接当 key。
- **图标**：`build-items.mjs` 把 `data/images/items/{中文名}.png` 复制到 `public/items/{key}.png`（共 1422 张；17 个数组图标取首个存在帧；3 个真缺图不写 icon 字段；旧英文 slug 同名图标作回退）。`public/items/` 现已 1422 个图标，离线可用。
- `src/views/tools/ItemSearch.vue`：分类由硬编码 8 个改为从 ITEM_DB 动态派生（25 个叶子分类）；搜索含 nameZh/nameEn/nameJa/key；详情展示 nameEn+nameJa+icon；已删除引用未提供字段（description/price/attributes/effect）的死模板块。
- `scripts/excel-config.mjs` 的「道具」表已扩到 7 列（英文名/中文名/日文名/英文全名/分类/图标/描述），新字段标 `optional: true`，保证转Excel/转回Ts 往返不丢字段（已验证：导出 1425→导入 1425，0 警告）。
- 保留 `scripts/data-excel.mjs` + `excel-config.mjs`：通用 Excel 往返工具。

### data-excel 工具链（2026-07-19 v2 优化）
- `scripts/data-excel.mjs` 已优化为 v2：① `lit()` 修复对象 key 不加引号的 bug（`special-attack` 等连字符 key 现正确输出 `'special-attack'`）；② `lit()` 支持嵌套缩进；③ `loadTS()` 加文件级缓存（tools.ts 三张表/复合表的 movesFile/外键 lookup 不再重复加载）；④ import 时 xlsx 被 Excel 占用给友好提示；⑤ 全局 `warnCount` 收集警告末尾汇总；⑥ 跳过 Excel 末尾空行（用第一列判断，不依赖 `field.kind==='id'`，因宝可梦"编号"/小工具"id"的 kind 不是 'id'）；⑦ 新增 `--dry-run` 选项；⑧ 末尾打印总表数/总行数/耗时。
- CLI: `node scripts/data-excel.mjs export [path]` / `import [path] [--dry-run]`；bat 文件不变。
- 同步修复 `src/data/pokemon/pokemon-mega.ts` 的语法 bug：`special-attack:` / `special-defense:` 未加引号（旧 lit() 生成），esbuild 严格解析会报错。已手动加引号修复（纯语法，不改语义）。
- 验证：export 14 张表 5141 行 → dry-run import 14 张表 5141 行，行数完全一致，0 警告。
- 现有 `data-excel/宝可梦小图鉴_数据.xlsx` 是 7 月 18 日旧版（只有 10 张表，缺招式描述/图鉴描述/超级进化/进化链）。要更新到 14 张表，跑一次 `转Excel.bat` 即可。
- **effectzh 字段（2026-07-19 增加）**：特性/道具/天气/场地/异常 五类数据的 TS/类型/excel-config 均已加 `effectzh?`（「详细效果说明」，区别于 `descZh` 叙事描述）。道具的 effectzh 暂无数据源，留空待 Excel 填。新增 `scripts/add-effectzh.mjs` 可一键从 `.bak` + `abilities/*.json` 重新注入。五张表已在 excel-config 加「效果」列（optional），round-trip 不丢。天气/场地/异常经 `CodexSearch.vue` 自动显示 effectzh；特性在 `AbilityDetail.vue`/`AbilitySearch.vue` 显示；道具在 `ItemSearch.vue` 详情显示。
