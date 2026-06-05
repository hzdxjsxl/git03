import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt

from video_processing import VideoCapture, HandDetector, FeatureExtractor
from model_inference import GestureClassifier, ResultSmoother
from model_inference.result_smoother import TextAggregator
from ui import MainWindow


def main():
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling)
    app = QApplication(sys.argv)
    
    print("正在初始化视频捕获...")
    video_capture = VideoCapture()
    
    print("正在初始化手部检测器...")
    hand_detector = HandDetector()
    
    print("正在初始化特征提取器...")
    feature_extractor = FeatureExtractor()
    
    print("正在初始化手势分类器...")
    gesture_classifier = GestureClassifier()
    
    print("正在初始化结果平滑器...")
    result_smoother = ResultSmoother(window_size=8)
    
    print("正在初始化文本聚合器...")
    text_aggregator = TextAggregator(min_stable_frames=10, cooldown_frames=20)
    
    print("正在初始化用户界面...")
    main_window = MainWindow(
        video_capture=video_capture,
        hand_detector=hand_detector,
        feature_extractor=feature_extractor,
        gesture_classifier=gesture_classifier,
        result_smoother=result_smoother,
        text_aggregator=text_aggregator
    )
    
    print("启动系统...")
    main_window.show()
    main_window.start()
    
    print("系统已启动！")
    print("提示:")
    print("  - 将手放在摄像头前，系统会自动检测手势")
    print("  - 保持手势稳定以添加字符")
    print("  - 使用右侧按钮可以清空或退格")
    
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
