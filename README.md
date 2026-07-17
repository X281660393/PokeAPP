<div align="center">

<img src="./public/pokeball.svg" width="96" alt="Pokeball" />

# 宝可梦小图鉴 · PokeAPP

一个基于 **Vue 3 + Vite + Vant** 打造的移动端宝可梦图鉴，支持图鉴查询、详情、进化链与多种对战小工具，并可通过 **Capacitor** 一键打包为 Android APP。

<p>
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6.2-646cff?logo=vite&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white" />
  <img alt="Vant" src="https://img.shields.io/badge/Vant-4.9-07c160" />
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-7.2-119eff?logo=capacitor&logoColor=white" />
</p>

### 🔗 在线预览

| 类型 | 链接 |
| :--: | :-- |
| 🌐 **网页版（GitHub Pages）** | **[x281660393.github.io/PokeAPP](https://x281660393.github.io/PokeAPP/)** |
| 🎨 **原型设计（Axure）** | **[axureshow.com/project/S5ITcYFb](https://www.axureshow.com/project/S5ITcYFb/#/)** |
| 📱 **Android APP** | 见 [`app版本/`](./app版本/) 目录下的 APK |

</div>

---

## ✨ 功能特性

- **📖 宝可梦图鉴**：全国图鉴列表，支持按名称 / 编号搜索、属性筛选
- **🔍 详情页**：种族值、属性、身高体重、特性（含隐藏特性）、可学招式
- **🧬 进化链**：可视化展示进化关系与进化条件
- **🛠️ 对战小工具**：
  - 招式查询（Move Search）
  - 特性查询（Ability Search）
  - 道具查询（Item Search）
  - 异常状态查询（Status）
  - 天气 / 场地效果查询（Weather / Terrain）
  - 努力值计算器（EV Calc）
  - 队伍构筑与属性克制分析（Team Builder）
- **⚙️ 个性化设置**：主题、数据源等配置项
- **📱 移动端优先**：基于 Vant 的移动端 UI，适配刘海屏，支持 Capacitor 打包为原生 App

## 🖼️ 界面预览

> 目录结构与设计参考：[`重构后的_src_目录结构.png`](./重构后的_src_目录结构.png)

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:8080）
npm run dev

# 3. 构建生产版本（产物在 dist/）
npm run build

# 4. 本地预览构建产物
npm run preview
```

### 📦 打包 Android APP

```bash
# 构建 Web 并同步到 Android 工程
npm run build:android

# 打开 Android Studio
npm run cap:open
```

> Windows 用户也可直接运行根目录的 [`app一键打包.bat`](./app一键打包.bat)，详见 [`打包说明.md`](./打包说明.md)。

## 🧱 技术栈

| 分类 | 技术 |
| :-- | :-- |
| 前端框架 | Vue 3（Composition API）+ TypeScript |
| 构建工具 | Vite 6 |
| UI 组件库 | Vant 4 |
| 状态管理 | Pinia |
| 路由 | Vue Router（Hash 模式） |
| 原生打包 | Capacitor 7（Android） |
| 数据处理 | ExcelJS（Excel → 本地数据集） |

## 📂 目录结构

```
PokeAPP/
├── src/
│   ├── views/          # 页面（图鉴 / 工具 / 设置）
│   ├── components/      # 通用组件（卡片、属性标签、种族值条…）
│   ├── data/           # 宝可梦 / 招式 / 特性 / 道具等数据集
│   ├── stores/         # Pinia 状态（图鉴、设置）
│   ├── composables/    # 组合式函数
│   ├── router/         # 路由配置
│   └── main.ts         # 入口
├── scripts/            # 数据构建脚本（Excel → TS、精灵图下载等）
├── data-excel/         # 源数据 Excel
├── android/            # Capacitor Android 工程
├── public/             # 静态资源
└── vite.config.ts
```

## 🗃️ 数据来源

宝可梦数据整理自 [PokeAPI](https://pokeapi.co/) 及本地 Excel 数据集，通过 `scripts/` 下的构建脚本生成为本地 TypeScript 数据模块，实现离线可用。

## 📄 许可

本项目仅用于学习交流。宝可梦（Pokémon）相关名称、形象版权归 Nintendo / Game Freak / The Pokémon Company 所有。

---

<div align="center">
如果这个项目对你有帮助，欢迎点一个 ⭐ Star！
</div>
