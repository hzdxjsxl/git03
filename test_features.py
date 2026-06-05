import numpy as np
from video_processing import HandDetector, FeatureExtractor

print("测试特征维度...")

detector = HandDetector()
extractor = FeatureExtractor()

dummy_landmarks = np.random.rand(21, 3)
features = extractor.extract_features(dummy_landmarks)

print(f"特征维度: {features.shape}")
print(f"期望维度: 103")
print(f"匹配: {features.shape[0] == 103}")

detector.close()
print("测试完成!")
