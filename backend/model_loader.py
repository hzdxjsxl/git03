"""
模型加载模块
负责深度学习模型的加载、初始化和单例管理

当前实现：基于计算机视觉的真实表面缺陷检测算法
          （接口与深度学习模型完全兼容，可直接替换为真实训练模型）

替换真实模型说明：
  1. 在 load() 方法中加载你的权重文件（.pt / .pth / .onnx 等）
  2. 在 predict() 方法中调用模型的 forward / inference 接口
  3. 返回格式保持不变：[{class_name, confidence, bbox:[x1,y1,x2,y2]}, ...]
"""

import os
import math
import cv2
import numpy as np
from PIL import Image


class DefectModel:
    """
    缺陷检测模型封装类
    统一的模型接口，底层实现可替换为真实的 YOLO / ResNet / Faster R-CNN 等模型
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

        self._min_area_ratio = 0.001
        self._max_area_ratio = 0.3
        self._gaussian_ksize = 5
        self._canny_low = 30
        self._canny_high = 90
        self._morph_kernel_size = 3

        self.load()

    def load(self):
        """
        加载模型
        ─────────────────────────────────────────────────────
        【替换真实模型时修改此处】
        示例：
            import torch
            self._model = torch.load(self.model_path)
            self._model.eval()
        ─────────────────────────────────────────────────────
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
            image_size: 图像尺寸 (width, height)，若为 None 则自动读取

        Returns:
            list: 检测结果列表，每个元素为 dict:
                - class_name: 缺陷类别名称
                - confidence: 置信度 (0~1)
                - bbox: 边界框 [x1, y1, x2, y2] 原始像素坐标

        ─────────────────────────────────────────────────────
        【替换真实模型时修改此处】
        示例（YOLO）：
            results = self._model(image_path)
            detections = []
            for pred in results.pred[0]:
                x1, y1, x2, y2, conf, cls = pred.tolist()
                detections.append({
                    "class_name": self._class_names[int(cls)],
                    "confidence": float(conf),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)]
                })
            return detections
        ─────────────────────────────────────────────────────
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        img = cv2.imread(image_path)
        if img is None:
            return []

        height, width = img.shape[:2]

        if image_size is not None:
            width, height = image_size

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        blurred = cv2.GaussianBlur(
            gray,
            (self._gaussian_ksize, self._gaussian_ksize),
            0
        )

        edges = cv2.Canny(
            blurred,
            self._canny_low,
            self._canny_high
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (self._morph_kernel_size, self._morph_kernel_size)
        )
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)
        edges = cv2.morphologyEx(edges, cv2.MORPH_DILATE, kernel, iterations=1)

        contours, _ = cv2.findContours(
            edges,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        total_pixels = width * height
        min_area = int(total_pixels * self._min_area_ratio)
        max_area = int(total_pixels * self._max_area_ratio)

        defects = []

        for contour in contours:
            area = cv2.contourArea(contour)

            if area < min_area or area > max_area:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            x1 = max(0, x - 2)
            y1 = max(0, y - 2)
            x2 = min(width, x + w + 2)
            y2 = min(height, y + h + 2)

            defect_roi = gray[y1:y2, x1:x2]
            if defect_roi.size == 0:
                continue

            roi_mean = np.mean(defect_roi)
            roi_std = np.std(defect_roi)

            pad = 10
            bg_x1 = max(0, x1 - pad)
            bg_y1 = max(0, y1 - pad)
            bg_x2 = min(width, x2 + pad)
            bg_y2 = min(height, y2 + pad)

            bg_roi = gray[bg_y1:bg_y2, bg_x1:bg_x2]
            bg_mean = np.mean(bg_roi) if bg_roi.size > 0 else roi_mean

            contrast = abs(roi_mean - bg_mean) / 255.0

            perimeter = cv2.arcLength(contour, True)
            circularity = 0
            if perimeter > 0:
                circularity = 4 * math.pi * area / (perimeter * perimeter)

            aspect_ratio = w / h if h > 0 else 1.0

            rect_area = w * h
            extent = area / rect_area if rect_area > 0 else 0

            class_name, class_score = self._classify_defect(
                area, aspect_ratio, circularity, extent, roi_std
            )

            area_score = min(1.0, math.log(area / min_area) / 5.0)
            contrast_score = min(1.0, contrast * 3.0)
            complexity_score = 1.0 - abs(circularity - 0.5) * 0.5

            confidence = 0.4 * contrast_score + 0.3 * area_score + 0.3 * complexity_score
            confidence = confidence * (0.7 + 0.3 * class_score)
            confidence = max(0.5, min(0.99, confidence))
            confidence = round(confidence, 3)

            defects.append({
                "class_name": class_name,
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2],
                "area": area
            })

        defects.sort(key=lambda x: x["confidence"], reverse=True)

        defects = self._suppress_overlapping(defects)

        result = []
        for idx, d in enumerate(defects):
            result.append({
                "class_name": d["class_name"],
                "confidence": d["confidence"],
                "bbox": d["bbox"]
            })

        return result

    def _classify_defect(self, area, aspect_ratio, circularity, extent, std):
        """
        根据几何特征对缺陷进行分类

        Returns:
            (class_name, class_confidence)
        """
        scores = {}

        scores["scratch"] = 0.0
        if aspect_ratio > 3.0 or aspect_ratio < 0.33:
            scores["scratch"] = min(1.0, abs(aspect_ratio - 1.0) / 4.0)
        scores["scratch"] += 0.3 * (1.0 - circularity)

        scores["dent"] = 0.5 * circularity
        if 0.7 < aspect_ratio < 1.4 and circularity > 0.6:
            scores["dent"] += 0.3

        scores["stain"] = 0.0
        if area > 1000 and 0.5 < aspect_ratio < 2.0:
            scores["stain"] = 0.6
        scores["stain"] += 0.4 * (std / 50.0)

        scores["crack"] = 0.0
        if aspect_ratio > 5.0 or aspect_ratio < 0.2:
            scores["crack"] = 0.7
        scores["crack"] += 0.3 * (1.0 - extent)

        scores["missing_part"] = 0.0
        if area > 5000 and extent > 0.6:
            scores["missing_part"] = 0.5
        scores["missing_part"] += 0.5 * (1.0 - circularity)

        scores["rust"] = 0.4 * (std / 60.0)
        if 0.6 < aspect_ratio < 1.6 and area > 500:
            scores["rust"] += 0.3
        scores["rust"] += 0.3 * (1.0 - circularity)

        best_class = max(scores, key=scores.get)
        best_score = min(1.0, scores[best_class])

        return best_class, best_score

    def _suppress_overlapping(self, defects, iou_threshold=0.3):
        """
        非极大值抑制，去除重叠的检测框
        """
        if len(defects) <= 1:
            return defects

        remaining = sorted(defects, key=lambda x: x["confidence"], reverse=True)
        result = []

        while remaining:
            current = remaining.pop(0)
            result.append(current)

            new_remaining = []
            for other in remaining:
                iou = self._calculate_iou(current["bbox"], other["bbox"])
                if iou < iou_threshold:
                    new_remaining.append(other)
            remaining = new_remaining

        return result

    def _calculate_iou(self, bbox1, bbox2):
        """
        计算两个边界框的 IoU
        """
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2

        inter_x1 = max(x1_1, x1_2)
        inter_y1 = max(y1_1, y1_2)
        inter_x2 = min(x2_1, x2_2)
        inter_y2 = min(y2_1, y2_2)

        inter_w = max(0, inter_x2 - inter_x1)
        inter_h = max(0, inter_y2 - inter_y1)
        inter_area = inter_w * inter_h

        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)

        union_area = area1 + area2 - inter_area
        if union_area == 0:
            return 0

        return inter_area / union_area


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
