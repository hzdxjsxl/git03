import math
import json
import numpy as np
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from typing import Dict, Tuple, List

app = Flask(__name__, static_folder='../frontend')
CORS(app)


class HierarchicalInteractionMatrix:
    def __init__(self, base_size: int = 4096, num_levels: int = 6):
        self.base_size = base_size
        self.num_levels = num_levels
        self.matrices: Dict[int, np.ndarray] = {}
        self._build_pyramid()

    def _generate_base_matrix(self) -> np.ndarray:
        x = np.arange(self.base_size, dtype=np.float32)
        y = np.arange(self.base_size, dtype=np.float32)
        xx, yy = np.meshgrid(x, y)
        
        dist = np.abs(xx - yy)
        diag_decay = np.exp(-dist / 500)
        
        hotspot = np.zeros_like(xx)
        hotspot_centers = [
            (500, 520), (800, 830), (1200, 1250), (1800, 1880),
            (2200, 2260), (2800, 2850), (3200, 3240), (3500, 3560)
        ]
        
        for hc in hotspot_centers:
            d1 = np.sqrt((xx - hc[0])**2 + (yy - hc[1])**2)
            d2 = np.sqrt((xx - hc[1])**2 + (yy - hc[0])**2)
            hotspot += 8 * np.exp(-d1 / 80) + 8 * np.exp(-d2 / 80)
        
        matrix = diag_decay * (0.3 + hotspot)
        return matrix.astype(np.float32)

    def _build_pyramid(self):
        base_matrix = self._generate_base_matrix()
        self.matrices[0] = base_matrix
        
        for level in range(1, self.num_levels):
            src = self.matrices[level - 1]
            src_h, src_w = src.shape
            
            downsampled = src.reshape(src_h // 2, 2, src_w // 2, 2).mean(axis=(1, 3))
            self.matrices[level] = downsampled.astype(np.float32)

    def get_tile(self, level: int, x: int, y: int, tile_size: int = 256) -> Dict:
        if level < 0 or level >= self.num_levels:
            return {"error": "Invalid level"}
        
        matrix = self.matrices[level]
        mat_size = matrix.shape[0]
        
        start_x = x * tile_size
        start_y = y * tile_size
        
        if start_x >= mat_size or start_y >= mat_size:
            return {"values": [], "isEmpty": True}
        
        end_x = min(start_x + tile_size, mat_size)
        end_y = min(start_y + tile_size, mat_size)
        
        tile = np.zeros((tile_size, tile_size), dtype=np.float32)
        
        src_slice = matrix[start_y:end_y, start_x:end_x]
        tile[:end_y-start_y, :end_x-start_x] = src_slice
        
        values = []
        for i in range(tile_size):
            row = []
            for j in range(tile_size):
                val = float(tile[i, j])
                if val > 0.01:
                    row.append(round(val, 3))
                else:
                    row.append(0)
            values.append(row)
        
        return {
            "level": level,
            "x": x,
            "y": y,
            "tileSize": tile_size,
            "values": values,
            "isEmpty": False
        }

    def get_info(self) -> Dict:
        return {
            "baseSize": self.base_size,
            "numLevels": self.num_levels,
            "tileSize": 256,
            "maxValue": float(np.max(self.matrices[0])),
            "levels": [
                {
                    "level": l,
                    "size": self.matrices[l].shape[0],
                    "numTiles": math.ceil(self.matrices[l].shape[0] / 256)
                }
                for l in range(self.num_levels)
            ]
        }


_pyramid = HierarchicalInteractionMatrix(base_size=4096, num_levels=6)


@app.route('/api/info')
def get_info():
    return jsonify(_pyramid.get_info())


@app.route('/api/tile/<int:level>/<int:x>/<int:y>')
def get_tile(level: int, x: int, y: int):
    tile = _pyramid.get_tile(level, x, y)
    return jsonify(tile)


@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)


if __name__ == '__main__':
    print("Starting Pyramid Tile Server...")
    print(f"Matrix size: {_pyramid.base_size}x{_pyramid.base_size}")
    print(f"Number of levels: {_pyramid.num_levels}")
    app.run(host='0.0.0.0', port=8765, debug=False)
