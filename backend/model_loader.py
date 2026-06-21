"""
模型加载模块 - 缺陷专用检测模型
负责深度学习模型的加载、初始化和单例管理

推理引擎：PyTorch + MobileNetV3 Large 特征提取 + 多尺度检测头
缺陷类别（6类）：scratch(划痕), crack(裂纹), dent(凹坑), stain(污渍), rust(锈蚀), missing_part(缺损)

上层接口保持不变：
- predict() 返回: [{class_name, confidence, bbox:[x1,y1,x2,y2]}, ...]
- detector.py / app.py / 前端 零改动
"""

import os
import math
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(MODEL_DIR, "defect_model.pth")

NUM_DEFECT_CLASSES = 7
IMG_SIZE = 320
FEAT_DIM = 960
DEFECT_CLASSES = {
    0: "scratch",
    1: "crack",
    2: "dent",
    3: "stain",
    4: "rust",
    5: "missing_part"
}
CLASS_NAMES = ["__background__"] + [DEFECT_CLASSES[i] for i in range(6)]
DEFAULT_ANCHORS = [
    [(10, 20), (20, 15), (30, 30)],
    [(40, 30), (50, 50), (60, 80)],
    [(100, 80), (120, 120), (150, 150)],
]
DEFAULT_GRID_SIZES = [20, 10, 5]


class DefectBackbone(nn.Module):
    def __init__(self):
        super().__init__()
        weights = models.MobileNet_V3_Large_Weights.DEFAULT
        backbone = models.mobilenet_v3_large(weights=weights)
        self.features = backbone.features
        for param in self.features[:8].parameters():
            param.requires_grad = False

    def forward(self, x):
        return self.features(x)


