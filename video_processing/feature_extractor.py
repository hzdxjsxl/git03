import numpy as np
from config import HAND_CONFIG


class FeatureExtractor:
    def __init__(self):
        self.num_landmarks = HAND_CONFIG['num_landmarks']
        
    def extract_features(self, landmarks):
        if landmarks is None or len(landmarks) == 0:
            return None
            
        landmarks = np.array(landmarks)
        
        palm_base = landmarks[0]
        centered_landmarks = landmarks - palm_base
        
        max_dist = np.max(np.linalg.norm(centered_landmarks, axis=1))
        if max_dist > 0:
            normalized_landmarks = centered_landmarks / max_dist
        else:
            normalized_landmarks = centered_landmarks
        
        features = normalized_landmarks.flatten()
        
        distances = self._compute_distances(normalized_landmarks)
        angles = self._compute_angles(normalized_landmarks)
        
        features = np.concatenate([features, distances, angles])
        
        return features.astype(np.float32)
        
    def _compute_distances(self, landmarks):
        distances = []
        fingertip_indices = [4, 8, 12, 16, 20]
        for i in range(len(fingertip_indices)):
            for j in range(i + 1, len(fingertip_indices)):
                dist = np.linalg.norm(
                    landmarks[fingertip_indices[i]] - landmarks[fingertip_indices[j]]
                )
                distances.append(dist)
        return np.array(distances)
        
    def _compute_angles(self, landmarks):
        angles = []
        finger_joints = [
            [1, 2, 3],
            [5, 6, 7],
            [9, 10, 11],
            [13, 14, 15],
            [17, 18, 19]
        ]
        
        for joints in finger_joints:
            v1 = landmarks[joints[1]] - landmarks[joints[0]]
            v2 = landmarks[joints[2]] - landmarks[joints[1]]
            
            v1_norm = np.linalg.norm(v1)
            v2_norm = np.linalg.norm(v2)
            
            if v1_norm > 0 and v2_norm > 0:
                cos_angle = np.dot(v1, v2) / (v1_norm * v2_norm)
                angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
            else:
                angle = 0.0
            angles.append(angle)
            
        return np.array(angles)
