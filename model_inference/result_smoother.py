import numpy as np
from collections import deque
from config import MODEL_CONFIG


class ResultSmoother:
    def __init__(self, window_size=None):
        self.window_size = window_size or MODEL_CONFIG['smoothing_window']
        self.predictions_queue = deque(maxlen=self.window_size)
        self.confidences_queue = deque(maxlen=self.window_size)
        
    def add_prediction(self, prediction, confidence):
        self.predictions_queue.append(prediction)
        self.confidences_queue.append(confidence)
        
    def get_smoothed_prediction(self):
        if len(self.predictions_queue) == 0:
            return None, 0.0
            
        valid_predictions = [p for p in self.predictions_queue if p is not None]
        valid_confidences = [c for c, p in zip(self.confidences_queue, self.predictions_queue) if p is not None]
        
        if len(valid_predictions) < max(1, self.window_size // 2):
            return None, 0.0
            
        prediction_array = np.array(valid_predictions)
        confidence_array = np.array(valid_confidences)
        
        weighted_counts = {}
        for pred, conf in zip(prediction_array, confidence_array):
            if pred not in weighted_counts:
                weighted_counts[pred] = 0
            weighted_counts[pred] += conf
            
        if not weighted_counts:
            return None, 0.0
            
        best_pred = max(weighted_counts, key=weighted_counts.get)
        total_weight = sum(weighted_counts.values())
        avg_confidence = weighted_counts[best_pred] / len(valid_predictions)
        
        return best_pred, avg_confidence
        
    def reset(self):
        self.predictions_queue.clear()
        self.confidences_queue.clear()
        
    def get_history(self):
        return list(self.predictions_queue), list(self.confidences_queue)


class TextAggregator:
    def __init__(self, min_stable_frames=8, cooldown_frames=20):
        self.min_stable_frames = min_stable_frames
        self.cooldown_frames = cooldown_frames
        
        self.current_gesture = None
        self.gesture_counter = 0
        self.cooldown_counter = 0
        self.aggregated_text = ""
        
    def update(self, smoothed_gesture):
        if smoothed_gesture is None:
            self.gesture_counter = 0
            if self.cooldown_counter > 0:
                self.cooldown_counter -= 1
            return None
            
        if self.cooldown_counter > 0:
            self.cooldown_counter -= 1
            return None
            
        if smoothed_gesture == self.current_gesture:
            self.gesture_counter += 1
        else:
            self.current_gesture = smoothed_gesture
            self.gesture_counter = 1
            
        if self.gesture_counter >= self.min_stable_frames:
            self.aggregated_text += smoothed_gesture
            self.cooldown_counter = self.cooldown_frames
            self.gesture_counter = 0
            return smoothed_gesture
                
        return None
        
    def get_text(self):
        return self.aggregated_text
        
    def clear_text(self):
        self.aggregated_text = ""
        self.current_gesture = None
        self.gesture_counter = 0
        self.cooldown_counter = 0
        
    def backspace(self):
        if len(self.aggregated_text) > 0:
            self.aggregated_text = self.aggregated_text[:-1]
            self.cooldown_counter = self.cooldown_frames
