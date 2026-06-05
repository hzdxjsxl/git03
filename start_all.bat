@echo off
echo ========================================
echo   AI 图片风格迁移服务 - 一键启动
echo ========================================
echo.

echo 正在启动后端服务...
start "后端服务" cmd /k "cd backend && if not exist venv (python -m venv venv) && call venv\Scripts\activate && pip install -r requirements.txt && python app.py"

echo 等待后端初始化...
timeout /t 5 /nobreak > nul

echo.
echo 正在启动前端服务...
start "前端服务" cmd /k "cd frontend && if not exist node_modules (npm install) && npm run dev"

echo.
echo ========================================
echo   服务启动中，请等待...
echo ========================================
echo.
echo 后端: http://localhost:5000
echo 前端: http://localhost:3000
echo.
echo 两个终端窗口将分别运行后端和前端服务
echo 关闭此窗口不会停止服务
echo.
pause
