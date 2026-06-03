# 模型权重说明

## 目录结构

```
model_weights/
├── README.md          # 本说明文件
└── emotion_cnn.pt     # 模型权重文件（需生成或下载）
```

## 权重获取方式

### 方式1：生成测试权重（推荐用于快速体验）

运行 `generate_demo_weights.py` 脚本生成随机权重用于测试：

```bash
python generate_demo_weights.py
```

这会创建一个可运行的权重文件，使系统能够正常启动和响应请求。

### 方式2：使用自定义训练权重

如果你有自己训练的模型权重，请将其重命名为 `emotion_cnn.pt` 并放在此目录下。

权重文件可以是以下格式之一：
- 直接的 `state_dict`
- 包含 `model_state_dict` 键的 checkpoint 字典

## 模型输入输出规范

- 输入：形状为 `(1, 1, 128, 128)` 的梅尔频谱图张量
- 输出：形状为 `(3,)` 的概率数组 `[愤怒, 开心, 悲伤]`
