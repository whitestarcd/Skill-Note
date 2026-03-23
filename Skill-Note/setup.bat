@echo off
echo ====================================
echo Skill-Note 项目安装脚本
echo ====================================
echo.

echo [1/3] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未检测到 Node.js，请先安装 Node.js (https://nodejs.org/)
    pause
    exit /b 1
)
echo Node.js 已安装

echo.
echo [2/3] 安装依赖...
call npm install
if errorlevel 1 (
    echo 错误：依赖安装失败
    pause
    exit /b 1
)

echo.
echo [3/3] 启动开发服务器...
echo.
echo ====================================
echo 安装完成！
echo 浏览器将自动打开 http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo ====================================
echo.

call npm run dev
