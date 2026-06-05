@echo off
echo ========================================
echo   AI 图片风格迁移服务 - 一键启动
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 检查前端构建...
if not exist "frontend\dist" (
    echo 正在构建前端...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

echo.
echo [2/4] 检查后端环境...
cd backend
if not exist "venv" (
    echo 创建 Python 虚拟环境...
    python -m venv venv
)

echo.
echo [3/4] 安装依赖...
call venv\Scripts\activate
pip install flask flask-cors pillow -q
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q

echo.
echo [4/4] 启动服务...
echo ========================================
echo   服务启动中，请稍候...
echo ========================================
echo   访问地址: http://localhost:5000
echo   按 Ctrl+C 停止服务
echo ========================================
echo.

python app.py

pause
