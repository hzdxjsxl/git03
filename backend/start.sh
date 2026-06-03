#!/bin/bash
echo "========================================"
echo "  EmoVoice 后端服务启动"
echo "========================================"
echo ""

if [ ! -f "model_weights/emotion_cnn.pt" ]; then
    echo "[1/3] 正在生成测试用模型权重..."
    python generate_demo_weights.py
    echo ""
fi

echo "[2/3] 检查依赖包..."
python3 -c "import fastapi, torch, librosa, soundfile" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "正在安装依赖包..."
    pip install -r requirements.txt
fi

echo ""
echo "[3/3] 启动后端服务 (端口 8000)..."
echo ""
echo "服务地址: http://localhost:8000"
echo "API文档:  http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo "========================================"
echo ""

python3 server.py
