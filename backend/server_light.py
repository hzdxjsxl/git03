import os
import time
import random
import io
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import soundfile as sf


APP_TITLE = "Audio Emotion Recognition API (Light Mode)"
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


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "device": "cpu",
        "emotion_labels": EMOTION_LABELS,
        "mode": "light"
    }


def analyze_audio_features(audio_data):
    rms = np.sqrt(np.mean(audio_data ** 2))
    peak = np.max(np.abs(audio_data))
    zero_crossings = np.sum(np.diff(np.sign(audio_data)) != 0) / len(audio_data)

    if len(audio_data) > 0:
        spectral_centroid = np.mean(np.abs(np.fft.fft(audio_data)[:len(audio_data)//2]))
    else:
        spectral_centroid = 0

    return {
        'rms': rms,
        'peak': peak,
        'zero_crossings': zero_crossings,
        'spectral_centroid': float(spectral_centroid)
    }


def predict_emotion_from_features(features):
    random.seed(int(features['spectral_centroid'] * 10000) % 10000)

    base_probs = [0.33, 0.33, 0.34]

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
    base_probs = np.array(base_probs) + noise

    base_probs = np.clip(base_probs, 0.05, 0.9)
    base_probs = base_probs / np.sum(base_probs)

    return base_probs.tolist()


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

        audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=1)

        features = analyze_audio_features(audio_data)

        probabilities = predict_emotion_from_features(features)

        inference_time = int((time.time() - start_time) * 1000)

        return JSONResponse(content={
            "success": True,
            "probabilities": probabilities,
            "emotion_labels": EMOTION_LABELS,
            "inference_time_ms": inference_time,
            "mode": "light",
            "features": features
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
    print("=" * 50)
    print("  EmoVoice 后端服务 (轻量模式)")
    print("  不依赖 PyTorch，用于快速测试前后端连通性")
    print("=" * 50)
    print("")
    print("服务地址: http://localhost:8000")
    print("API文档:  http://localhost:8000/docs")
    print("健康检查: http://localhost:8000/health")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8000)
