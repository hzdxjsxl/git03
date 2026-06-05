import numpy as np
import os
from config import MODEL_CONFIG, GESTURE_MAP


class SimpleNeuralNetwork:
    def __init__(self, input_size, hidden_sizes, output_size):
        self.input_size = input_size
        self.hidden_sizes = hidden_sizes
        self.output_size = output_size
        
        self.weights = []
        self.biases = []
        
        prev_size = input_size
        for hidden_size in hidden_sizes:
            self.weights.append(np.random.randn(prev_size, hidden_size) * 0.01)
            self.biases.append(np.zeros((1, hidden_size)))
            prev_size = hidden_size
            
        self.weights.append(np.random.randn(prev_size, output_size) * 0.01)
        self.biases.append(np.zeros((1, output_size)))
        
    def relu(self, x):
        return np.maximum(0, x)
    
    def softmax(self, x):
        exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        return exp_x / np.sum(exp_x, axis=1, keepdims=True)
    
    def forward(self, x):
        x = x.reshape(1, -1)
        
        for i in range(len(self.weights) - 1):
            x = self.relu(np.dot(x, self.weights[i]) + self.biases[i])
        
        x = np.dot(x, self.weights[-1]) + self.biases[-1]
        return self.softmax(x)
    
    def save_weights(self, path):
        data = {
            'weights': self.weights,
            'biases': self.biases
        }
        np.save(path, data)
    
    def load_weights(self, path):
        data = np.load(path, allow_pickle=True).item()
        self.weights = data['weights']
        self.biases = data['biases']


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
    
    def classify(self, landmarks):
        fingers = self._get_finger_states(landmarks)
        
        gesture_rules = self._build_gesture_rules()
        
        best_gesture = None
        best_score = 0
        
        for gesture_idx, rule in gesture_rules.items():
            score = self._match_rule(fingers, rule)
            if score > best_score:
                best_score = score
                best_gesture = gesture_idx
        
        confidence = min(best_score, 1.0)
        
        return best_gesture, confidence
    
    def _match_rule(self, fingers, rule):
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
    def __init__(self, model_path=None):
        self.input_size = 126
        self.num_classes = MODEL_CONFIG['num_classes']
        self.confidence_threshold = MODEL_CONFIG['confidence_threshold']
        
        self.rule_classifier = RuleBasedGestureClassifier()
        
        self.nn_model = SimpleNeuralNetwork(
            input_size=self.input_size,
            hidden_sizes=[256, 128, 64],
            output_size=self.num_classes
        )
        
        model_path = model_path or MODEL_CONFIG['model_path']
        self.use_nn = False
        if os.path.exists(model_path):
            try:
                self.load_nn_model(model_path)
                self.use_nn = True
                print(f"模型加载成功: {model_path}")
            except Exception as e:
                print(f"模型加载失败，使用规则分类器: {e}")
                self.use_nn = False
        else:
            print("使用基于规则的演示分类器")
            
    def load_nn_model(self, model_path):
        self.nn_model.load_weights(model_path)
        self.use_nn = True
            
    def predict(self, features):
        if features is None:
            return None, 0.0
            
        if self.use_nn:
            probabilities = self.nn_model.forward(features)
            predicted_class = np.argmax(probabilities, axis=1)[0]
            confidence = probabilities[0, predicted_class]
            
            if confidence < self.confidence_threshold:
                return None, confidence
                
            return predicted_class, confidence
        else:
            landmarks = features[:63].reshape(21, 3)
            class_idx, confidence = self.rule_classifier.classify(landmarks)
            if confidence > self.confidence_threshold:
                return class_idx, confidence
            return None, confidence
            
    def get_gesture_label(self, class_idx):
        return GESTURE_MAP.get(class_idx, None)
        
    def predict_with_confidences(self, features):
        if features is None:
            return None, np.zeros(self.num_classes)
            
        if self.use_nn:
            confidences = self.nn_model.forward(features)[0]
            predicted_class = np.argmax(confidences)
            confidence = confidences[predicted_class]
            
            if confidence < self.confidence_threshold:
                return None, confidences
                
            return predicted_class, confidences
        else:
            landmarks = features[:63].reshape(21, 3)
            class_idx, confidence = self.rule_classifier.classify(landmarks)
            
            confidences = np.zeros(self.num_classes)
            if class_idx is not None:
                confidences[class_idx] = confidence
            
            if confidence > self.confidence_threshold:
                return class_idx, confidences
            return None, confidences
