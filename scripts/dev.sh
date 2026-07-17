#!/bin/bash
# 启动开发服务器
# 用法: bash scripts/dev.sh

source "$(dirname "$0")/common.sh"

sync_src

info "启动 Vite 开发服务器..."
cd "$TEMP_DIR"
$NPM exec vite -- --host 0.0.0.0
