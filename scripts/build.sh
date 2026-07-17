#!/bin/bash
# 构建 Web 应用 + 同步 dist
# 用法: bash scripts/build.sh

source "$(dirname "$0")/common.sh"

sync_src

info "构建 Web 应用..."
cd "$TEMP_DIR"
$NPM exec vite build

sync_dist
success "构建完成，产物在 dist/ 目录"
