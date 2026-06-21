import cv2
import numpy as np

width, height = 800, 600
img = np.ones((height, width, 3), dtype=np.uint8) * 180

cv2.ellipse(img, (400, 300), (280, 200), 0, 0, 360, (160, 160, 160), -1)
cv2.ellipse(img, (400, 300), (280, 200), 0, 0, 360, (140, 140, 140), 3)

for i in range(20):
    x = np.random.randint(150, 650)
    y = np.random.randint(130, 470)
    r = np.random.randint(20, 40)
    color = np.random.randint(150, 170)
    cv2.circle(img, (x, y), r, (color, color, color), -1)

cv2.line(img, (200, 180), (320, 220), (90, 90, 90), 2)
cv2.line(img, (210, 185), (330, 225), (100, 100, 100), 1)

cv2.line(img, (500, 350), (620, 420), (85, 85, 85), 1)
cv2.line(img, (510, 345), (640, 430), (95, 95, 95), 2)
cv2.line(img, (520, 360), (630, 410), (80, 80, 80), 1)

cv2.circle(img, (300, 380), 15, (200, 200, 200), -1)
cv2.circle(img, (305, 375), 8, (210, 210, 210), -1)

cv2.circle(img, (550, 200), 20, (210, 210, 210), -1)
cv2.circle(img, (545, 195), 10, (220, 220, 220), -1)

cv2.ellipse(img, (450, 280), (40, 25), 30, 0, 360, (100, 100, 100), -1)

cv2.rectangle(img, (150, 400), (190, 440), (120, 120, 120), -1)
cv2.rectangle(img, (155, 405), (185, 435), (100, 100, 100), -1)

cv2.line(img, (600, 480), (700, 500), (90, 90, 90), 3)

for i in range(5):
    x = np.random.randint(650, 720)
    y = np.random.randint(450, 520)
    size = np.random.randint(5, 15)
    cv2.circle(img, (x, y), size, (110, 80, 60), -1)

cv2.imwrite('uploads/test_defects.png', img)
print('测试图已生成: uploads/test_defects.png')
print(f'尺寸: {width} x {height}')
print('包含缺陷:')
print('  - 划痕 (2条)')
print('  - 凹坑 (2个)')
print('  - 污渍 (1处)')
print('  - 缺损 (1处)')
print('  - 裂纹 (1条)')
print('  - 锈蚀 (斑点)')
