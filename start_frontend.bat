@echo off
echo ========================================
echo   AI 图片风格迁移 - 前端服务启动
echo ========================================
echo.

cd frontend

echo [1/2] 检查并安装依赖...
if not exist node_modules (
    npm install
)

echo.
echo [2/2] 启动前端开发服务器...
echo 访问地址: http://localhost:3000
echo 按 Ctrl+C 停止服务
echo.

npm run dev

pause
