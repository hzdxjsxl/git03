# 主场景入口配置说明

## 快速开始

### 1. 启动开发服务器

在项目根目录执行：

```bash
npm run dev
```

这将同时启动：
- **前端游戏客户端**: http://localhost:5174/
- **后端排行榜API**: http://localhost:3001/

### 2. 进入游戏

1. 打开浏览器访问 http://localhost:5174/
2. 点击「开始游戏」按钮
3. 选择关卡（第一关或第二关）
4. 点击「播放」按钮开始游戏

## 操作说明

| 按键/操作 | 功能 |
|-----------|------|
| **W A S D** / **方向键** | 移动角色 |
| **空格** / **W** / **↑** | 跳跃 |
| **鼠标移动** | 瞄准钩爪方向 |
| **鼠标左键按住** | 发射并保持钩爪 |
| **鼠标左键松开** | 释放钩爪 |
| **ESC** | 暂停游戏 |

## 目录结构

```
w:\ATraePro\6\
├── src/
│   ├── game/
│   │   ├── engine/
│   │   │   └── GameEngine.ts          # 游戏引擎核心
│   │   ├── physics/
│   │   │   └── PhysicsMaterials.ts     # 物理材质配置
│   │   ├── prefabs/                    # 预设体（通过代码创建）
│   │   ├── levels/
│   │   │   └── LevelData.ts            # 关卡脚本配置
│   │   ├── entities/
│   │   │   ├── GameEntity.ts           # 实体基类
│   │   │   ├── Player.ts               # 玩家实体
│   │   │   └── Platform.ts             # 平台实体
│   │   └── systems/
│   │       ├── GrappleSystem.ts        # 钩爪系统
│   │       └── LaserSystem.ts          # 激光系统
│   ├── components/
│   │   ├── MainMenu.tsx                # 主菜单
│   │   ├── GameCanvas.tsx              # 游戏画布
│   │   ├── PauseMenu.tsx               # 暂停菜单
│   │   ├── GameOver.tsx                # 游戏结束
│   │   ├── Victory.tsx                 # 胜利界面
│   │   └── Leaderboard.tsx             # 排行榜
│   ├── pages/
│   │   └── GamePage.tsx                # 游戏页面
│   ├── store/
│   │   └── gameStore.ts                # 游戏状态管理
│   └── App.tsx                         # 主应用入口
├── api/
│   └── index.ts                        # 后端排行榜API
└── SCENE_SETUP.md                      # 本文件
```

## 关卡配置

关卡数据位于 [src/game/levels/LevelData.ts](file:///w:/ATraePro/6/src/game/levels/LevelData.ts)

每个关卡包含：
- `playerStart`: 玩家起始位置
- `goalX` / `goalY`: 终点位置
- `platforms`: 平台配置列表
  - 静态平台: `type: 'static'`
  - 移动平台: `type: 'moving'` + `moveRange`
  - 钩爪点: `hasGrapplePoint: true`
- `lasers`: 激光配置列表
  - `cycleTime`: 激光周期（毫秒）
  - `offsetTime`: 相位偏移
  - `angle`: 发射角度
  - `length`: 激光长度

## 物理材质配置

物理材质位于 [src/game/physics/PhysicsMaterials.ts](file:///w:/ATraePro/6/src/game/physics/PhysicsMaterials.ts)

| 材质 | 摩擦 | 空气摩擦 | 弹性 | 密度 |
|------|------|----------|------|------|
| 玩家 | 0.1 | 0.02 | 0.2 | 0.001 |
| 平台 | 0.8 | 0 | 0 | 1 |
| 钩爪点 | 1.0 | 0 | 0 | 1 |
| 移动平台 | 0.6 | 0 | 0.1 | 0.5 |

## API 接口

### GET /api/leaderboard
获取排行榜数据

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "playerName": "SpeedRunner",
      "score": 9850,
      "time": 15.2,
      "level": 1,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/leaderboard
提交分数

请求体：
```json
{
  "playerName": "玩家名",
  "score": 9000,
  "time": 20.5,
  "level": 1
}
```

## 游戏机制

### 钩爪系统
- 最大射程: 400像素
- 绳索刚度: 0.9
- 阻尼: 0.1
- 可吸附：平台边缘、钩爪点

### 激光系统
- 周期性发射（半周期开启，半周期关闭）
- 开启前0.5秒闪烁警告
- 碰撞检测精度: 20像素半径

### 计分系统
- 基础分数: 10000分
- 每秒扣除: 100分
- 最低分数: 0分

## 故障排除

### 问题：游戏不显示
- 检查是否访问了正确的地址 (http://localhost:5174/)
- 查看控制台是否有JavaScript错误
- 确保已运行 `npm install` 安装依赖

### 问题：钩爪无法发射
- 确保鼠标在游戏画布内
- 确保目标在最大射程（400像素）内
- 确保目标是平台或钩爪点

### 问题：后端API无法连接
- 检查后端服务器是否在运行（端口3001）
- 查看控制台CORS错误
- 确保前端和后端都已启动

## 自定义扩展

### 添加新关卡
在 `src/game/levels/LevelData.ts` 中添加新的 `LevelData` 对象到 `allLevels` 数组。

### 修改物理参数
在 `src/game/physics/PhysicsMaterials.ts` 中调整材质属性。

### 调整游戏难度
修改 `src/game/engine/GameEngine.ts` 中的：
- `gravity`: 重力大小
- 或在 `Player.ts` 中调整 `moveForce`, `jumpForce`, `maxSpeed`
