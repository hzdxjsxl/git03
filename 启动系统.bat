@echo off
chcp 65001 >nul
echo ========================================
echo 实时手语翻译系统 - 启动器
echo ========================================
echo.
echo [1/2] 检查模型文件...
if not exist "models\hand_landmarker.task" (
    echo 下载手部关键点检测模型...
    python -c "import urllib.request; urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', 'models/hand_landmarker.task')"
    echo 模型下载完成！
) else (
    echo 模型文件已存在
)
echo.
echo [2/2] 启动系统...
echo.
python main.py
echo.
echo 系统已退出
pause
