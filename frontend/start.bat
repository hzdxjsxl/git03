@echo off
chcp 65001 >nul
echo ========================================
echo   EmoVoice 前端服务启动
echo ========================================
echo.
echo [1/1] 启动前端 HTTP 服务 (端口 8080)...
echo.
echo 访问地址: http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8080
