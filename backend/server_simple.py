import os
import time
import random
import io
import struct
import math
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


APP_TITLE = "Audio Emotion Recognition API (Simple Mode)"
APP_VERSION = "1.0.0"

EMOTION_LABELS = ["愤怒", "开心", "悲伤"]

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

model_loaded = True


def read_wav_bytes(wav_bytes):
    riff, size, fformat = struct.unpack('<4sI4s', wav_bytes[:12])

    chunk_offset = 12
    audio_data = None
    sample_rate = 16000
    num_channels = 1
    bits_per_sample = 16

    while chunk_offset < len(wav_bytes):
        chunk_name, chunk_size = struct.unpack('<4sI', wav_bytes[chunk_offset:chunk_offset+8])

        if chunk_name == b'fmt ':
            fmt_data = wav_bytes[chunk_offset+8:chunk_offset+8+chunk_size]
            audio_format, num_channels, sample_rate, byte_rate, block_align, bits_per_sample = struct.unpack('<HHIIHH', fmt_data[:16])
        elif chunk_name == b'data':
            raw_audio = wav_bytes[chunk_offset+8:chunk_offset+8+chunk_size]

            if bits_per_sample == 16:
                num_samples = len(raw_audio) // 2
                audio_data = np.array(struct.unpack('<' + 'h' * num_samples, raw_audio), dtype=np.float32) / 32768.0
            elif bits_per_sample == 32:
                num_samples = len(raw_audio) // 4
                audio_data = np.array(struct.unpack('<' + 'f' * num_samples, raw_audio), dtype=np.float32)

            if num_channels > 1:
                audio_data = audio_data.reshape(-1, num_channels).mean(axis=1)

            break

        chunk_offset += 8 + chunk_size

    if audio_data is None:
        raise ValueError("Could not read WAV file data")

    return audio_data, sample_rate


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "device": "cpu",
        "emotion_labels": EMOTION_LABELS,
        "mode": "simple"
    }


def analyze_audio_features(audio_data):
    if len(audio_data) == 0:
        return {'rms': 0, 'peak': 0, 'zero_crossings': 0, 'spectral_centroid': 0}

    rms = np.sqrt(np.mean(audio_data ** 2))
    peak = np.max(np.abs(audio_data))
    zero_crossings = np.sum(np.diff(np.sign(audio_data)) != 0) / len(audio_data)

    if len(audio_data) > 0:
        fft_vals = np.abs(np.fft.fft(audio_data)[:len(audio_data)//2])
        spectral_centroid = np.mean(fft_vals)
    else:
        spectral_centroid = 0

    return {
        'rms': float(rms),
        'peak': float(peak),
        'zero_crossings': float(zero_crossings),
        'spectral_centroid': float(spectral_centroid)
    }


def predict_emotion_from_features(features):
    random.seed(int(features['spectral_centroid'] * 10000) % 10000)

    base_probs = np.array([0.33, 0.33, 0.34], dtype=np.float32)

    rms = features['rms']
    if rms > 0.3:
        base_probs[0] += 0.2
        base_probs[1] -= 0.1
        base_probs[2] -= 0.1

    zcr = features['zero_crossings']
    if zcr > 0.1:
        base_probs[1] += 0.15
        base_probs[0] -= 0.075
        base_probs[2] -= 0.075

    if features['spectral_centroid'] < 0.1:
        base_probs[2] += 0.15
        base_probs[0] -= 0.075
        base_probs[1] -= 0.075

    noise = np.random.dirichlet([2, 2, 2]) * 0.3
    base_probs = base_probs + noise

    base_probs = np.clip(base_probs, 0.05, 0.9)
    base_probs = base_probs / np.sum(base_probs)

    return [float(p) for p in base_probs]


@app.post("/predict")
async def predict_emotion(file: UploadFile = File(...)):
    global model_loaded

    if not model_loaded:
        return JSONResponse(status_code=503, content={
            "success": False,
            "error": "Model not loaded yet, please try again later"
        })

    try:
        start_time = time.time()

        audio_bytes = await file.read()

        audio_data, sample_rate = read_wav_bytes(audio_bytes)

        features = analyze_audio_features(audio_data)

        probabilities = predict_emotion_from_features(features)

        inference_time = int((time.time() - start_time) * 1000)

        return JSONResponse(content={
            "success": True,
            "probabilities": probabilities,
            "emotion_labels": EMOTION_LABELS,
            "inference_time_ms": inference_time,
            "mode": "simple"
        })
    except Exception as e:
        print(f"Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": str(e)
        })


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  EmoVoice 后端服务 (极简模式)")
    print("  仅使用 Python 标准库 + numpy，无外部依赖")
    print("  用于快速测试前后端连通性")
    print("=" * 60)
    print("")
    print("服务地址: http://localhost:8000")
    print("API文档:  http://localhost:8000/docs")
    print("健康检查: http://localhost:8000/health")
    print("")
    print("注意: 此模式使用简单规则模拟情绪识别")
    print("      安装 PyTorch + librosa 后使用 server.py 获得真实模型能力")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8000)
