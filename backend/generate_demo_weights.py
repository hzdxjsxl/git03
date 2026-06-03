import os
import sys
import torch

sys.path.insert(0, os.path.dirname(__file__))

from model import EmotionCNN


WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "model_weights")
WEIGHTS_PATH = os.path.join(WEIGHTS_DIR, "emotion_cnn.pt")


def generate_demo_weights():
    os.makedirs(WEIGHTS_DIR, exist_ok=True)

    model = EmotionCNN(num_classes=3)

    torch.manual_seed(42)
    for param in model.parameters():
        if param.requires_grad:
            torch.nn.init.normal_(param, mean=0.0, std=0.1)

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "model_architecture": "EmotionCNN",
        "num_classes": 3,
        "emotion_labels": ["愤怒", "开心", "悲伤"],
        "input_shape": [1, 128, 128],
        "sample_rate": 16000,
        "description": "Demo weights for testing purposes. Not trained on real data.",
        "generated_at": "2024-01-01"
    }

    torch.save(checkpoint, WEIGHTS_PATH)

    file_size = os.path.getsize(WEIGHTS_PATH) / (1024 * 1024)
    print(f"Demo model weights saved to: {WEIGHTS_PATH}")
    print(f"File size: {file_size:.2f} MB")
    print("\nNote: These are random weights for testing the pipeline.")
    print("      For actual emotion recognition, train the model on a labeled dataset.")
    print("      Recommended datasets: RAVDESS, TESS, CREMA-D, SAVEE")


if __name__ == "__main__":
    generate_demo_weights()
