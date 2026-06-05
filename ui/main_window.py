import cv2
import numpy as np
from PyQt5.QtWidgets import QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QLabel, QMessageBox
from PyQt5.QtGui import QImage, QPixmap, QFont
from PyQt5.QtCore import Qt, QTimer
from config import UI_CONFIG
from .result_display import ResultDisplay


class MainWindow(QMainWindow):
    def __init__(self, video_capture, hand_detector, feature_extractor, gesture_classifier, result_smoother, text_aggregator):
        super().__init__()
        self.video_capture = video_capture
        self.hand_detector = hand_detector
        self.feature_extractor = feature_extractor
        self.gesture_classifier = gesture_classifier
        self.result_smoother = result_smoother
        self.text_aggregator = text_aggregator
        
        self.init_ui()
        self.init_connections()
        
    def init_ui(self):
        self.setWindowTitle(UI_CONFIG['window_title'])
        self.setGeometry(100, 100, 1200, 700)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QHBoxLayout()
        main_layout.setSpacing(20)
        main_layout.setContentsMargins(20, 20, 20, 20)
        
        left_layout = QVBoxLayout()
        
        video_label_title = QLabel("摄像头画面")
        video_label_title.setFont(QFont("Microsoft YaHei", 16, QFont.Bold))
        video_label_title.setAlignment(Qt.AlignCenter)
        left_layout.addWidget(video_label_title)
        
        self.video_label = QLabel()
        self.video_label.setMinimumSize(640, 480)
        self.video_label.setStyleSheet("""
            QLabel {
                border: 3px solid #2196F3;
                border-radius: 10px;
                background-color: #000000;
            }
        """)
        self.video_label.setAlignment(Qt.AlignCenter)
        left_layout.addWidget(self.video_label)
        
        left_layout.addStretch()
        main_layout.addLayout(left_layout, 2)
        
        self.result_display = ResultDisplay()
        self.result_display.set_text_aggregator(self.text_aggregator)
        main_layout.addWidget(self.result_display, 1)
        
        central_widget.setLayout(main_layout)
        
    def init_connections(self):
        self.video_capture.frame_ready.connect(self.process_frame)
        
    def start(self):
        self.video_capture.start_capture()
        
    def stop(self):
        self.video_capture.stop_capture()
        self.hand_detector.close()
        
    def process_frame(self, frame):
        results = self.hand_detector.detect_hands(frame)
        landmarks_list = self.hand_detector.get_landmarks(results)
        
        frame = self.hand_detector.draw_landmarks(frame, results)
        
        predicted_class = None
        confidence = 0.0
        
        if landmarks_list and len(landmarks_list) > 0:
            features = self.feature_extractor.extract_features(landmarks_list[0])
            
            if features is not None:
                predicted_class, confidence = self.gesture_classifier.predict(features)
                
                gesture_label = None
                if predicted_class is not None:
                    gesture_label = self.gesture_classifier.get_gesture_label(predicted_class)
                
                self.result_smoother.add_prediction(gesture_label, confidence)
                
                smoothed_gesture, smoothed_confidence = self.result_smoother.get_smoothed_prediction()
                
                if smoothed_gesture is not None:
                    self.text_aggregator.update(smoothed_gesture)
                    self.result_display.update_current_gesture(smoothed_gesture, smoothed_confidence)
                else:
                    self.result_display.update_current_gesture(None, 0)
                
                self.result_display.update_text(self.text_aggregator.get_text())
            else:
                self.result_smoother.add_prediction(None, 0)
                self.text_aggregator.update(None)
                self.result_display.update_current_gesture(None, 0)
                self.result_display.update_text(self.text_aggregator.get_text())
        else:
            self.result_smoother.add_prediction(None, 0)
            self.text_aggregator.update(None)
            self.result_display.update_current_gesture(None, 0)
            self.result_display.update_text(self.text_aggregator.get_text())
        
        self.display_frame(frame)
        
    def display_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_frame.shape
        bytes_per_line = ch * w
        qt_image = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
        
        scaled_pixmap = QPixmap.fromImage(qt_image).scaled(
            self.video_label.size(),
            Qt.KeepAspectRatio,
            Qt.SmoothTransformation
        )
        
        self.video_label.setPixmap(scaled_pixmap)
        
    def closeEvent(self, event):
        reply = QMessageBox.question(
            self,
            '确认退出',
            '确定要退出实时手语翻译系统吗？',
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.stop()
            event.accept()
        else:
            event.ignore()
