@echo off
title 数据(TS) -^> Excel 导出
setlocal

REM 项目根 = 本 bat 所在目录的上一级（data-excel\..）
REM 定位 node 可执行文件（优先 WorkBuddy 自带的 managed node）
set "NODE_EXE=%USERPROFILE%\.workbuddy\binaries\node\versions\22.22.2\node.exe"
if not exist "%NODE_EXE%" (
  for /f "delims=" %%n in ('where node 2^>nul') do (
    set "NODE_EXE=%%n"
    goto :have_node
  )
)
:have_node
if not exist "%NODE_EXE%" (
  echo [错误] 找不到 node.exe，请先安装 Node.js 或检查 WorkBuddy 的 managed node 路径
  pause
  exit /b 1
)

REM 切到项目根目录执行转换脚本
cd /d "%~dp0.."
"%NODE_EXE%" scripts\data-excel.mjs export

echo.
echo ============================================
echo  导出完成！
echo  文件保存在 data-excel\宝可梦小图鉴_数据.xlsx
echo  若 Excel 正打开该文件，请关闭后重新导出
echo ============================================
pause
exit /b 0
