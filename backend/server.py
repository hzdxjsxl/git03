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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

model = None
model_loaded = False


@app.on_event("startup")
async def load_model_on_startup():
    global model, model_loaded
    try:
        print(f"Loading model on {DEVICE}...")
        model = load_model(MODEL_WEIGHTS_PATH, DEVICE)
        model_loaded = True
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        model_loaded = False


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "device": DEVICE,
        "emotion_labels": EMOTION_LABELS
    }


@app.post("/predict")
async def predict_emotion(file: UploadFile = File(...)):
    global model, model_loaded

    if not model_loaded or model is None:
        return JSONResponse(status_code=503, content={
            "success": False,
            "error": "Model not loaded yet, please try again later"
        })

    try:
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
    except Exception as e:
        print(f"Prediction error: {e}")
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": str(e)
        })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
