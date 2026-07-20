@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  宝可梦小图鉴 - 一键打包 (双击运行)
REM  流程: npm run build:android -> gradle assembleDebug -> 复制重命名 APK
REM  说明: build:android 只做网页构建+同步, 不会出 APK, 故补一步 gradle
REM  日志: 每次运行写入项目根目录 build.log, 出错请把最后几行发给我
REM ============================================================

set "LOG=%~dp0build.log"
echo [%date% %time%] ========== 打包开始 ========== >> "%LOG%"

REM --- 写日志的小助手: 同时打印到屏幕和 build.log ---
set "TITLE=宝可梦小图鉴 一键打包"
goto :main

:log
echo %*
echo %* >> "%LOG%"
goto :eof

:fail
echo.
echo [失败] 已写入日志: %LOG%
echo %date% %time% [FAIL] %* >> "%LOG%"
pause
exit

:main
echo ===============================================
echo          %TITLE%
echo ===============================================

REM --- 定位项目目录 (bat 放在 PokeAPP 根目录, 或其上一级) ---
set "PROJ=%~dp0"
if "%PROJ:~-1%"=="\" set "PROJ=%PROJ:~0,-1%"
if exist "%PROJ%\src\config\index.ts" goto :proj_ok
if exist "%PROJ%\PokeAPP\src\config\index.ts" (
  set "PROJ=%PROJ%\PokeAPP"
  goto :proj_ok
)
call :fail 找不到项目目录, 请把本 bat 放在 PokeAPP 根目录 (或它的上一级目录)

:proj_ok
cd /d "%PROJ%" || call :fail 无法进入项目目录: %PROJ%
call :log [OK] 项目目录: %PROJ%

REM --- Node 环境 (优先 managed, 否则系统 PATH) ---
set "NODE_DIR=C:\Users\28166\.workbuddy\binaries\node\versions\22.22.2"
if exist "%NODE_DIR%\node.exe" (
  set "PATH=%NODE_DIR%;%PATH%"
  call :log [OK] Node: %NODE_DIR%
) else (
  where node >nul 2>&1
  if errorlevel 1 call :fail 未找到 Node.js, 请安装 Node 22 或确认在 PATH 中
  call :log [OK] Node: 系统 PATH
)

REM --- JDK 21 (gradle 需要) ---
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
if exist "%JAVA_HOME%\bin\javac.exe" (
  set "PATH=%JAVA_HOME%\bin;%PATH%"
  call :log [OK] JDK: %JAVA_HOME%
) else (
  call :fail 未找到 JDK 21: %JAVA_HOME%
)

REM --- 读取版本号 (src/config/index.ts 中的 version: 'x.y.z') ---
set "VER="
for /f "tokens=2 delims='" %%A in ('findstr /r "version\s*:" "src\config\index.ts"') do set "VER=%%A"
if not defined VER call :fail 无法从 src/config/index.ts 读取版本号
call :log [OK] 版本号: %VER%

REM --- 步骤 1/3: 构建网页并同步到安卓 ---
echo.
echo [1/3] npm run build:android (vite build + cap sync android)
call :log [1/3] npm run build:android
call npm run build:android
if errorlevel 1 call :fail 构建失败 (npm run build:android)
call :log [OK] 网页构建与同步完成

REM --- 步骤 2/3: 用 gradle 打出 debug APK (失败自动重试一次) ---
echo.
echo [2/3] gradle assembleDebug (生成 APK)
set "GRADLE_TRY=1"
:gradle_retry
call :log [2/3] gradle assembleDebug 尝试 %GRADLE_TRY%
cd android
call gradlew.bat assembleDebug --no-daemon
set "GRADLE_RC=%errorlevel%"
cd ..
if %GRADLE_RC% neq 0 (
  if %GRADLE_TRY% lss 2 (
    set /a GRADLE_TRY+=1
    call :log [WARN] gradle 首次失败, 1 秒后重试
    timeout /t 1 >nul
    goto :gradle_retry
  )
  call :fail APK 构建失败 (gradle assembleDebug)
)
call :log [OK] gradle assembleDebug 完成

REM --- 步骤 3/3: 复制并重命名 APK ---
echo.
echo [3/3] 复制并重命名 APK
set "SRC=android\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%SRC%" call :fail 未找到产物: %SRC%
set "DST_DIR=app版本"
if not exist "%DST_DIR%" mkdir "%DST_DIR%"
set "DST=%DST_DIR%\宝可梦小图鉴v%VER%.apk"
copy /Y "%SRC%" "%DST%" >nul
if errorlevel 1 call :fail 复制 APK 失败
call :log [OK] 已生成: %DST%

echo.
echo ============================================
echo [完成] 已生成: %DST%
echo ============================================
@REM explorer /select,"%DST%"
echo %date% %time% [DONE] %DST% >> "%LOG%"
pause
