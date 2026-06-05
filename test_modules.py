import sys
import traceback

def test_imports():
    print("="*50)
    print("测试1: 导入所有模块")
    print("="*50)
    try:
        import cv2
        print("  [OK] cv2")
    except Exception as e:
        print(f"  [FAIL] cv2: {e}")
        return False
    
    try:
        import mediapipe
        print("  [OK] mediapipe")
    except Exception as e:
        print(f"  [FAIL] mediapipe: {e}")
        return False
    
    try:
        import numpy
        print("  [OK] numpy")
    except Exception as e:
        print(f"  [FAIL] numpy: {e}")
        return False
    
    try:
        from PyQt5.QtWidgets import QApplication
        print("  [OK] PyQt5")
    except Exception as e:
        print(f"  [FAIL] PyQt5: {e}")
        return False
    
    print("  [SKIP] torch (不再使用PyTorch，改用纯NumPy实现)")
    
    return True

def test_video_processing():
    print("\n" + "="*50)
    print("测试2: 视频处理模块")
    print("="*50)
    
    try:
        from video_processing import HandDetector, FeatureExtractor
        print("  [OK] 导入视频处理模块")
        
        detector = HandDetector()
        print("  [OK] 初始化HandDetector")
        
        extractor = FeatureExtractor()
        print("  [OK] 初始化FeatureExtractor")
        
        detector.close()
        print("  [OK] 关闭HandDetector")
        
        return True
    except Exception as e:
        print(f"  [FAIL] 视频处理模块失败: {e}")
        traceback.print_exc()
        return False

def test_model_inference():
    print("\n" + "="*50)
    print("测试3: 模型推理模块")
    print("="*50)
    
    try:
        from model_inference import GestureClassifier, ResultSmoother
        from model_inference.result_smoother import TextAggregator
        print("  [OK] 导入模型推理模块")
        
        classifier = GestureClassifier()
        print("  [OK] 初始化GestureClassifier")
        
        smoother = ResultSmoother()
        print("  [OK] 初始化ResultSmoother")
        
        aggregator = TextAggregator()
        print("  [OK] 初始化TextAggregator")
        
        return True
    except Exception as e:
        print(f"  [FAIL] 模型推理模块失败: {e}")
        traceback.print_exc()
        return False

def test_camera():
    print("\n" + "="*50)
    print("测试4: 摄像头访问")
    print("="*50)
    
    try:
        import cv2
        
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("  [FAIL] 无法打开摄像头")
            return False
        
        ret, frame = cap.read()
        if ret:
            print(f"  [OK] 摄像头读取成功，帧大小: {frame.shape}")
        else:
            print("  [FAIL] 无法读取摄像头帧")
        
        cap.release()
        print("  [OK] 摄像头关闭成功")
        
        return True
    except Exception as e:
        print(f"  [FAIL] 摄像头测试失败: {e}")
        traceback.print_exc()
        return False

def main():
    print("开始模块测试...\n")
    
    all_passed = True
    
    all_passed &= test_imports()
    all_passed &= test_video_processing()
    all_passed &= test_model_inference()
    all_passed &= test_camera()
    
    print("\n" + "="*50)
    if all_passed:
        print("所有测试通过！")
    else:
        print("部分测试失败，请检查错误信息")
    print("="*50)
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
