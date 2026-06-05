import sys
import traceback
from PyQt5.QtWidgets import QApplication, QMessageBox
from PyQt5.QtCore import Qt

try:
    from video_processing import VideoCapture, HandDetector, FeatureExtractor
    from model_inference import GestureClassifier, ResultSmoother
    from model_inference.result_smoother import TextAggregator
    from ui import MainWindow
except Exception as e:
    print(f"导入模块失败: {e}")
    traceback.print_exc()
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling)
    app = QApplication(sys.argv)
    QMessageBox.critical(None, "启动错误", f"导入模块失败: {e}\n\n详情: {traceback.format_exc()}")
    sys.exit(1)


def main():
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling)
    app = QApplication(sys.argv)
    
    video_capture = None
    hand_detector = None
    
    try:
        print("=" * 60)
        print("实时手语翻译系统")
        print("=" * 60)
        
        print("\n[1/6] 初始化视频捕获...")
        video_capture = VideoCapture()
        print("  视频捕获初始化成功")
        
        print("\n[2/6] 初始化手部检测器...")
        hand_detector = HandDetector()
        print("  手部检测器初始化成功")
        
        print("\n[3/6] 初始化特征提取器...")
        feature_extractor = FeatureExtractor()
        print("  特征提取器初始化成功")
        
        print("\n[4/6] 初始化手势分类器...")
        gesture_classifier = GestureClassifier()
        print("  手势分类器初始化成功")
        
        print("\n[5/6] 初始化结果平滑器...")
        result_smoother = ResultSmoother(window_size=8)
        print("  结果平滑器初始化成功")
        
        print("\n[6/6] 初始化文本聚合器...")
        text_aggregator = TextAggregator(min_stable_frames=5, cooldown_frames=15)
        print("  文本聚合器初始化成功")
        
        print("\n正在初始化用户界面...")
        main_window = MainWindow(
            video_capture=video_capture,
            hand_detector=hand_detector,
            feature_extractor=feature_extractor,
            gesture_classifier=gesture_classifier,
            result_smoother=result_smoother,
            text_aggregator=text_aggregator
        )
        
        print("\n" + "=" * 60)
        print("系统启动成功！")
        print("=" * 60)
        print("\n使用说明:")
        print("  - 将手放在摄像头前，保持手掌面向镜头")
        print("  - 系统会自动检测手部关键点并识别手势")
        print("  - 保持手势稳定1-2秒，对应的字母会被添加到翻译文本中")
        print("  - 使用右侧的'清空'和'退格'按钮可以编辑翻译结果")
        print("  - 关闭窗口退出程序")
        print("\n" + "=" * 60 + "\n")
        
        main_window.show()
        main_window.start()
        
        sys.exit(app.exec_())
        
    except Exception as e:
        error_msg = f"系统启动失败: {str(e)}\n\n详细信息:\n{traceback.format_exc()}"
        print(f"\n错误: {error_msg}")
        
        if video_capture:
            try:
                video_capture.stop_capture()
            except:
                pass
        if hand_detector:
            try:
                hand_detector.close()
            except:
                pass
        
        QMessageBox.critical(
            None,
            "系统启动错误",
            f"{str(e)}\n\n详情请查看控制台输出",
            QMessageBox.Ok
        )
        sys.exit(1)


if __name__ == '__main__':
    main()
