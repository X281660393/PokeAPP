#!/bin/bash
# Capacitor 初始化（首次设置时运行一次）
# 用法: bash scripts/cap-init.sh

source "$(dirname "$0")/common.sh"

sync_src

info "初始化 Capacitor..."
cd "$TEMP_DIR"

# 先构建 dist
$NPM exec vite build

# 添加 Android 平台
$NPM exec cap add android

sync_dist
sync_android

success "Capacitor 初始化完成！"
info "Android 工程在 android/ 目录，用 Android Studio 打开编译"
