"""
缺陷检测服务模块
业务逻辑层，封装图像预处理、模型调用、结果整理
与路由层解耦，便于单元测试和逻辑复用
"""

import os
import uuid
from PIL import Image

from model_loader import get_model

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "tiff"}

CONFIDENCE_THRESHOLD = 0.5


def allowed_file(filename):
    """
    检查文件扩展名是否允许
    """
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file_storage):
    """
    保存上传的文件到 uploads 目录

    Args:
        file_storage: Flask 的 FileStorage 对象

    Returns:
        str: 保存后的文件绝对路径
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(UPLOAD_DIR, unique_name)
    file_storage.save(save_path)
    return save_path


def get_image_info(image_path):
    """
    获取图像基本信息

    Returns:
        dict: 包含 width, height, format
    """
    with Image.open(image_path) as img:
        return {
            "width": img.width,
            "height": img.height,
            "format": img.format
        }


def detect_defects(image_path, confidence_threshold=None):
    """
    执行缺陷检测

    Args:
        image_path: 输入图像路径
        confidence_threshold: 置信度阈值，默认使用全局阈值

    Returns:
        dict: 检测结果
            - image_info: 图像信息 {width, height, format}
            - defects: 缺陷列表，每个元素包含 class_name, confidence, bbox
            - defect_count: 缺陷数量
            - has_defect: 是否有缺陷
    """
    if confidence_threshold is None:
        confidence_threshold = CONFIDENCE_THRESHOLD

    model = get_model()
    image_info = get_image_info(image_path)

    raw_results = model.predict(
        image_path,
        image_size=(image_info["width"], image_info["height"])
    )

    filtered = [
        r for r in raw_results
        if r["confidence"] >= confidence_threshold
    ]

    defects = []
    for idx, item in enumerate(filtered):
        defects.append({
            "id": idx + 1,
            "class_name": item["class_name"],
            "confidence": item["confidence"],
            "bbox": {
                "x1": int(item["bbox"][0]),
                "y1": int(item["bbox"][1]),
                "x2": int(item["bbox"][2]),
                "y2": int(item["bbox"][3])
            }
        })

    return {
        "image_info": image_info,
        "defects": defects,
        "defect_count": len(defects),
        "has_defect": len(defects) > 0
    }


def cleanup_image(image_path):
    """
    清理图像文件
    """
    try:
        if os.path.exists(image_path):
            os.remove(image_path)
            return True
    except Exception:
        pass
    return False
