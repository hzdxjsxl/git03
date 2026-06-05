from PyQt5.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit, QPushButton
from PyQt5.QtGui import QFont, QColor, QPalette
from PyQt5.QtCore import Qt
from config import UI_CONFIG


class ResultDisplay(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout()
        layout.setSpacing(15)
        
        title_label = QLabel("实时翻译结果")
        title_label.setFont(QFont("Microsoft YaHei", 16, QFont.Bold))
        title_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(title_label)
        
        current_layout = QHBoxLayout()
        current_label = QLabel("当前手势:")
        current_label.setFont(QFont("Microsoft YaHei", 12))
        self.current_gesture = QLabel("-")
        self.current_gesture.setFont(QFont("Arial", 48, QFont.Bold))
        self.current_gesture.setStyleSheet("color: #2196F3;")
        self.current_gesture.setAlignment(Qt.AlignCenter)
        self.current_gesture.setMinimumWidth(100)
        current_layout.addWidget(current_label)
        current_layout.addWidget(self.current_gesture)
        current_layout.addStretch()
        layout.addLayout(current_layout)
        
        confidence_layout = QHBoxLayout()
        confidence_label = QLabel("置信度:")
        confidence_label.setFont(QFont("Microsoft YaHei", 12))
        self.confidence_value = QLabel("0%")
        self.confidence_value.setFont(QFont("Microsoft YaHei", 12))
        confidence_layout.addWidget(confidence_label)
        confidence_layout.addWidget(self.confidence_value)
        confidence_layout.addStretch()
        layout.addLayout(confidence_layout)
        
        history_label = QLabel("翻译文本:")
        history_label.setFont(QFont("Microsoft YaHei", 12))
        layout.addWidget(history_label)
        
        self.text_display = QTextEdit()
        self.text_display.setFont(QFont("Microsoft YaHei", 14))
        self.text_display.setReadOnly(True)
        self.text_display.setMinimumHeight(150)
        self.text_display.setStyleSheet("""
            QTextEdit {
                background-color: #F5F5F5;
                border: 2px solid #E0E0E0;
                border-radius: 8px;
                padding: 10px;
            }
        """)
        layout.addWidget(self.text_display)
        
        button_layout = QHBoxLayout()
        
        self.clear_button = QPushButton("清空")
        self.clear_button.setFont(QFont("Microsoft YaHei", 11))
        self.clear_button.setStyleSheet("""
            QPushButton {
                background-color: #F44336;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #D32F2F;
            }
        """)
        self.clear_button.clicked.connect(self.clear_text)
        button_layout.addWidget(self.clear_button)
        
        self.backspace_button = QPushButton("退格")
        self.backspace_button.setFont(QFont("Microsoft YaHei", 11))
        self.backspace_button.setStyleSheet("""
            QPushButton {
                background-color: #FF9800;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #F57C00;
            }
        """)
        self.backspace_button.clicked.connect(self.backspace)
        button_layout.addWidget(self.backspace_button)
        
        layout.addLayout(button_layout)
        
        status_layout = QHBoxLayout()
        self.status_label = QLabel("状态: 等待手势...")
        self.status_label.setFont(QFont("Microsoft YaHei", 10))
        self.status_label.setStyleSheet("color: #757575;")
        status_layout.addWidget(self.status_label)
        status_layout.addStretch()
        layout.addLayout(status_layout)
        
        self.setLayout(layout)
        
    def update_current_gesture(self, gesture, confidence):
        if gesture is not None:
            self.current_gesture.setText(gesture)
            self.confidence_value.setText(f"{confidence * 100:.1f}%")
            self.status_label.setText("状态: 检测到手势")
        else:
            self.current_gesture.setText("-")
            self.confidence_value.setText("0%")
            self.status_label.setText("状态: 等待手势...")
            
    def update_text(self, text):
        self.text_display.setPlainText(text)
        
    def clear_text(self):
        self.text_display.clear()
        if hasattr(self, 'text_aggregator'):
            self.text_aggregator.clear_text()
            
    def backspace(self):
        if hasattr(self, 'text_aggregator'):
            self.text_aggregator.backspace()
            self.text_display.setPlainText(self.text_aggregator.get_text())
            
    def set_text_aggregator(self, aggregator):
        self.text_aggregator = aggregator
