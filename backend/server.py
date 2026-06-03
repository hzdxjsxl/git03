import os
import time
import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model import load_model, predict
from preprocess import process_audio_bytes


APP_TITLE = "Audio Emotion Recognition API"
APP_VERSION = "1.0.0"

MODEL_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "model_weights", "emotion_cnn.pt")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
EMOTION_LABELS = ["愤怒", "开心", "悲伤"]

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model(MODEL_WEIGHTS_PATH, DEVICE)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": True,
        "device": DEVICE,
        "emotion_labels": EMOTION_LABELS
    }


@app.post("/predict")
async def predict_emotion(file: UploadFile = File(...)):
    start_time = time.time()

    audio_bytes = await file.read()

    mel_spectrogram = process_audio_bytes(audio_bytes)

    probabilities = predict(model, mel_spectrogram, DEVICE)

    inference_time = int((time.time() - start_time) * 1000)

    return JSONResponse(content={
        "success": True,
        "probabilities": probabilities,
        "emotion_labels": EMOTION_LABELS,
        "inference_time_ms": inference_time
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
