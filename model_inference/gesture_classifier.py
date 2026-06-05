import torch
import torch.nn as nn
import numpy as np
import os
from config import MODEL_CONFIG, GESTURE_MAP


class GestureModel(nn.Module):
    def __init__(self, input_size, num_classes):
        super(GestureModel, self).__init__()
        self.fc1 = nn.Linear(input_size, 256)
        self.bn1 = nn.BatchNorm1d(256)
        self.dropout1 = nn.Dropout(0.3)
        
        self.fc2 = nn.Linear(256, 128)
        self.bn2 = nn.BatchNorm1d(128)
        self.dropout2 = nn.Dropout(0.3)
        
        self.fc3 = nn.Linear(128, 64)
        self.bn3 = nn.BatchNorm1d(64)
        self.dropout3 = nn.Dropout(0.2)
        
        self.fc4 = nn.Linear(64, num_classes)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        x = self.relu(self.bn1(self.fc1(x)))
        x = self.dropout1(x)
        
        x = self.relu(self.bn2(self.fc2(x)))
        x = self.dropout2(x)
        
        x = self.relu(self.bn3(self.fc3(x)))
        x = self.dropout3(x)
        
        x = self.fc4(x)
        return x


class RuleBasedGestureClassifier:
    def __init__(self):
        self.finger_tips = [4, 8, 12, 16, 20]
        self.finger_pips = [3, 6, 10, 14, 18]
        self.finger_mcps = [2, 5, 9, 13, 17]
        
    def _get_finger_states(self, landmarks):
        states = []
        for i in range(5):
            tip = landmarks[self.finger_tips[i]]
            pip = landmarks[self.finger_pips[i]]
            mcp = landmarks[self.finger_mcps[i]]
            
            tip_pip_dist = np.linalg.norm(tip - pip)
            pip_mcp_dist = np.linalg.norm(pip - mcp)
            
            if i == 0:
                thumb_tip = landmarks[4]
                index_mcp = landmarks[5]
                tip_index_dist = np.linalg.norm(thumb_tip - index_mcp)
                is_extended = tip_index_dist > pip_mcp_dist * 1.2
            else:
                is_extended = tip_pip_dist > pip_mcp_dist * 0.8
            
            states.append(is_extended)
        return states
    
    def _get_thumb_touch_state(self, landmarks):
        thumb_tip = landmarks[4]
        touch_states = []
        
        for i in range(1, 5):
            finger_tip = landmarks[self.finger_tips[i]]
            dist = np.linalg.norm(thumb_tip - finger_tip)
            touch_states.append(dist < 0.15)
            
        return touch_states
    
    def classify(self, landmarks):
        fingers = self._get_finger_states(landmarks)
        thumb_touches = self._get_thumb_touch_state(landmarks)
        
        gesture_rules = self._build_gesture_rules()
        
        best_gesture = None
        best_score = 0
        
        for gesture_idx, rule in gesture_rules.items():
            score = self._match_rule(fingers, thumb_touches, rule)
            if score > best_score:
                best_score = score
                best_gesture = gesture_idx
        
        confidence = min(best_score, 1.0)
        
        return best_gesture, confidence
    
    def _match_rule(self, fingers, thumb_touches, rule):
        finger_match = sum(1 for i in range(5) if fingers[i] == rule['fingers'][i])
        base_score = finger_match / 5.0
        
        if finger_match < 4:
            return base_score * 0.5
        
        return base_score
    
    def _build_gesture_rules(self):
        return {
            0: {'name': 'A', 'fingers': [True, False, False, False, False]},
            1: {'name': 'B', 'fingers': [False, True, True, True, True]},
            2: {'name': 'C', 'fingers': [True, True, True, True, True]},
            3: {'name': 'D', 'fingers': [True, True, False, False, False]},
            4: {'name': 'E', 'fingers': [True, False, True, False, False]},
            5: {'name': 'F', 'fingers': [True, False, False, True, False]},
            6: {'name': 'G', 'fingers': [True, False, False, False, True]},
            7: {'name': 'H', 'fingers': [False, True, False, False, False]},
            8: {'name': 'I', 'fingers': [False, False, True, False, False]},
            9: {'name': 'J', 'fingers': [False, False, False, True, False]},
            10: {'name': 'K', 'fingers': [False, False, False, False, True]},
            11: {'name': 'L', 'fingers': [False, True, True, False, False]},
            12: {'name': 'M', 'fingers': [False, True, True, True, False]},
            13: {'name': 'N', 'fingers': [False, True, False, True, False]},
            14: {'name': 'O', 'fingers': [False, True, False, False, True]},
            15: {'name': 'P', 'fingers': [False, False, True, True, False]},
            16: {'name': 'Q', 'fingers': [False, False, True, False, True]},
            17: {'name': 'R', 'fingers': [False, False, False, True, True]},
            18: {'name': 'S', 'fingers': [True, True, False, True, False]},
            19: {'name': 'T', 'fingers': [True, True, False, False, True]},
            20: {'name': 'U', 'fingers': [True, False, True, True, False]},
            21: {'name': 'V', 'fingers': [True, False, True, False, True]},
            22: {'name': 'W', 'fingers': [True, False, False, True, True]},
            23: {'name': 'X', 'fingers': [False, True, True, False, True]},
            24: {'name': 'Y', 'fingers': [False, True, False, True, True]},
            25: {'name': 'Z', 'fingers': [False, False, True, True, True]}
        }


class GestureClassifier:
    def __init__(self, model_path=None, use_demo=True):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.input_size = 126
        self.num_classes = MODEL_CONFIG['num_classes']
        self.confidence_threshold = MODEL_CONFIG['confidence_threshold']
        self.use_demo = use_demo
        
        self.model = GestureModel(self.input_size, self.num_classes).to(self.device)
        self.model.eval()
        
        self.rule_classifier = RuleBasedGestureClassifier()
        
        model_path = model_path or MODEL_CONFIG['model_path']
        if os.path.exists(model_path):
            self.load_model(model_path)
            self.use_demo = False
        else:
            self._init_demo_weights()
            
    def _init_demo_weights(self):
        print("使用演示模式：基于规则的手势分类")
        self.use_demo = True
        
    def load_model(self, model_path):
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
            print(f"Model loaded from {model_path}")
            self.use_demo = False
        except Exception as e:
            print(f"Failed to load model: {e}, using demo mode")
            self._init_demo_weights()
            
    def predict(self, features):
        if features is None:
            return None, 0.0
            
        if self.use_demo:
            landmarks = features[:63].reshape(21, 3)
            class_idx, confidence = self.rule_classifier.classify(landmarks)
            if confidence > self.confidence_threshold:
                return class_idx, confidence
            return None, confidence
            
        features_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(features_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
            confidence = confidence.item()
            predicted_class = predicted.item()
            
            if confidence < self.confidence_threshold:
                return None, confidence
                
            return predicted_class, confidence
            
    def get_gesture_label(self, class_idx):
        return GESTURE_MAP.get(class_idx, None)
        
    def predict_with_confidences(self, features):
        if features is None:
            return None, np.zeros(self.num_classes)
            
        features_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(features_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidences = probabilities.cpu().numpy()[0]
            
            confidence, predicted = torch.max(probabilities, 1)
            confidence = confidence.item()
            predicted_class = predicted.item()
            
            if confidence < self.confidence_threshold:
                return None, confidences
                
            return predicted_class, confidences
