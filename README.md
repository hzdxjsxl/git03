# AI 图片风格迁移服务

基于深度学习的图片风格迁移 Web 应用，用户可以上传照片，选择艺术流派，系统自动渲染出油画或水墨画效果。

## ✅ 已验证可运行

服务已启动并验证通过，访问地址：**http://localhost:5000**

- ✅ 页面正常加载
- ✅ 上传界面显示
- ✅ API 接口正常工作
- ✅ 风格列表可获取

## 项目结构

```
style-transfer/
├── backend/
│   ├── app.py                 # Flask 主应用（同时提供前端和API）
│   ├── requirements.txt       # Python 依赖
│   ├── model/
│   │   ├── style_transfer.py  # 风格迁移核心模型
│   │   └── style_loader.py    # 风格图片管理
│   ├── styles/                # 风格参考图片目录
│   ├── uploads/               # 用户上传图片临时目录
│   └── results/               # 处理结果目录
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/                   # React 源代码
│   └── dist/                  # 构建后的前端（后端自动提供）
├── start.bat                  # ✅ 一键启动脚本（推荐）
└── README.md
```

## 技术栈

### 后端
- **Flask**: Web 框架，同时提供 API 和前端静态文件
- **PyTorch**: 深度学习框架，运行风格迁移模型
- **VGG19**: 预训练卷积神经网络

### 前端
- **React 18**: UI 框架
- **Vite**: 构建工具
- **react-easy-crop**: 图片裁剪组件

## 🚀 快速开始（推荐）

### 方式一：一键启动（最简单）

```bash
双击运行 start.bat
```

脚本会自动完成：
1. 构建前端（如未构建）
2. 创建 Python 虚拟环境
3. 安装所有依赖
4. 启动完整服务

### 方式二：手动启动

#### 步骤 1: 安装后端依赖

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install flask flask-cors pillow
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

#### 步骤 2: 构建前端

```bash
cd frontend
npm install
npm run build
```

#### 步骤 3: 启动服务

```bash
cd backend
venv\Scripts\activate
python app.py
```

访问 **http://localhost:5000** 即可使用

## ✅ 启动验证环节（必做）

### 验证 1: 服务健康检查

启动后访问:
```
http://localhost:5000/health
```

预期返回:
```json
{
  "success": true,
  "status": "healthy",
  "model_loaded": false
}
```

### 验证 2: 页面正常加载

访问 **http://localhost:5000**，确认：
- ✅ 页面标题显示 "🎨 AI 图片风格迁移"
- ✅ 5 个步骤指示器显示
- ✅ 上传区域可点击
- ✅ 页面样式正常显示

### 验证 3: API 接口正常

访问:
```
http://localhost:5000/api/styles
```

预期返回 6 种艺术风格的配置信息

### 验证 4: 完整流程测试

1. **上传图片**: 点击上传区域选择一张图片
2. **裁剪图片**: 调整裁剪框，点击"确认裁剪"
3. **选择风格**: 选择一个艺术风格（如"梵高星空"）
4. **开始处理**: 点击"开始风格迁移"
5. **查看进度**: 观察进度条从 0% → 100%
6. **查看结果**: 完成后显示原图和处理后的对比图
7. **下载结果**: 点击下载按钮可保存结果图片

## API 接口说明

### `GET /`
前端主页

### `GET /api/styles`
获取所有可用的艺术风格列表

### `GET /api/styles/:style_key/image`
获取指定风格的参考图片

### `POST /api/upload`
上传用户图片
- 请求: `multipart/form-data` 包含 `image` 字段
- 返回: `{ success: true, task_id: "..." }`

### `POST /api/transfer`
开始风格迁移任务
- 请求体: `{ task_id: "...", style_key: "...", num_steps: 150 }`

### `GET /api/status/:task_id`
查询任务状态
- 返回状态: `queued` / `processing` / `completed` / `error`

### `GET /api/result/:filename`
获取处理结果图片

### `GET /health`
健康检查

## 性能说明

- **CPU 模式**: 单张图片处理约 2-5 分钟
- **GPU 模式** (CUDA): 单张图片处理约 30-60 秒
- `num_steps` 参数控制迭代次数，建议 100-300 之间

## 注意事项

1. **首次运行**会自动下载 VGG19 预训练权重（约 500MB），请保持网络连接
2. 建议使用正方形图片以获得最佳效果
3. 处理时间与图片大小、迭代次数成正比
4. **请替换** `backend/styles/` 目录下的占位图片为真实的艺术作品

## 支持的艺术流派

| 类别 | 风格名称 | 文件名 |
|------|----------|--------|
| 🖼️ 油画 | 梵高星空 | starry_night.jpg |
| 🖼️ 油画 | 莫奈睡莲 | water_lilies.jpg |
| 🎋 水墨画 | 水墨山水 | ink_landscape.jpg |
| 🎋 水墨画 | 墨竹图 | ink_bamboo.jpg |
| ✨ 抽象 | 毕加索立体派 | cubism.jpg |
| ✏️ 素描 | 铅笔素描 | pencil_sketch.jpg |

## 功能特性

1. **图片上传**: 支持拖拽或点击上传
2. **图片裁剪**: 自由裁剪和缩放（正方形比例）
3. **滤镜效果**: 黑白、复古、明亮、高对比、怀旧等 6 种滤镜
4. **艺术风格**: 6 种预设艺术流派
5. **实时进度**: 显示处理进度条和排队状态
6. **结果下载**: 一键下载生成的艺术作品

## 故障排查

### 问题: 页面显示 404
- 确认后端服务已启动
- 确认前端已构建（`frontend/dist/` 目录存在）
- 访问 http://localhost:5000 而不是 3000 端口

### 问题: 后端启动失败
- 检查 Python 版本是否 >= 3.8
- 确认所有依赖已正确安装
- 检查 5000 端口是否被占用

### 问题: 模型加载慢
- 这是正常现象，首次运行需要下载预训练权重
- 后续启动会使用缓存的权重文件

### 问题: 处理时间过长
- CPU 模式处理较慢属正常现象
- 可适当减少 `num_steps` 参数（如 100 步）
- 有条件可使用支持 CUDA 的 GPU
