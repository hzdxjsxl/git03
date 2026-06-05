# AI 图片风格迁移服务

基于深度学习的图片风格迁移 Web 应用，用户可以上传照片，选择艺术流派，系统自动渲染出油画或水墨画效果。

## 项目结构

```
style-transfer/
├── backend/
│   ├── app.py                 # Flask 主应用，API 路由
│   ├── requirements.txt       # Python 依赖
│   ├── model/
│   │   ├── __init__.py
│   │   ├── style_transfer.py  # 风格迁移核心模型
│   │   └── style_loader.py    # 风格图片管理
│   ├── styles/                # 风格参考图片目录
│   ├── uploads/               # 用户上传图片临时目录
│   └── results/               # 处理结果目录
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # 主应用组件
│       ├── index.css          # 样式文件
│       └── components/
│           ├── ImageCropper.jsx   # 图片裁剪组件
│           └── FilterEditor.jsx   # 滤镜编辑组件
└── README.md
```

## 技术栈

### 后端
- **Flask**: Web 框架，提供 RESTful API
- **PyTorch**: 深度学习框架，运行风格迁移模型
- **VGG19**: 预训练卷积神经网络，用于提取图像特征

### 前端
- **React 18**: UI 框架
- **Vite**: 构建工具
- **react-easy-crop**: 图片裁剪组件
- **Axios**: HTTP 客户端

## 功能特性

1. **图片上传**: 支持拖拽或点击上传
2. **图片裁剪**: 自由裁剪和缩放
3. **滤镜效果**: 黑白、复古、明亮、高对比、怀旧等滤镜
4. **艺术风格**:
   - 梵高星空（油画）
   - 莫奈睡莲（油画）
   - 水墨山水（水墨画）
   - 墨竹图（水墨画）
   - 毕加索立体派
   - 铅笔素描
5. **实时进度**: 显示处理进度条和排队状态
6. **结果下载**: 一键下载生成的艺术作品

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- 建议使用虚拟环境

### 步骤 1: 安装后端依赖

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 步骤 2: 准备风格图片

将您的风格参考图片放入 `backend/styles/` 目录，命名需与 `style_loader.py` 中配置一致：
- starry_night.jpg (梵高星空)
- water_lilies.jpg (莫奈睡莲)
- ink_landscape.jpg (水墨山水)
- ink_bamboo.jpg (墨竹图)
- cubism.jpg (立体派)
- pencil_sketch.jpg (铅笔素描)

**首次启动时系统会自动生成占位图片，建议替换为真实的艺术作品以获得更好效果。**

### 步骤 3: 安装前端依赖

```bash
cd frontend
npm install
```

### 步骤 4: 启动后端服务

```bash
cd backend
python app.py
```

服务将在 `http://localhost:5000` 启动

### 步骤 5: 启动前端开发服务器

```bash
cd frontend
npm run dev
```

访问 `http://localhost:3000` 即可使用应用

## 启动验证环节

### 验证 1: 后端健康检查

启动后端后，访问:
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

`model_loaded` 会在首次处理任务时变为 `true`

### 验证 2: 获取风格列表

访问:
```
http://localhost:5000/api/styles
```

预期返回所有可用风格的配置信息

### 验证 3: 前端页面加载

访问 `http://localhost:3000`，确认:
- [ ] 页面标题显示 "AI 图片风格迁移"
- [ ] 步骤指示器显示 5 个步骤
- [ ] 上传区域可正常点击
- [ ] 风格卡片正常显示

### 验证 4: 完整流程测试

1. **上传图片**: 点击上传区域选择一张图片
2. **裁剪图片**: 调整裁剪框，点击"确认裁剪"
3. **选择风格**: 选择一个艺术风格
4. **开始处理**: 点击"开始风格迁移"
5. **查看进度**: 观察进度条从 0% 到 100%
6. **查看结果**: 完成后显示原图和处理后的对比图
7. **下载结果**: 点击下载按钮可保存结果图片

## API 接口说明

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

## 性能说明

- **CPU 模式**: 单张图片处理约 2-5 分钟
- **GPU 模式** (CUDA): 单张图片处理约 30-60 秒
- `num_steps` 参数控制迭代次数，建议 100-300 之间

## 注意事项

1. 首次运行会自动下载 VGG19 预训练权重（约 500MB），请保持网络连接
2. 建议使用正方形图片以获得最佳效果
3. 处理时间与图片大小、迭代次数成正比
4. 风格参考图片的质量直接影响最终效果

## 故障排查

### 问题: 后端启动失败
- 检查 Python 版本是否 >= 3.8
- 确认所有依赖已正确安装
- 检查 5000 端口是否被占用

### 问题: 前端无法连接后端
- 确认后端服务已启动
- 检查 vite.config.js 中的代理配置

### 问题: 模型加载慢
- 这是正常现象，首次运行需要下载预训练权重
- 后续启动会使用缓存的权重文件
