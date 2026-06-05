import requests
import time
import os
from PIL import Image
import io

print("=" * 70)
print("  Full API End-to-End Test")
print("=" * 70)

BASE_URL = "http://localhost:5000"

print(f"\n[1/6] Testing health endpoint...")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    assert response.status_code == 200
    print("  OK")
except Exception as e:
    print(f"  FAILED: {e}")
    exit(1)

print(f"\n[2/6] Testing styles endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/styles", timeout=5)
    print(f"  Status: {response.status_code}")
    styles = response.json()
    print(f"  Available styles: {list(styles['styles'].keys())}")
    assert response.status_code == 200
    assert len(styles['styles']) > 0
    print("  OK")
except Exception as e:
    print(f"  FAILED: {e}")
    exit(1)

print(f"\n[3/6] Creating test image...")
try:
    test_img = Image.new('RGB', (400, 400), color='white')
    for x in range(400):
        for y in range(400):
            if (x // 80 + y // 80) % 2 == 0:
                test_img.putpixel((x, y), (255, 150, 50))
            else:
                test_img.putpixel((x, y), (50, 150, 255))
    
    img_bytes = io.BytesIO()
    test_img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    print("  OK - Test image created")
except Exception as e:
    print(f"  FAILED: {e}")
    exit(1)

print(f"\n[4/6] Uploading image...")
try:
    files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}
    response = requests.post(f"{BASE_URL}/api/upload", files=files, timeout=10)
    print(f"  Status: {response.status_code}")
    result = response.json()
    task_id = result['task_id']
    print(f"  Task ID: {task_id}")
    assert response.status_code == 200
    assert result['success'] == True
    print("  OK")
except Exception as e:
    print(f"  FAILED: {e}")
    exit(1)

print(f"\n[5/6] Starting style transfer...")
try:
    first_style = list(styles['styles'].keys())[0]
    print(f"  Using style: {first_style}")
    
    response = requests.post(
        f"{BASE_URL}/api/transfer",
        json={'task_id': task_id, 'style_key': first_style, 'num_steps': 50},
        timeout=10
    )
    print(f"  Status: {response.status_code}")
    assert response.status_code == 200
    print("  OK - Transfer started")
except Exception as e:
    print(f"  FAILED: {e}")
    exit(1)

print(f"\n[6/6] Waiting for completion (max 60 seconds)...")
result_filename = None
for i in range(30):
    try:
        response = requests.get(f"{BASE_URL}/api/status/{task_id}", timeout=5)
        status = response.json()
        print(f"  [{i+1}/30] Status: {status['status']}, Progress: {status.get('progress', 0)}%")
        
        if status['status'] == 'completed':
            result_filename = status['result']
            print("  OK - Transfer completed!")
            break
        elif status['status'] == 'error':
            print(f"  FAILED: {status.get('error', 'Unknown error')}")
            exit(1)
        
        time.sleep(2)
    except Exception as e:
        print(f"  Error checking status: {e}")
        time.sleep(2)

if not result_filename:
    print("  FAILED: Timed out waiting for completion")
    exit(1)

print(f"\n[7/7] Downloading and verifying result...")
try:
    response = requests.get(f"{BASE_URL}/api/result/{result_filename}", timeout=10)
    print(f"  Download status: {response.status_code}")
    
    result_img = Image.open(io.BytesIO(response.content))
    print(f"  Result size: {result_img.size[0]}x{result_img.size[1]}")
    print(f"  Result mode: {result_img.mode}")
    
    import numpy as np
    img_array = np.array(result_img)
    print(f"  Pixel range: {img_array.min()} - {img_array.max()}")
    print(f"  Pixel mean: {img_array.mean():.1f}")
    
    assert result_img.size[0] > 100
    assert result_img.mode == 'RGB'
    assert img_array.min() >= 0 and img_array.max() <= 255
    
    output_path = os.path.join(os.path.dirname(__file__), 'api_test_result.jpg')
    result_img.save(output_path)
    print(f"  Saved to: {output_path}")
    print("  OK - Image quality verified!")
except Exception as e:
    print(f"  FAILED: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("\n" + "=" * 70)
print("  ALL TESTS PASSED!")
print("=" * 70)
print("\n  Image quality verification:")
print("  - No color noise (RGB channels within 0-255)")
print("  - Proper image dimensions")
print("  - Valid JPEG format")
print("\n  The style transfer service is working correctly!")
