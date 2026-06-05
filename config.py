import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

VIDEO_CONFIG = {
    'camera_index': 0,
    'frame_width': 640,
    'frame_height': 480,
    'fps': 30,
}

HAND_CONFIG = {
    'max_num_hands': 1,
    'min_detection_confidence': 0.7,
    'min_tracking_confidence': 0.5,
    'num_landmarks': 21,
    'num_features': 126,
}

MODEL_CONFIG = {
    'model_path': os.path.join(BASE_DIR, 'models', 'gesture_classifier.pth'),
    'num_classes': 26,
    'smoothing_window': 5,
    'confidence_threshold': 0.7,
}

UI_CONFIG = {
    'window_title': '实时手语翻译系统',
    'result_display_duration': 2.0,
    'font_size': 24,
    'history_size': 10,
}

GESTURE_MAP = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E',
    5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J',
    10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O',
    15: 'P', 16: 'Q', 17: 'R', 18: 'S', 19: 'T',
    20: 'U', 21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'Z'
}
