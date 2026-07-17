#!/bin/bash
# 安装/更新依赖
# 用法: bash scripts/install.sh

source "$(dirname "$0")/common.sh"

sync_src

info "安装依赖..."
cd "$TEMP_DIR"
$NPM install

sync_node_modules
success "依赖安装完成！"
