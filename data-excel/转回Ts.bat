@echo off
title Excel -^> 数据(TS) 导回
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
"%NODE_EXE%" scripts\data-excel.mjs import

echo.
echo ============================================
echo  导回完成！
echo  数据已写回 src\data\（覆盖前已自动 .bak 备份）
echo  可运行 npm run dev 预览，或 app一键打包.bat 出包
echo ============================================
pause
exit /b 0
