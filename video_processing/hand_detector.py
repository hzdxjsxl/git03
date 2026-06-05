import cv2
import mediapipe as mp
import numpy as np
import os
from config import HAND_CONFIG, BASE_DIR


class HandDetector:
    def __init__(self):
        self.base_options = mp.tasks.BaseOptions
        self.hand_landmarker = mp.tasks.vision.HandLandmarker
        self.hand_landmarker_options = mp.tasks.vision.HandLandmarkerOptions
        self.vision_running_mode = mp.tasks.vision.RunningMode
        
        self.HAND_CONNECTIONS = [
            (0, 1), (1, 2), (2, 3), (3, 4),
            (0, 5), (5, 6), (6, 7), (7, 8),
            (5, 9), (9, 10), (10, 11), (11, 12),
            (9, 13), (13, 14), (14, 15), (15, 16),
            (13, 17), (17, 18), (18, 19), (19, 20),
            (0, 17)
        ]
        
        model_path = os.path.join(BASE_DIR, 'models', 'hand_landmarker.task')
        
        self.options = self.hand_landmarker_options(
            base_options=self.base_options(
                model_asset_path=model_path
            ),
            running_mode=self.vision_running_mode.VIDEO,
            num_hands=HAND_CONFIG['max_num_hands'],
            min_hand_detection_confidence=HAND_CONFIG['min_detection_confidence'],
            min_hand_presence_confidence=HAND_CONFIG['min_tracking_confidence'],
            min_tracking_confidence=HAND_CONFIG['min_tracking_confidence']
        )
        
        self.detector = self.hand_landmarker.create_from_options(self.options)
        self.frame_count = 0
        
    def detect_hands(self, frame):
        self.frame_count += 1
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        results = self.detector.detect_for_video(mp_image, self.frame_count)
        return results
        
    def get_landmarks(self, results):
        landmarks_list = []
        if results.hand_landmarks:
            for hand_landmarks in results.hand_landmarks:
                landmarks = []
                for lm in hand_landmarks:
                    landmarks.append([lm.x, lm.y, lm.z])
                landmarks_list.append(np.array(landmarks))
        return landmarks_list
        
    def draw_landmarks(self, frame, results):
        if results.hand_landmarks:
            h, w, _ = frame.shape
            
            for hand_landmarks in results.hand_landmarks:
                landmarks_px = []
                for lm in hand_landmarks:
                    landmarks_px.append((int(lm.x * w), int(lm.y * h)))
                
                for start_idx, end_idx in self.HAND_CONNECTIONS:
                    cv2.line(
                        frame,
                        landmarks_px[start_idx],
                        landmarks_px[end_idx],
                        (250, 44, 250),
                        2
                    )
                
                for i, (x, y) in enumerate(landmarks_px):
                    if i in [4, 8, 12, 16, 20]:
                        color = (255, 0, 0)
                        radius = 6
                    else:
                        color = (121, 22, 76)
                        radius = 4
                    cv2.circle(frame, (x, y), radius, color, -1)
        
        return frame
        
    def close(self):
        self.detector.close()
