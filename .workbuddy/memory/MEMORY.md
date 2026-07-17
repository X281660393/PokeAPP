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
│   │   ├── items/           # 道具库（pokemon-items.ts，手动维护，已按分类）
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
