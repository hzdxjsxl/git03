import numpy as np
from model_inference.gesture_classifier import RuleBasedGestureClassifier

print("测试规则分类器...")

classifier = RuleBasedGestureClassifier()

test_cases = [
    ("A (仅拇指伸出)", [True, False, False, False, False]),
    ("B (四指伸出)", [False, True, True, True, True]),
    ("C (全部伸出)", [True, True, True, True, True]),
    ("D (拇指+食指)", [True, True, False, False, False]),
]

for name, fingers in test_cases:
    landmarks = np.zeros((21, 3))
    
    if fingers[0]:
        landmarks[4] = [0.5, 0, 0]
    
    for i in range(1, 5):
        if fingers[i]:
            landmarks[4 + i*4] = [i*0.2, -0.5, 0]
    
    result, confidence = classifier.classify(landmarks)
    print(f"{name}: 预测={result}, 置信度={confidence:.2f}")

print("\n测试完成!")
