import numpy as np
from config import HAND_CONFIG


class FeatureExtractor:
    def __init__(self):
        self.num_landmarks = HAND_CONFIG['num_landmarks']
        self.fingertip_indices = [4, 8, 12, 16, 20]
        self.finger_pip_indices = [3, 6, 10, 14, 18]
        self.finger_mcp_indices = [2, 5, 9, 13, 17]
        
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
        
        coords_flat = normalized_landmarks.flatten()
        
        fingertip_distances = self._compute_fingertip_distances(normalized_landmarks)
        
        palm_distances = self._compute_palm_distances(normalized_landmarks)
        
        joint_angles = self._compute_joint_angles(normalized_landmarks)
        
        finger_directions = self._compute_finger_directions(normalized_landmarks)
        
        finger_bends = self._compute_finger_bends(normalized_landmarks)
        
        features = np.concatenate([
            coords_flat,
            fingertip_distances,
            palm_distances,
            joint_angles,
            finger_directions,
            finger_bends
        ])
        
        return features.astype(np.float32)
        
    def _compute_fingertip_distances(self, landmarks):
        distances = []
        for i in range(len(self.fingertip_indices)):
            for j in range(i + 1, len(self.fingertip_indices)):
                dist = np.linalg.norm(
                    landmarks[self.fingertip_indices[i]] - landmarks[self.fingertip_indices[j]]
                )
                distances.append(dist)
        return np.array(distances)
        
    def _compute_palm_distances(self, landmarks):
        distances = []
        for tip_idx in self.fingertip_indices:
            dist = np.linalg.norm(landmarks[tip_idx] - landmarks[0])
            distances.append(dist)
        return np.array(distances)
        
    def _compute_joint_angles(self, landmarks):
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
        
    def _compute_finger_directions(self, landmarks):
        directions = []
        for i in range(5):
            tip = landmarks[self.fingertip_indices[i]]
            mcp = landmarks[self.finger_mcp_indices[i]]
            direction = tip - mcp
            norm = np.linalg.norm(direction)
            if norm > 0:
                direction = direction / norm
            directions.extend(direction)
        return np.array(directions)
        
    def _compute_finger_bends(self, landmarks):
        bends = []
        for i in range(5):
            tip = landmarks[self.fingertip_indices[i]]
            pip = landmarks[self.finger_pip_indices[i]]
            mcp = landmarks[self.finger_mcp_indices[i]]
            
            tip_pip_dist = np.linalg.norm(tip - pip)
            pip_mcp_dist = np.linalg.norm(pip - mcp)
            
            if pip_mcp_dist > 0:
                bend_ratio = tip_pip_dist / pip_mcp_dist
            else:
                bend_ratio = 1.0
            bends.append(bend_ratio)
        return np.array(bends)
