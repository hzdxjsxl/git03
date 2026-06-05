# 智慧工厂三维数字孪生看板

基于 Three.js 的智慧工厂三维数字孪生可视化系统，实现车间立体模型渲染、设备动态运转效果和实时数据展示。

## 项目结构

```
w:\ATraePro\3
├── server.js                 # 后端服务器（Express）
├── package.json              # 项目配置
├── README.md                 # 本说明文档
└── public/                   # 前端静态资源
    ├── index.html            # 入口HTML
    ├── css/
    │   └── style.css         # 样式文件
    └── js/
        ├── main.js           # 主入口文件
        ├── apiClient.js      # API客户端模块
        ├── sceneInitializer.js  # 场景初始化模块
        ├── textureLoader.js  # 贴图加载模块
        ├── sceneBuilder.js   # 场景构建模块
        ├── animationController.js  # 动画控制模块
        ├── dataVisualizer.js # 数据可视化模块
        └── cameraController.js    # 相机控制模块
```

## 模块化设计

1. **apiClient.js** - 负责与后端通信，获取设备状态数据
2. **textureLoader.js** - 负责所有贴图的生成和加载，独立于场景构建
3. **sceneInitializer.js** - 负责 Three.js 基础环境（场景、相机、渲染器、灯光）
4. **sceneBuilder.js** - 负责构建3D场景（车间、传送带、机械臂等模型）
5. **animationController.js** - 独立控制所有动画效果（传送带运转、机械臂动作）
6. **dataVisualizer.js** - 负责三维空间数据悬浮标签和交互提示
7. **cameraController.js** - 负责相机视角控制（旋转、缩放、平移）

## 本地搭建步骤

### 前置要求

- Node.js 版本 >= 14.0.0
- npm 或 yarn 包管理器

### 步骤 1: 安装依赖

在项目根目录下打开终端，执行：

```bash
cd w:\ATraePro\3
npm install
```

这将安装 Express 和 CORS 依赖包。

### 步骤 2: 启动服务器

在项目根目录执行：

```bash
npm start
```

或者：

```bash
node server.js
```

启动成功后，终端会显示：
```
智慧工厂数字孪生看板服务器运行在 http://localhost:3000
```

### 步骤 3: 打开浏览器预览

在浏览器中访问：
```
http://localhost:3000
```

即可看到三维数字孪生看板。

## 操作说明

### 鼠标交互

- **左键拖拽**：旋转视角
- **右键拖拽**：平移视角
- **滚轮**：缩放视角

### 控制按钮

- **全景**：切换到全局俯视视角
- **传送带**：聚焦查看传送带区域
- **机械臂**：聚焦查看机械臂区域
- **暂停动画/继续动画**：控制设备动画播放状态

### 数据展示

- 每个设备上方都有悬浮标签，实时显示温度和产能数据
- 右侧面板显示所有设备的概览列表
- 鼠标悬停在设备上会显示详细信息弹窗
- 温度超过50°C显示黄色警告，超过60°C显示红色危险

## 后端 API 接口

### 获取所有设备数据

```
GET /api/devices
```

返回所有设备的状态数据。

### 获取单个设备数据

```
GET /api/device/:id
```

示例：
```
GET /api/device/robot_0
```

## 设备清单

| 设备ID | 设备名称 | 类型 |
|--------|----------|------|
| conveyor_0 | 主传送带A | 传送带 |
| conveyor_1 | 主传送带B | 传送带 |
| robot_0 | 机械臂A1 | 机械臂 |
| robot_1 | 机械臂A2 | 机械臂 |
| robot_2 | 机械臂B1 | 机械臂 |
| machine_0 | 加工中心A | 加工设备 |
| machine_1 | 加工中心B | 加工设备 |

## 技术特点

1. **纯前端 3D 渲染**：所有几何变换和数据映射都在前端完成
2. **程序化贴图生成**：无需外部图片资源，所有贴图通过 Canvas 动态生成
3. **实时数据更新**：每3秒轮询后端获取最新设备数据
4. **流畅动画效果**：传送带运转、机械臂关节动作、指示灯闪烁
5. **响应式设计**：自适应窗口大小变化
6. **交互友好**：支持多种视角操作和设备交互

## 浏览器兼容性

- Chrome >= 60
- Firefox >= 55
- Safari >= 12
- Edge >= 79

需要支持 WebGL 和 ES6 Modules 的现代浏览器。

## 常见问题

### Q: 页面白屏怎么办？
A: 检查浏览器控制台是否有报错，确保：
1. Node.js 服务器已正常启动
2. 访问地址是 http://localhost:3000
3. 浏览器支持 WebGL

### Q: 3D 场景很卡怎么办？
A: 可以尝试：
1. 关闭其他占用 GPU 的程序
2. 降低浏览器窗口大小
3. 点击"暂停动画"按钮减少计算量

### Q: 如何添加新设备？
A: 1. 在 server.js 的 deviceData 中添加设备数据
   2. 在 sceneBuilder.js 中创建设备 3D 模型
   3. 在 dataVisualizer.js 的 getDeviceName 中添加设备名称映射

## 开发说明

- 所有前端代码使用 ES6 Modules 语法
- 每个模块独立负责单一功能，便于维护和扩展
- 贴图加载与场景构建完全分离，可独立替换或升级
