@echo off
setlocal
chcp 65001 >nul

echo ============================================
echo   宝可梦小图鉴 - 一键打包
echo ============================================

REM --- 1. Node (managed 22) ---
set "NODE_DIR=C:\Users\28166\.workbuddy\binaries\node\versions\22.22.2"
if exist "%NODE_DIR%\node.exe" (
  set "PATH=%NODE_DIR%;%PATH%"
  echo [OK] Node: %NODE_DIR%
) else (
  echo [WARN] 未找到 managed Node, 使用系统 PATH
)

REM --- 2. JDK 21 ---
set "JDK_HOME="
if exist "C:\Program Files\Java\jdk-21" (
  set "JDK_HOME=C:\Program Files\Java\jdk-21"
) else (
  for /f "delims=" %%d in ('dir /b "C:\Program Files\Java" 2^>nul ^| findstr /i "jdk-2"') do (
    set "JDK_HOME=C:\Program Files\Java\%%d"
    goto :jdk_found
  )
)
:jdk_found
if not defined JDK_HOME (
  if defined JAVA_HOME ( set "JDK_HOME=%JAVA_HOME%" ) else (
    echo [ERR] 未找到 JDK 21, 请安装到 C:\Program Files\Java\jdk-21
    pause
    exit /b 1
  )
)
set "JAVA_HOME=%JDK_HOME%"
set "GRADLE_USER_HOME=%USERPROFILE%\.gradle"
echo [OK] JDK: %JAVA_HOME%

REM --- 3. Gradle (cached, skip network) ---
set "GRADLE_BAT="
for /f "delims=" %%i in ('dir /s /b "%GRADLE_USER_HOME%\wrapper\dists\gradle.bat" 2^>nul ^| findstr /i "gradle-8.11.1"') do (
  set "GRADLE_BAT=%%i"
  goto :gradle_found
)
:gradle_found
if not defined GRADLE_BAT (
  echo [ERR] 未找到缓存的 Gradle 二进制
  pause
  exit /b 1
)
echo [OK] Gradle: %GRADLE_BAT%

REM --- 3.5 读取版本号 (src/config/index.ts 的 APP_CONFIG.version) ---
set "VER="
set "VER_FILE=%TEMP%\poke-version-%RANDOM%.tmp"
"%NODE_DIR%\node.exe" "%~dp0scripts\get-version.mjs" "%~dp0src\config\index.ts" > "%VER_FILE%" 2>&1
if %errorlevel% neq 0 (
  echo [ERR] 无法从 src/config/index.ts 读取版本号
  type "%VER_FILE%"
  pause
  exit /b 1
)
set /p VER=<"%VER_FILE%"
del /f /q "%VER_FILE%" >nul 2>&1
if not defined VER (
  echo [ERR] 读取到的版本号为空
  pause
  exit /b 1
)
echo [OK] 版本号: %VER%

REM --- 4. args ---
set "FLAVOR=debug"
set "DO_CLEAN=0"
if /i "%~1"=="release" set "FLAVOR=release"
if /i "%~1"=="clean" set "DO_CLEAN=1"
if /i "%FLAVOR%"=="release" echo [WARN] release 包需已在 build.gradle 配置 signingConfigs + keystore

REM --- 5. sprites (offline images) ---
set "SPRITE_DIR=%~dp0public\sprites"
set "SPRITE_COUNT=0"
for /f %%c in ('dir /b "%SPRITE_DIR%\*.png" 2^>nul ^| find /c /v ""') do set "SPRITE_COUNT=%%c"
if %SPRITE_COUNT% LSS 1000 (
  echo [WARN] 精灵图缺失 %SPRITE_COUNT%/1025, 尝试自动下载
  if exist "%~dp0scripts\download-sprites.mjs" (
    "%NODE_DIR%\node.exe" "%~dp0scripts\download-sprites.mjs" || echo [WARN] 精灵图下载失败
  ) else (
    echo [WARN] 未找到 download-sprites.mjs, 跳过
  )
) else (
  echo [OK] 精灵图齐全 %SPRITE_COUNT% 张
)

REM --- 6. Web build ---
echo.
echo ==^> 构建 Web 资源 (npm run build)
call "%NODE_DIR%\npm.cmd" run build
if errorlevel 1 (
  echo [ERR] Web 构建失败
  pause
  exit /b 1
)
echo [OK] Web 构建完成

REM --- 7. sync to android ---
echo.
echo ==^> 同步资源到 Android (npx cap sync android)
call "%NODE_DIR%\npx.cmd" cap sync android
if errorlevel 1 (
  echo [ERR] cap sync 失败
  pause
  exit /b 1
)
echo [OK] 资源已同步

REM --- 8. optional clean ---
if %DO_CLEAN%==1 (
  echo.
  echo ==^> gradle clean
  call "%GRADLE_BAT%" -p "%~dp0android" clean
)

REM --- 9. assemble APK ---
echo.
echo ==^> 打包 APK (%FLAVOR%)
call "%GRADLE_BAT%" -p "%~dp0android" --no-daemon assemble%FLAVOR%
if errorlevel 1 (
  echo [ERR] APK 构建失败
  pause
  exit /b 1
)

set "APK=%~dp0android\app\build\outputs\apk\%FLAVOR%\app-%FLAVOR%.apk"
if not exist "%APK%" (
  echo [ERR] 未找到产物: %APK%
  pause
  exit /b 1
)

REM --- 9.5 复制为「宝可梦小图鉴_v版本.apk」到 app版本 文件夹 ---
set "OUT_DIR=%~dp0app版本"
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
if /i "%FLAVOR%"=="release" (
  set "OUT_NAME=宝可梦小图鉴_v%VER%_release.apk"
) else (
  set "OUT_NAME=宝可梦小图鉴_v%VER%.apk"
)
copy "%APK%" "%OUT_DIR%\%OUT_NAME%" >nul
if exist "%OUT_DIR%\%OUT_NAME%" (
  echo [OK] 已生成发布文件: %OUT_NAME%
) else (
  echo [WARN] 重命名失败, 请手动使用原始产物
)

echo.
echo ============================================
echo   打包完成!
echo   版本: %VER%
echo   APK: %APK%
echo   发布文件: %OUT_DIR%\%OUT_NAME%
echo ============================================
pause
exit /b 0
