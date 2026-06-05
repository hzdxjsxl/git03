import cv2
import numpy as np
from PyQt5.QtCore import QThread, pyqtSignal
from config import VIDEO_CONFIG


class VideoCapture(QThread):
    frame_ready = pyqtSignal(np.ndarray)
    
    def __init__(self, camera_index=None):
        super().__init__()
        self.camera_index = camera_index or VIDEO_CONFIG['camera_index']
        self.running = False
        self.cap = None
        
    def start_capture(self):
        self.running = True
        self.start()
        
    def stop_capture(self):
        self.running = False
        self.wait()
        if self.cap is not None:
            self.cap.release()
            
    def run(self):
        self.cap = cv2.VideoCapture(self.camera_index)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, VIDEO_CONFIG['frame_width'])
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, VIDEO_CONFIG['frame_height'])
        self.cap.set(cv2.CAP_PROP_FPS, VIDEO_CONFIG['fps'])
        
        while self.running:
            ret, frame = self.cap.read()
            if ret:
                frame = cv2.flip(frame, 1)
                self.frame_ready.emit(frame)
            else:
                break
                
        if self.cap is not None:
            self.cap.release()
