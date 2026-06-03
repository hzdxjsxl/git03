# EmoVoice - 音频情绪识别系统

基于深度学习的实时音频情绪识别Web应用。用户通过浏览器录音后，系统能够分析并识别语音中的情绪状态（愤怒、开心、悲伤）。

## 架构理念

**简化架构，职责分离：**
- **前端**：负责音频流采集、重采样降噪、波形图绘制、情绪标签样式渲染
- **后端**：仅负责加载推理模型、返回概率数组，不干涉任何其他业务

## 项目结构

```
w:\ATraePro\3\
├── backend\                    # 后端服务
│   ├── model.py               # 模型定义（独立文件）
│   ├── preprocess.py          # 音频预处理（独立文件）
│   ├── server.py              # API服务（独立文件）
│   ├── generate_demo_weights.py  # 生成测试权重
│   ├── requirements.txt       # Python依赖清单
│   ├── start.bat              # 后端启动脚本
│   └── model_weights\         # 模型权重目录
│       ├── README.md
│       └── emotion_cnn.pt     # 权重文件（自动生成）
└── frontend\                   # 前端应用
    ├── index.html             # HTML页面
    ├── start.bat              # 前端启动脚本
    ├── css\
    │   └── style.css          # 样式文件
    └── js\
        └── app.js             # 核心逻辑
```

## 快速开始（30秒启动）

### 快速测试模式（推荐，无需PyTorch）

如果想快速测试前后端连通性，使用 **极简版后端**：

**终端1 - 后端（仅需 fastapi+uvicorn+numpy）：**
```bash
cd backend
python server_simple.py
```

**终端2 - 前端：**
```bash
cd frontend
python -m http.server 8080
```

**浏览器打开：** http://localhost:8080

> 极简版使用简单规则模拟情绪识别，用于快速验证管道是否打通。

---

### 完整模型模式（需PyTorch）

安装完整依赖后使用真正的深度学习模型：

**终端1 - 后端：**
```bash
cd backend
pip install -r requirements.txt
python generate_demo_weights.py
python server.py
```

**终端2 - 前端：**
```bash
cd frontend
python -m http.server 8080
```

---

### Windows 一键启动

双击根目录下的 `start.bat` （安装完整依赖模式）

---

### 三种后端模式对比

| 模式 | 文件 | 依赖 | 特点 |
|------|------|------|------|
| 极简模式 | `server_simple.py` | fastapi, uvicorn, numpy | 最快启动，用于调试连通性 |
| 轻量模式 | `server_light.py` | + soundfile | 完整音频处理，无深度学习 |
| 完整模式 | `server.py` | + torch, librosa | 真正的深度学习模型 |

**所有模式API接口完全一致，前端代码无需修改。**

## 依赖清单

### Python 后端依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| fastapi | 0.104.1 | Web框架 |
| uvicorn | 0.24.0 | ASGI服务器 |
| python-multipart | 0.0.6 | 文件上传处理 |
| torch | 2.1.0 | 深度学习框架 |
| torchaudio | 2.1.0 | 音频处理 |
| numpy | 1.24.3 | 数值计算 |
| scipy | 1.11.4 | 信号处理 |
| librosa | 0.10.1 | 音频特征提取 |
| soundfile | 0.12.1 | 音频文件读写 |

### 前端依赖

无需安装任何包，使用原生浏览器API：
- Web Audio API（音频处理）
- MediaRecorder API（录音）
- Canvas API（波形绘制）
- Fetch API（网络请求）

## 使用说明

1. **打开页面**：浏览器访问 http://localhost:8080
2. **授权麦克风**：首次使用需允许浏览器访问麦克风
3. **开始录音**：点击红色麦克风按钮开始录音
   - 实时显示录音波形和计时
   - 最长录音10秒，自动停止
4. **停止录音**：再次点击按钮停止
5. **回放（可选）**：点击"回放"按钮试听录音
6. **分析情绪**：点击"分析情绪"按钮
7. **查看结果**：
   - 显示主导情绪（emoji + 名称 + 置信度）
   - 三种情绪的概率条形图（带动画）
   - 推理耗时和总耗时

## API 接口

### POST /predict
提交音频文件进行情绪识别

**请求**：
```
Content-Type: multipart/form-data
file: audio.wav (16kHz, 单声道, 16位)
```

**响应**：
```json
{
  "success": true,
  "probabilities": [0.05, 0.82, 0.13],
  "emotion_labels": ["愤怒", "开心", "悲伤"],
  "inference_time_ms": 127
}
```

### GET /health
健康检查
```json
{
  "status": "ok",
  "model_loaded": true,
  "device": "cpu",
  "emotion_labels": ["愤怒", "开心", "悲伤"]
}
```

## 模型架构

使用轻量级CNN模型 `EmotionCNN`：

- **输入**：128×128 梅尔频谱图
- **网络结构**：
  - 4组卷积块（Conv2d + BatchNorm + ReLU + MaxPool + Dropout）
  - 3层全连接层（含BatchNorm和Dropout）
- **输出**：3类情绪概率 [愤怒, 开心, 悲伤]
- **参数规模**：约500万参数

## 音频处理流程

### 前端预处理
1. 48kHz 采样 → 16kHz 重采样
2. 立体声 → 单声道混合
3. 高通滤波（80Hz截止，去除低频噪声）
4. 音量归一化（RMS = 0.15）
5. 噪声门限（<0.02 静音）
6. 16位PCM编码 → WAV格式

### 后端特征提取
1. 梅尔频谱图提取（n_mels=128, n_fft=2048）
2. 对数功率变换（dB）
3. 固定长度裁剪/补零到3秒（128×128）
4. 均值方差归一化（Z-score）

## 训练建议

当前使用随机生成的权重用于演示管道功能。如需实际识别能力，请在公开数据集上训练模型：

**推荐数据集：**
- RAVDESS（Ryerson Audio-Visual Database of Emotional Speech and Song）
- TESS（Toronto Emotional Speech Set）
- CREMA-D（Crowd-sourced Emotional Multimodal Actors Dataset）
- SAVEE（Surrey Audio-Visual Expressed Emotion）

**训练完成后：**
将权重文件命名为 `emotion_cnn.pt` 放入 `backend/model_weights/` 目录即可。

## 浏览器兼容性

- Chrome 60+
- Firefox 59+
- Edge 79+
- Safari 14.1+

需要HTTPS或localhost环境才能访问麦克风。

## 注意事项

1. **麦克风权限**：首次访问需授权，拒绝权限后需在浏览器设置中手动开启
2. **录音环境**：建议在安静环境下使用，背景噪声会影响识别准确率
3. **录音时长**：建议2-5秒，太短特征不足，太长自动截断
4. **模型权重**：演示权重为随机初始化，仅用于测试管道连通性
5. **端口占用**：确保8000和8080端口未被占用

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| 麦克风无法访问 | 检查浏览器权限，确保使用localhost或HTTPS |
| 后端连接失败 | 确认后端服务已启动，检查8000端口 |
| 分析失败 | 查看后端控制台日志，确认权重文件存在 |
| 安装依赖慢 | 使用国内镜像源：`pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt` |
| PyTorch安装失败 | 根据CUDA版本手动安装：https://pytorch.org/get-started/locally/ |

## 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript（ES6+）
- **后端**：Python 3.10+ + FastAPI + PyTorch
- **音频处理**：Web Audio API + librosa
- **可视化**：Canvas 2D API

## 许可证

MIT License
