@echo off
echo ========================================
echo   AI 图片风格迁移 - 后端服务启动
echo ========================================
echo.

cd backend

if not exist venv (
    echo [1/3] 创建 Python 虚拟环境...
    python -m venv venv
)

echo [2/3] 激活虚拟环境并安装依赖...
call venv\Scripts\activate
pip install -r requirements.txt

echo.
echo [3/3] 启动后端服务...
echo 服务地址: http://localhost:5000
echo 按 Ctrl+C 停止服务
echo.

python app.py

pause
