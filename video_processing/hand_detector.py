import cv2
import mediapipe as mp
import numpy as np
from config import HAND_CONFIG


class HandDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.hands = self.mp_hands.Hands(
            max_num_hands=HAND_CONFIG['max_num_hands'],
            min_detection_confidence=HAND_CONFIG['min_detection_confidence'],
            min_tracking_confidence=HAND_CONFIG['min_tracking_confidence']
        )
        
    def detect_hands(self, frame):
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(frame_rgb)
        return results
        
    def get_landmarks(self, results):
        landmarks_list = []
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.append([lm.x, lm.y, lm.z])
                landmarks_list.append(np.array(landmarks))
        return landmarks_list
        
    def draw_landmarks(self, frame, results):
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=4),
                    self.mp_drawing.DrawingSpec(color=(250, 44, 250), thickness=2, circle_radius=2)
                )
        return frame
        
    def close(self):
        self.hands.close()
