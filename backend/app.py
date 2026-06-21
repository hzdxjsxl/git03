"""
Flask 应用入口 - API 路由模块
只负责 HTTP 请求处理和响应格式化
与检测逻辑、模型加载完全解耦
"""

import os
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from detector import (
    allowed_file,
    save_uploaded_file,
    detect_defects,
    get_image_info,
    cleanup_image,
    CONFIDENCE_THRESHOLD
)
from model_loader import get_model, reload_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024


@app.route("/")
def index():
    """
    首页 - 提供前端页面
    """
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    健康检查接口
    """
    model = get_model()
    return jsonify({
        "status": "ok",
        "model_loaded": model.is_loaded,
        "confidence_threshold": CONFIDENCE_THRESHOLD
    })


@app.route("/api/detect", methods=["POST"])
def detect():
    """
    缺陷检测接口
    接收图像文件，返回缺陷原始坐标和置信度

    Request:
        - image: 图像文件 (multipart/form-data)
        - threshold: 可选，置信度阈值

    Response:
        - success: bool
        - data: {
            image_info: {width, height, format},
            defects: [{id, class_name, confidence, bbox: {x1,y1,x2,y2}}],
            defect_count: int,
            has_defect: bool
          }
        - image_url: 图像访问URL
        - message: 错误信息（失败时）
    """
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "未找到图像文件，请确保字段名为 'image'"
        }), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({
            "success": False,
            "message": "未选择文件"
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "message": "不支持的文件格式，支持: png, jpg, jpeg, bmp, tiff"
        }), 400

    try:
        threshold = request.form.get("threshold", type=float)
        image_path = save_uploaded_file(file)
        image_filename = os.path.basename(image_path)

        result = detect_defects(image_path, confidence_threshold=threshold)

        return jsonify({
            "success": True,
            "data": result,
            "image_url": f"/uploads/{image_filename}"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"检测失败: {str(e)}"
        }), 500


@app.route("/api/image/info", methods=["POST"])
def image_info():
    """
    获取图像信息接口
    """
    if "image" not in request.files:
        return jsonify({"success": False, "message": "未找到图像文件"}), 400

    file = request.files["image"]
    try:
        image_path = save_uploaded_file(file)
        info = get_image_info(image_path)
        cleanup_image(image_path)
        return jsonify({
            "success": True,
            "data": info
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/api/model/reload", methods=["POST"])
def reload():
    """
    重新加载模型
    """
    try:
        model_path = request.json.get("model_path") if request.is_json else None
        reload_model(model_path=model_path)
        return jsonify({
            "success": True,
            "message": "模型重新加载成功"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    """
    访问上传的图像
    """
    return send_from_directory(UPLOAD_DIR, filename)


@app.errorhandler(413)
def too_large(e):
    return jsonify({
        "success": False,
        "message": "文件过大，最大支持 16MB"
    }), 413


if __name__ == "__main__":
    print("=" * 60)
    print("  工业流水线零件表面缺陷视觉检测平台")
    print("  后端服务启动中...")
    print("=" * 60)
    print(f"  前端页面: http://localhost:5000/")
    print(f"  检测接口: http://localhost:5000/api/detect")
    print(f"  健康检查: http://localhost:5000/api/health")
    print("=" * 60)

    print("\n正在加载缺陷检测模型...")
    model = get_model()
    if not model.is_loaded:
        print("警告: 模型加载失败")
    else:
        print(f"模型就绪，缺陷类别: {model.get_class_names()}\n")

    app.run(host="0.0.0.0", port=5000, debug=False)
