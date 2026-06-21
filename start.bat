@echo off
chcp 65001 >nul
echo ============================================================
echo   工业流水线零件表面缺陷视觉检测平台
echo   启动脚本
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)
echo ✓ Python 环境正常
echo.

echo [2/3] 安装依赖...
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo 警告: 依赖安装可能遇到问题，尝试继续...
)
echo ✓ 依赖安装完成
echo.

echo [3/3] 启动服务...
echo.
echo ============================================================
echo   服务启动成功！
echo   请在浏览器中打开: http://localhost:5000
echo   按 Ctrl+C 停止服务
echo ============================================================
echo.

cd backend
python app.py

pause
