"""
工业零件表面缺陷数据集生成器
合成 6 类缺陷：scratch(划痕), crack(裂纹), dent(凹坑), stain(污渍), rust(锈蚀), missing_part(缺损)
"""

import cv2
import numpy as np
import random
import os

random.seed(42)
np.random.seed(42)

DEFECT_CLASSES = {
    0: "scratch",
    1: "crack",
    2: "dent",
    3: "stain",
    4: "rust",
    5: "missing_part"
}

NUM_CLASSES = len(DEFECT_CLASSES)


def generate_metal_surface(width, height):
    img = np.ones((height, width, 3), dtype=np.uint8) * 180

    base_color = random.randint(140, 200)
    img[:, :] = (base_color, base_color, base_color)

    noise = np.random.randint(-15, 15, (height, width, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    for _ in range(random.randint(3, 8)):
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        x2 = x1 + random.randint(50, 200)
        y2 = y1 + random.randint(30, 100)
        color = random.randint(base_color - 20, base_color + 20)
        cv2.rectangle(img, (x1, y1), (x2, y2), (color, color, color), -1)

    if random.random() > 0.3:
        cx = random.randint(width // 4, width * 3 // 4)
        cy = random.randint(height // 4, height * 3 // 4)
        rx = random.randint(width // 5, width // 3)
        ry = random.randint(height // 5, height // 3)
        color = random.randint(base_color - 30, base_color - 10)
        cv2.ellipse(img, (cx, cy), (rx, ry), 0, 0, 360, (color, color, color), -1)

    return img


def add_scratch(img):
    h, w = img.shape[:2]
    angle = random.uniform(-30, 30)
    length = random.randint(60, min(w, h) // 2)
    x1 = random.randint(50, w - 50 - length)
    y1 = random.randint(50, h - 50)

    rad = np.deg2rad(angle)
    x2 = int(x1 + length * np.cos(rad))
    y2 = int(y1 + length * np.sin(rad))

    thickness = random.randint(1, 3)
    color = random.randint(40, 90)

    cv2.line(img, (x1, y1), (x2, y2), (color, color, color), thickness)

    if random.random() > 0.5:
        offset = random.randint(3, 8)
        y1_offset = y1 + random.randint(-2, 2)
        y2_offset = y2 + random.randint(-2, 2)
        cv2.line(img, (x1 + offset, y1_offset), (x2 + offset, y2_offset),
                 (color + 20, color + 20, color + 20), 1)

    px1, py1 = min(x1, x2) - 5, min(y1, y2) - 5
    px2, py2 = max(x1, x2) + 5, max(y1, y2) + 5
    return img, [max(0, px1), max(0, py1), min(w, px2), min(h, py2)]


def add_crack(img):
    h, w = img.shape[:2]
    start_x = random.randint(100, w - 100)
    start_y = random.randint(100, h - 100)

    points = [(start_x, start_y)]
    cx, cy = start_x, start_y
    num_segments = random.randint(5, 12)

    for _ in range(num_segments):
        angle = random.uniform(0, 360)
        seg_len = random.randint(15, 40)
        cx += int(seg_len * np.cos(np.deg2rad(angle)))
        cy += int(seg_len * np.sin(np.deg2rad(angle)))
        cx = max(20, min(w - 20, cx))
        cy = max(20, min(h - 20, cy))
        points.append((cx, cy))

    color = random.randint(20, 60)
    for i in range(len(points) - 1):
        thickness = random.randint(1, 2)
        cv2.line(img, points[i], points[i + 1], (color, color, color), thickness)

    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    px1, py1 = min(xs) - 8, min(ys) - 8
    px2, py2 = max(xs) + 8, max(ys) + 8
    return img, [max(0, px1), max(0, py1), min(w, px2), min(h, py2)]


def add_dent(img):
    h, w = img.shape[:2]
    cx = random.randint(80, w - 80)
    cy = random.randint(80, h - 80)
    rx = random.randint(25, 60)
    ry = random.randint(20, 50)

    center_color = int(img[cy, cx, 0])

    for r in range(max(rx, ry), 0, -1):
        shade = int(max(30, center_color - int(r * 0.8)))
        cv2.ellipse(img, (cx, cy),
                    (int(rx * r / max(rx, ry)), int(ry * r / max(rx, ry))),
                    0, 0, 360, (shade, shade, shade), -1)

    highlight_color = int(min(255, center_color + 40))
    cv2.ellipse(img, (cx - rx // 3, cy - ry // 3),
                (rx // 4, ry // 4), 0, 0, 360,
                (highlight_color, highlight_color, highlight_color), -1)

    return img, [max(0, cx - rx - 5), max(0, cy - ry - 5),
                 min(w, cx + rx + 5), min(h, cy + ry + 5)]


def add_stain(img):
    h, w = img.shape[:2]
    cx = random.randint(60, w - 60)
    cy = random.randint(60, h - 60)

    stain_size = random.randint(30, 80)
    color_b = random.randint(60, 120)
    color_g = random.randint(50, 100)
    color_r = random.randint(40, 90)

    for _ in range(random.randint(5, 15)):
        ox = random.randint(-stain_size // 2, stain_size // 2)
        oy = random.randint(-stain_size // 2, stain_size // 2)
        r = random.randint(8, stain_size // 2)
        alpha = random.uniform(0.3, 0.8)

        overlay = img.copy()
        cv2.circle(overlay, (cx + ox, cy + oy), r, (color_b, color_g, color_r), -1)
        img = cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0)

    return img, [max(0, cx - stain_size - 5), max(0, cy - stain_size - 5),
                 min(w, cx + stain_size + 5), min(h, cy + stain_size + 5)]


def add_rust(img):
    h, w = img.shape[:2]
    cx = random.randint(80, w - 80)
    cy = random.randint(80, h - 80)
    cluster_size = random.randint(40, 100)

    rust_colors = [
        (40, 60, 180),
        (50, 80, 200),
        (30, 50, 160),
        (60, 90, 210),
        (20, 40, 140)
    ]

    for _ in range(random.randint(15, 35)):
        ox = random.randint(-cluster_size, cluster_size)
        oy = random.randint(-cluster_size, cluster_size)
        r = random.randint(3, 15)
        color = random.choice(rust_colors)
        alpha = random.uniform(0.4, 0.9)

        overlay = img.copy()
        cv2.circle(overlay, (cx + ox, cy + oy), r, color, -1)
        img = cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0)

    return img, [max(0, cx - cluster_size - 10), max(0, cy - cluster_size - 10),
                 min(w, cx + cluster_size + 10), min(h, cy + cluster_size + 10)]


def add_missing_part(img):
    h, w = img.shape[:2]
    cx = random.randint(100, w - 100)
    cy = random.randint(100, h - 100)
    size = random.randint(40, 100)

    shape_type = random.choice(["rect", "circle", "irregular"])
    bg_color = (20, 20, 25)

    if shape_type == "rect":
        x1 = cx - size // 2
        y1 = cy - size // 2
        cv2.rectangle(img, (x1, y1), (x1 + size, y1 + int(size * 0.8)), bg_color, -1)
        return img, [max(0, x1 - 3), max(0, y1 - 3),
                     min(w, x1 + size + 3), min(h, y1 + int(size * 0.8) + 3)]

    elif shape_type == "circle":
        cv2.circle(img, (cx, cy), size // 2, bg_color, -1)
        return img, [max(0, cx - size // 2 - 5), max(0, cy - size // 2 - 5),
                     min(w, cx + size // 2 + 5), min(h, cy + size // 2 + 5)]

    else:
        points = []
        for i in range(random.randint(5, 8)):
            angle = (i / 8) * 2 * np.pi + random.uniform(-0.3, 0.3)
            r = size * random.uniform(0.5, 1.0)
            px = int(cx + r * np.cos(angle))
            py = int(cy + r * np.sin(angle))
            points.append([px, py])
        pts = np.array(points, dtype=np.int32)
        cv2.fillPoly(img, [pts], bg_color)

        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        return img, [max(0, min(xs) - 5), max(0, min(ys) - 5),
                     min(w, max(xs) + 5), min(h, max(ys) + 5)]


DEFECT_FUNCTIONS = {
    0: add_scratch,
    1: add_crack,
    2: add_dent,
    3: add_stain,
    4: add_rust,
    5: add_missing_part
}


def generate_sample(width=480, height=360, max_defects=4):
    img = generate_metal_surface(width, height)
    annotations = []

    num_defects = random.randint(1, max_defects)
    used_classes = random.sample(list(DEFECT_FUNCTIONS.keys()),
                                  min(num_defects, NUM_CLASSES))

    for cls_id in used_classes:
        img, bbox = DEFECT_FUNCTIONS[cls_id](img)
        annotations.append({
            "category_id": cls_id,
            "bbox": bbox
        })

    return img, annotations


def generate_dataset(output_dir, num_samples=200, img_size=(480, 360)):
    img_dir = os.path.join(output_dir, "images")
    os.makedirs(img_dir, exist_ok=True)

    dataset = []

    for i in range(num_samples):
        img, annotations = generate_sample(img_size[0], img_size[1])
        img_filename = f"defect_{i:05d}.png"
        img_path = os.path.join(img_dir, img_filename)
        cv2.imwrite(img_path, img)

        dataset.append({
            "file_name": img_filename,
            "width": img_size[0],
            "height": img_size[1],
            "annotations": annotations
        })

        if (i + 1) % 50 == 0:
            print(f"已生成 {i + 1}/{num_samples} 张...")

    import json
    with open(os.path.join(output_dir, "annotations.json"), "w", encoding="utf-8") as f:
        json.dump({
            "categories": [{"id": k, "name": v} for k, v in DEFECT_CLASSES.items()],
            "images": dataset
        }, f, ensure_ascii=False, indent=2)

    print(f"数据集生成完成：{num_samples} 张图像，保存到 {output_dir}")
    print(f"缺陷类别：{list(DEFECT_CLASSES.values())}")
    return dataset


if __name__ == "__main__":
    dataset_dir = "backend/defect_dataset"
    os.makedirs(dataset_dir, exist_ok=True)
    generate_dataset(dataset_dir, num_samples=300, img_size=(480, 360))
