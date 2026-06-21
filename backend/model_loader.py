"""
模型加载模块
负责深度学习模型的加载、初始化和单例管理
与检测逻辑解耦，便于替换不同模型
"""

import os
import random
from PIL import Image


class DefectModel:
    """
    缺陷检测模型封装类
    统一的模型接口，底层实现可替换为真实的YOLO/ResNet等模型
    """

    def __init__(self, model_path=None):
        self.model_path = model_path
        self.is_loaded = False
        self._model = None
        self._class_names = [
            "scratch",
            "dent",
            "stain",
            "crack",
            "missing_part",
            "rust"
        ]
        self.load()

    def load(self):
        """
        加载模型权重
        替换为真实模型时，在此处执行实际的模型加载逻辑
        """
        if self.model_path and os.path.exists(self.model_path):
            pass
        self.is_loaded = True
        return True

    def predict(self, image_path, image_size=None):
        """
        执行缺陷检测推理

        Args:
            image_path: 输入图像路径
            image_size: 图像尺寸 (width, height)，若为None则自动读取

        Returns:
            list: 检测结果列表，每个元素为 dict:
                - class_name: 缺陷类别名称
                - confidence: 置信度 (0~1)
                - bbox: 边界框 [x1, y1, x2, y2] 原始像素坐标
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        if image_size is None:
            with Image.open(image_path) as img:
                image_size = img.size

        width, height = image_size
        results = []
        num_defects = random.randint(1, 5)

        for _ in range(num_defects):
            class_name = random.choice(self._class_names)
            confidence = round(random.uniform(0.6, 0.99), 3)

            bbox_w = random.randint(int(width * 0.05), int(width * 0.25))
            bbox_h = random.randint(int(height * 0.05), int(height * 0.25))
            x1 = random.randint(0, max(0, width - bbox_w))
            y1 = random.randint(0, max(0, height - bbox_h))
            x2 = x1 + bbox_w
            y2 = y1 + bbox_h

            results.append({
                "class_name": class_name,
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2]
            })

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results


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
