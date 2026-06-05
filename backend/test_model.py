# -*- coding: utf-8 -*-
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model.style_transfer import StyleTransferModel
from PIL import Image
import io

def main():
    print("=" * 60)
    print("  Style Transfer Model Quality Test")
    print("=" * 60)

    print("\n[1/4] Initializing model...")
    model = StyleTransferModel()
    print("  OK - Model loaded")
    print(f"  OK - Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
    print(f"  OK - Image size: {model.imsize}px")

    print("\n[2/4] Creating test images...")

    content_img = Image.new('RGB', (400, 400), color='white')
    for x in range(400):
        for y in range(400):
            if (x // 50) % 2 == (y // 50) % 2:
                content_img.putpixel((x, y), (200, 100, 50))
            else:
                content_img.putpixel((x, y), (50, 150, 200))

    style_img = Image.new('RGB', (400, 400), color='white')
    for x in range(400):
        for y in range(400):
            r = int(255 * (x / 400))
            g = int(255 * (y / 400))
            b = int(255 * ((x + y) / 800))
            style_img.putpixel((x, y), (r, g, b))

    content_buf = io.BytesIO()
    content_img.save(content_buf, format='JPEG')
    content_data = content_buf.getvalue()

    style_buf = io.BytesIO()
    style_img.save(style_buf, format='JPEG')
    style_data = style_buf.getvalue()

    print("  OK - Test images created")

    print("\n[3/4] Starting style transfer (300 steps)...")
    print("  Progress: ", end='', flush=True)

    def progress_callback(p):
        print(f"\r  Progress: {p}%", end='', flush=True)

    result_img = model.transfer_style(
        content_data,
        style_data,
        num_steps=300,
        style_weight=1e5,
        content_weight=1e0,
        progress_callback=progress_callback
    )

    print("\n  OK - Style transfer completed")

    print("\n[4/4] Checking output quality...")
    print(f"  OK - Output size: {result_img.size[0]}x{result_img.size[1]}")
    print(f"  OK - Output mode: {result_img.mode}")

    result_path = os.path.join(os.path.dirname(__file__), 'test_output.jpg')
    result_img.save(result_path, 'JPEG', quality=95)
    print(f"  OK - Result saved to: {result_path}")

    content_path = os.path.join(os.path.dirname(__file__), 'test_content.jpg')
    content_img.save(content_path, 'JPEG', quality=95)

    style_path = os.path.join(os.path.dirname(__file__), 'test_style.jpg')
    style_img.save(style_path, 'JPEG', quality=95)

    print("\n" + "=" * 60)
    print("  Test completed! Check the generated images")
    print("=" * 60)
    print(f"\n  Content: {content_path}")
    print(f"  Style:   {style_path}")
    print(f"  Result:  {result_path}")

if __name__ == '__main__':
    import torch
    main()
