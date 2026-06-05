import sys
sys.path.insert(0, '.')

print("="*60)
print("验证修复")
print("="*60)

print("\n[1] 测试手势分类器初始化...")
from model_inference.gesture_classifier import GestureClassifier
classifier = GestureClassifier()
print(f"  后端: {classifier.backend}")
print(f"  置信度阈值: {classifier.confidence_threshold}")
assert classifier.backend == 'rule', f"期望后端是'rule'，实际是{classifier.backend}"
print("  ✓ 分类器初始化正确")

print("\n[2] 测试规则分类...")
import numpy as np
landmarks = np.zeros((21, 3))
landmarks[4] = [0.5, 0, 0]
landmarks[8] = [0.2, -0.5, 0]
landmarks[12] = [0.4, -0.5, 0]
landmarks[16] = [0.6, -0.5, 0]
landmarks[20] = [0.8, -0.5, 0]

result, confidence = classifier.predict(None, landmarks)
label = classifier.get_gesture_label(result)
print(f"  预测结果: {result} ({label})")
print(f"  置信度: {confidence:.2f}")
assert result is not None, "预测结果不应为None"
print("  ✓ 规则分类正常工作")

print("\n[3] 测试结果平滑器...")
from model_inference import ResultSmoother
smoother = ResultSmoother(window_size=3)
smoother.add_prediction('A', 0.9)
smoother.add_prediction('A', 0.8)
smoother.add_prediction('A', 0.85)
result, conf = smoother.get_smoothed_prediction()
print(f"  平滑结果: {result}, {conf:.2f}")
assert result == 'A', f"期望'A'，实际是{result}"
print("  ✓ 平滑器正常工作")

print("\n[4] 测试文本聚合器...")
from model_inference.result_smoother import TextAggregator
aggregator = TextAggregator(min_stable_frames=2, cooldown_frames=5)
aggregator.update('B')
aggregator.update('B')
result = aggregator.get_text()
print(f"  聚合结果: '{result}'")
assert 'B' in result, f"文本中应该包含'B'，实际是'{result}'"
print("  ✓ 文本聚合正常工作")

print("\n" + "="*60)
print("所有验证通过！修复成功！")
print("="*60)
