import cv2
import numpy as np
import time
from video_processing import HandDetector, FeatureExtractor
from model_inference import GestureClassifier, ResultSmoother
from model_inference.result_smoother import TextAggregator

print("="*60)
print("手势识别调试脚本")
print("="*60)

print("\n[1/5] 初始化模块...")
detector = HandDetector()
extractor = FeatureExtractor()
classifier = GestureClassifier()
smoother = ResultSmoother(window_size=5)
aggregator = TextAggregator(min_stable_frames=5, cooldown_frames=15)

print(f"  分类器后端: {classifier.backend}")
print(f"  置信度阈值: {classifier.confidence_threshold}")

print("\n[2/5] 打开摄像头...")
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("  无法打开摄像头！")
    exit(1)
print("  摄像头打开成功")

print("\n[3/5] 开始实时检测（按q退出）...")
print("  将手放在摄像头前，观察控制台输出")
print()

frame_count = 0
last_text = ""

while True:
    ret, frame = cap.read()
    if not ret:
        print("无法读取帧")
        break
    
    frame_count += 1
    
    results = detector.detect_hands(frame)
    landmarks_list = detector.get_landmarks(results)
    
    status = "等待手势..."
    gesture_label = None
    confidence = 0.0
    
    if landmarks_list and len(landmarks_list) > 0:
        landmarks = landmarks_list[0]
        features = extractor.extract_features(landmarks)
        
        if features is not None:
            predicted_class, confidence = classifier.predict(features, landmarks)
            
            if predicted_class is not None:
                gesture_label = classifier.get_gesture_label(predicted_class)
                status = f"检测到: {gesture_label} (置信度: {confidence:.2f})"
                
                smoother.add_prediction(gesture_label, confidence)
                smoothed_gesture, smoothed_conf = smoother.get_smoothed_prediction()
                
                if smoothed_gesture is not None:
                    new_char = aggregator.update(smoothed_gesture)
                    current_text = aggregator.get_text()
                    
                    if current_text != last_text:
                        last_text = current_text
                        print(f"[{frame_count}] 文本更新: '{current_text}'")
                    
                    status = f"平滑: {smoothed_gesture} (文本: '{current_text}')"
                else:
                    smoother.add_prediction(None, 0)
                    aggregator.update(None)
            else:
                status = f"置信度不足 ({confidence:.2f} < {classifier.confidence_threshold})"
                smoother.add_prediction(None, 0)
                aggregator.update(None)
        else:
            status = "特征提取失败"
            smoother.add_prediction(None, 0)
            aggregator.update(None)
    else:
        smoother.add_prediction(None, 0)
        aggregator.update(None)
    
    if frame_count % 30 == 0:
        print(f"[{frame_count}] {status}")
    
    cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    frame = detector.draw_landmarks(frame, results)
    
    cv2.imshow('Debug - Gesture Recognition', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
detector.close()

print(f"\n最终识别文本: '{aggregator.get_text()}'")
print("调试完成!")
