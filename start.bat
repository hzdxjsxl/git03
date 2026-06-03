@echo off
chcp 65001 >nul
title EmoVoice - 音频情绪识别系统

echo ========================================
echo   EmoVoice 音频情绪识别系统
echo   一键启动脚本
echo ========================================
echo.

echo [步骤 1/3] 生成模型权重...
cd backend
if not exist "model_weights\emotion_cnn.pt" (
    python generate_demo_weights.py
)
cd ..
echo 完成!
echo.

echo [步骤 2/3] 安装后端依赖...
cd backend
pip install -r requirements.txt -q
cd ..
echo 完成!
echo.

echo [步骤 3/3] 启动服务...
echo.
echo ========================================
echo   后端服务:  http://localhost:8000
echo   前端页面:  http://localhost:8080
echo   API文档:   http://localhost:8000/docs
echo ========================================
echo.
echo 正在启动后端服务 (端口 8000)...
start "EmoVoice 后端" cmd /k "cd backend && python server.py"

timeout /t 3 /nobreak >nul

echo 正在启动前端服务 (端口 8080)...
start "EmoVoice 前端" cmd /k "cd frontend && python -m http.server 8080"

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   所有服务已启动!
echo   请在浏览器打开: http://localhost:8080
echo ========================================
echo.
echo 关闭本窗口不会停止服务
echo 如需停止，请关闭弹出的两个命令行窗口
echo.
pause
