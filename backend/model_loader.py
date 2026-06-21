"""
模型加载模块
负责深度学习模型的加载、初始化和单例管理

推理引擎：PyTorch + torchvision（真实深度学习推理）
当前模型：SSD Lite MobileNetV3（COCO 预训练，用于演示推理链路）

替换为你自己的缺陷检测模型：
  1. 准备好训练好的权重文件（如 best.pth / best.pt）
  2. 在初始化时传入 model_path="path/to/your/weights"
  3. 或修改 load() 方法适配你的模型结构
  4. predict() 返回格式保持不变，上层零改动
"""

import os
import torch
from torchvision import transforms
from torchvision.models.detection import (
    ssdlite320_mobilenet_v3_large,
    SSDLite320_MobileNet_V3_Large_Weights
)
from PIL import Image


COCO_CLASSES = [
    "__background__", "person", "bicycle", "car", "motorcycle", "airplane", "bus",
    "train", "truck", "boat", "traffic light", "fire hydrant", "N/A", "stop sign",
    "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "N/A", "backpack", "umbrella", "N/A", "N/A",
    "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "N/A", "wine glass", "cup", "fork", "knife", "spoon", "bowl",
    "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza",
    "donut", "cake", "chair", "couch", "potted plant", "bed", "N/A", "dining table",
    "N/A", "N/A", "toilet", "N/A", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "microwave", "oven", "toaster", "sink", "refrigerator", "N/A", "book",
    "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]


class DefectModel:
    """
    缺陷检测模型封装类
    统一的模型接口，底层基于 PyTorch 深度学习推理

    替换为自定义缺陷检测模型的三种方式：
    方式一：替换权重文件
        model = DefectModel(model_path="path/to/best.pth")
    
    方式二：继承重写 load() 和 predict()
        class MyDefectModel(DefectModel):
            def load(self): ...
            def predict(self, image_path): ...
    
    方式三：直接替换本文件的实现（不推荐，耦合度高）
    """

    def __init__(self, model_path=None):
        self.model_path = model_path
        self.is_loaded = False
        self._model = None
        self._class_names = []
        self._transform = None
        self._device = None
        self.load()

    def load(self):
        """
        加载深度学习模型

        【替换自定义模型时主要修改此方法】
        """
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        try:
            if self.model_path and os.path.exists(self.model_path):
                self._load_custom_model()
            else:
                self._load_pretrained_model()

            self._model.eval()
            self._model.to(self._device)

            self._transform = transforms.Compose([
                transforms.ToTensor(),
            ])

            self.is_loaded = True
            print(f"模型加载完成，设备: {self._device}")
            print(f"类别数量: {len(self._class_names)}")
            return True

        except Exception as e:
            print(f"模型加载失败: {e}")
            import traceback
            traceback.print_exc()
            self.is_loaded = False
            return False

    def _load_pretrained_model(self):
        """
        加载预训练 SSD Lite MobileNetV3 模型（演示用）
        轻量级模型，下载快、推理快
        """
        weights = SSDLite320_MobileNet_V3_Large_Weights.DEFAULT
        self._model = ssdlite320_mobilenet_v3_large(weights=weights)
        self._class_names = COCO_CLASSES

    def _load_custom_model(self):
        """
        加载自定义缺陷检测模型

        【替换自定义模型时修改此方法】
        根据你的模型结构调整加载逻辑
        """
        checkpoint = torch.load(self.model_path, map_location=self._device)

        if "model_state_dict" in checkpoint:
            self._model = ssdlite320_mobilenet_v3_large(num_classes=checkpoint.get("num_classes", 91))
            self._model.load_state_dict(checkpoint["model_state_dict"])
        else:
            self._model = checkpoint

        if "class_names" in checkpoint:
            self._class_names = checkpoint["class_names"]
        else:
            self._class_names = COCO_CLASSES

    def predict(self, image_path, image_size=None, conf_threshold=0.5):
        """
        执行缺陷检测推理（真实深度学习推理）

        Args:
            image_path: 输入图像路径
            image_size: 图像尺寸 (width, height)，预留参数
            conf_threshold: 置信度阈值

        Returns:
            list: 检测结果列表，每个元素为 dict:
                - class_name: 缺陷类别名称
                - confidence: 置信度 (0~1)
                - bbox: 边界框 [x1, y1, x2, y2] 原始像素坐标
        """
        if not self.is_loaded or self._model is None:
            raise RuntimeError("Model not loaded")

        img = Image.open(image_path).convert("RGB")
        img_tensor = self._transform(img).unsqueeze(0).to(self._device)

        with torch.no_grad():
            predictions = self._model(img_tensor)

        detections = []

        if not predictions or len(predictions) == 0:
            return detections

        pred = predictions[0]
        boxes = pred["boxes"].cpu().numpy()
        scores = pred["scores"].cpu().numpy()
        labels = pred["labels"].cpu().numpy().astype(int)

        for box, score, label in zip(boxes, scores, labels):
            if float(score) < conf_threshold:
                continue

            x1, y1, x2, y2 = map(float, box)
            class_name = self._class_names[label] if label < len(self._class_names) else f"class_{label}"

            detections.append({
                "class_name": class_name,
                "confidence": float(score),
                "bbox": [x1, y1, x2, y2]
            })

        detections.sort(key=lambda x: x["confidence"], reverse=True)
        return detections

    def get_class_names(self):
        """
        获取所有类别名称
        """
        return self._class_names.copy()

    def reload(self, model_path=None):
        """
        重新加载模型
        """
        if model_path is not None:
            self.model_path = model_path
        return self.load()


_model_instance = None


def get_model(model_path=None):
    """
    获取模型单例
    """
    global _model_instance
    if _model_instance is None:
        _model_instance = DefectModel(model_path=model_path)
    return _model_instance


def reload_model(model_path=None):
    """
    重新加载模型
    """
    global _model_instance
    _model_instance = DefectModel(model_path=model_path)
    return _model_instance