class DefectDetector(nn.Module):
    def __init__(self, num_classes=NUM_DEFECT_CLASSES):
        super().__init__()
        self.backbone = DefectBackbone()

        self.base = nn.Sequential(
            nn.Conv2d(FEAT_DIM, 256, 1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
        )

        self.up1 = nn.Sequential(
            nn.ConvTranspose2d(256, 256, 4, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
        )
        self.head1 = nn.Sequential(
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
        )
        self.cls1 = nn.Conv2d(256, 3 * num_classes, 3, padding=1)
        self.box1 = nn.Conv2d(256, 3 * 4, 3, padding=1)

        self.head2 = nn.Sequential(
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
        )
        self.cls2 = nn.Conv2d(256, 3 * num_classes, 3, padding=1)
        self.box2 = nn.Conv2d(256, 3 * 4, 3, padding=1)

        self.down3 = nn.Sequential(
            nn.Conv2d(256, 256, 3, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
        )
        self.head3 = nn.Sequential(
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
        )
        self.cls3 = nn.Conv2d(256, 3 * num_classes, 3, padding=1)
        self.box3 = nn.Conv2d(256, 3 * 4, 3, padding=1)

    def forward(self, x):
        feats = self.backbone(x)
        base = self.base(feats)

        f1_in = self.up1(base)
        f1 = self.head1(f1_in)
        c1 = self.cls1(f1)
        b1 = self.box1(f1)

        f2 = self.head2(base)
        c2 = self.cls2(f2)
        b2 = self.box2(f2)

        f3_in = self.down3(base)
        f3 = self.head3(f3_in)
        c3 = self.cls3(f3)
        b3 = self.box3(f3)

        return [(c1, b1), (c2, b2), (c3, b3)]


def nms(boxes, scores, threshold=0.5):
    if len(boxes) == 0:
        return []
    boxes_arr = np.array(boxes)
    scores_arr = np.array(scores)
    order = scores_arr.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        if order.size == 1:
            break
        xx1 = np.maximum(boxes_arr[i, 0], boxes_arr[order[1:], 0])
        yy1 = np.maximum(boxes_arr[i, 1], boxes_arr[order[1:], 1])
        xx2 = np.minimum(boxes_arr[i, 2], boxes_arr[order[1:], 2])
        yy2 = np.minimum(boxes_arr[i, 3], boxes_arr[order[1:], 3])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        area_i = (boxes_arr[i, 2] - boxes_arr[i, 0]) * (boxes_arr[i, 3] - boxes_arr[i, 1])
        area_rest = (boxes_arr[order[1:], 2] - boxes_arr[order[1:], 0]) * \
                    (boxes_arr[order[1:], 3] - boxes_arr[order[1:], 1])
        iou = inter / (area_i + area_rest - inter + 1e-6)
        inds = np.where(iou <= threshold)[0]
        order = order[inds + 1]
    return keep


class DefectModel:
    """
    缺陷检测模型封装类
    6 类缺陷：scratch, crack, dent, stain, rust, missing_part

    上层接口完全兼容：
    - predict(image_path, image_size, conf_threshold)
      返回: [{class_name, confidence, bbox:[x1,y1,x2,y2]}, ...]
    """

    def __init__(self, model_path=None):
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.is_loaded = False
        self._model = None
        self._class_names = CLASS_NAMES
        self._defect_classes = DEFECT_CLASSES
        self._transform = None
        self._device = None
        self._anchors = DEFAULT_ANCHORS
        self._grid_sizes = DEFAULT_GRID_SIZES
        self._img_size = IMG_SIZE
        self.load()

    def load(self):
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        try:
            model = DefectDetector(num_classes=NUM_DEFECT_CLASSES)

            if os.path.exists(self.model_path):
                checkpoint = torch.load(self.model_path, map_location=self._device)
                if "model_state_dict" in checkpoint:
                    model.load_state_dict(checkpoint["model_state_dict"])
                else:
                    model.load_state_dict(checkpoint)

                if "class_names" in checkpoint:
                    self._class_names = checkpoint["class_names"]
                if "defect_classes" in checkpoint:
                    self._defect_classes = checkpoint["defect_classes"]
                if "img_size" in checkpoint:
                    self._img_size = checkpoint["img_size"]
                if "anchors" in checkpoint:
                    self._anchors = checkpoint["anchors"]
                if "grid_sizes" in checkpoint:
                    self._grid_sizes = checkpoint["grid_sizes"]
                print(f"已加载缺陷专用权重: {self.model_path}")
            else:
                print(f"权重文件不存在，使用初始化权重: {self.model_path}")

            model.eval()
            model.to(self._device)
            self._model = model

            self._transform = transforms.Compose([
                transforms.Resize((self._img_size, self._img_size)),
                transforms.ToTensor(),
            ])

            self.is_loaded = True
            print(f"模型加载完成，设备: {self._device}")
            print(f"缺陷类别 ({len(self._defect_classes)} 类): {list(self._defect_classes.values())}")
            return True

        except Exception as e:
            print(f"模型加载失败: {e}")
            import traceback
            traceback.print_exc()
            self.is_loaded = False
            return False

    def predict(self, image_path, image_size=None, conf_threshold=0.5):
        """
        执行缺陷检测推理（真实深度学习推理）

        Args:
            image_path: 输入图像路径
            image_size: 原始图像尺寸 (width, height)，用于坐标还原
            conf_threshold: 置信度阈值

        Returns:
            list: 检测结果列表，每个元素为 dict:
                - class_name: 缺陷类别名称 (scratch/crack/dent/stain/rust/missing_part)
                - confidence: 置信度 (0~1)
                - bbox: 边界框 [x1, y1, x2, y2] 原始像素坐标
        """
        if not self.is_loaded or self._model is None:
            raise RuntimeError("Model not loaded")

        img = Image.open(image_path).convert("RGB")
        orig_w, orig_h = img.size

        if image_size is not None and len(image_size) == 2:
            orig_w, orig_h = image_size

        img_tensor = self._transform(img).unsqueeze(0).to(self._device)

        with torch.no_grad():
            outputs = self._model(img_tensor)

        all_boxes = []
        all_scores = []
        all_labels = []

        for (cls_out, box_out), grid_size, anchors in zip(
                outputs, self._grid_sizes, self._anchors):
            B = cls_out.shape[0]
            nc = len(self._class_names)
            cls_out = cls_out.permute(0, 2, 3, 1).contiguous()
            box_out = box_out.permute(0, 2, 3, 1).contiguous()
            cls_out = cls_out.view(B, grid_size, grid_size, 3, nc)
            box_out = box_out.view(B, grid_size, grid_size, 3, 4)
            cls_scores = F.softmax(cls_out, dim=-1)

            for b in range(B):
                for i in range(grid_size):
                    for j in range(grid_size):
                        for a in range(3):
                            scores = cls_scores[b, i, j, a]
                            label = int(torch.argmax(scores).item())
                            score = float(scores[label].item())

                            if label == 0 or score < conf_threshold:
                                continue

                            tx, ty, tw, th = box_out[b, i, j, a].detach().cpu().numpy()
                            ax, ay = anchors[a]

                            cx = (j + float(torch.sigmoid(torch.tensor(tx)))) / grid_size
                            cy = (i + float(torch.sigmoid(torch.tensor(ty)))) / grid_size
                            w = ax / self._img_size * math.exp(tw)
                            h = ay / self._img_size * math.exp(th)

                            x1 = (cx - w / 2) * orig_w
                            y1 = (cy - h / 2) * orig_h
                            x2 = (cx + w / 2) * orig_w
                            y2 = (cy + h / 2) * orig_h

                            x1, y1 = max(0, x1), max(0, y1)
                            x2, y2 = min(orig_w, x2), min(orig_h, y2)

                            if x2 - x1 < 3 or y2 - y1 < 3:
                                continue

                            all_boxes.append([x1, y1, x2, y2])
                            all_scores.append(score)
                            all_labels.append(label - 1)

        detections = []
        if len(all_boxes) > 0:
            keep = nms(all_boxes, all_scores, 0.5)
            for idx in keep:
                cls_id = all_labels[idx]
                class_name = self._defect_classes.get(cls_id, f"defect_{cls_id}")
                detections.append({
                    "class_name": class_name,
                    "confidence": float(all_scores[idx]),
                    "bbox": [float(all_boxes[idx][0]), float(all_boxes[idx][1]),
                             float(all_boxes[idx][2]), float(all_boxes[idx][3])]
                })

        detections.sort(key=lambda x: x["confidence"], reverse=True)
        return detections

    def get_class_names(self):
        return [self._defect_classes[i] for i in sorted(self._defect_classes.keys())]

    def reload(self, model_path=None):
        if model_path is not None:
            self.model_path = model_path
        return self.load()


_model_instance = None


def get_model(model_path=None):
    global _model_instance
    if _model_instance is None:
        _model_instance = DefectModel(model_path=model_path)
    return _model_instance


def reload_model(model_path=None):
    global _model_instance
    _model_instance = DefectModel(model_path=model_path)
    return _model_instance
