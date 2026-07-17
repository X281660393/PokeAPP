#!/bin/bash
# 构建 Android 应用（Web 构建 + Capacitor 同步）
# 用法: bash scripts/build-android.sh
# 前提: 已安装 Android Studio 并配置好 Android SDK

source "$(dirname "$0")/common.sh"

sync_src

info "构建 Web 应用..."
cd "$TEMP_DIR"
$NPM exec vite build

info "同步 Capacitor..."
$NPM exec cap sync android

sync_dist
sync_android

success "Android 构建准备完成！"
info "下一步: 用 Android Studio 打开 android/ 目录编译 APK"
