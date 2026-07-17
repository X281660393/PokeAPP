#!/bin/bash
# ============================================
# WorkBuddy Android Vue 开发脚本
# 所有 npm/node 操作需在无中文路径下执行
# 此脚本将源码同步到临时目录后执行操作
# ============================================

set -e

WORKSPACE="C:/Users/28166/WorkBuddy/安卓"
TEMP_DIR="/tmp/android-vue-temp"
NODE="C:/Users/28166/.workbuddy/binaries/node/versions/22.22.2/node.exe"
NPM="C:/Users/28166/.workbuddy/binaries/node/versions/22.22.2/npm.cmd"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# 同步源码到临时目录
sync_src() {
  info "同步源码到临时目录..."
  mkdir -p "$TEMP_DIR/src/router"
  mkdir -p "$TEMP_DIR/src/stores"
  mkdir -p "$TEMP_DIR/src/views"
  mkdir -p "$TEMP_DIR/public"

  # 配置文件
  cp "$WORKSPACE/package.json" "$TEMP_DIR/"
  cp "$WORKSPACE/vite.config.ts" "$TEMP_DIR/"
  cp "$WORKSPACE/tsconfig.json" "$TEMP_DIR/"
  cp "$WORKSPACE/tsconfig.app.json" "$TEMP_DIR/"
  cp "$WORKSPACE/tsconfig.node.json" "$TEMP_DIR/"
  cp "$WORKSPACE/env.d.ts" "$TEMP_DIR/"
  cp "$WORKSPACE/index.html" "$TEMP_DIR/"
  cp "$WORKSPACE/capacitor.config.ts" "$TEMP_DIR/" 2>/dev/null || true

  # 源码
  cp "$WORKSPACE/src/main.ts" "$TEMP_DIR/src/"
  cp "$WORKSPACE/src/App.vue" "$TEMP_DIR/src/"
  cp "$WORKSPACE/src/style.css" "$TEMP_DIR/src/"
  cp "$WORKSPACE/src/router/index.ts" "$TEMP_DIR/src/router/" 2>/dev/null || true
  cp "$WORKSPACE/src/stores/app.ts" "$TEMP_DIR/src/stores/" 2>/dev/null || true
  cp "$WORKSPACE/src/views/"*.vue "$TEMP_DIR/src/views/" 2>/dev/null || true

  # Public 资源
  cp -r "$WORKSPACE/public/"* "$TEMP_DIR/public/" 2>/dev/null || true

  success "源码同步完成"
}

# 同步 node_modules 回工作区
sync_node_modules() {
  info "同步 node_modules 回工作区..."
  cp "$TEMP_DIR/package.json" "$WORKSPACE/"
  cp "$TEMP_DIR/package-lock.json" "$WORKSPACE/" 2>/dev/null || true
  cp -r "$TEMP_DIR/node_modules" "$WORKSPACE/"
  success "node_modules 同步完成"
}

# 同步构建产物回工作区
sync_dist() {
  info "同步 dist 回工作区..."
  cp -r "$TEMP_DIR/dist" "$WORKSPACE/" 2>/dev/null || true
  success "dist 同步完成"
}

# 同步 Android 工程回工作区
sync_android() {
  info "同步 android/ 回工作区..."
  cp -r "$TEMP_DIR/android" "$WORKSPACE/" 2>/dev/null || true
  success "android/ 同步完成"
}
