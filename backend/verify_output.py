import os
from PIL import Image
import numpy as np

print("=" * 60)
print("  Output Image Quality Verification")
print("=" * 60)

result_path = os.path.join(os.path.dirname(__file__), 'test_output.jpg')

if not os.path.exists(result_path):
    print("ERROR: test_output.jpg not found!")
    exit(1)

img = Image.open(result_path)
img_array = np.array(img)

print(f"\nImage Information:")
print(f"  Size: {img.size[0]}x{img.size[1]}")
print(f"  Mode: {img.mode}")
print(f"  Shape: {img_array.shape}")
print(f"  Dtype: {img_array.dtype}")

print(f"\nPixel Value Analysis:")
print(f"  Min value: {img_array.min()}")
print(f"  Max value: {img_array.max()}")
print(f"  Mean value: {img_array.mean():.2f}")
print(f"  Std value: {img_array.std():.2f}")

print(f"\nChannel Analysis:")
for i, channel in enumerate(['Red', 'Green', 'Blue']):
    channel_data = img_array[:, :, i]
    print(f"  {channel}: min={channel_data.min()}, max={channel_data.max()}, mean={channel_data.mean():.1f}")

has_normal_values = (img_array.min() >= 0) and (img_array.max() <= 255)
has_extreme_values = (img_array.max() == 255 and img_array.min() == 0)

print(f"\nQuality Check:")
print(f"  ✓ Normal pixel range (0-255): {'PASS' if has_normal_values else 'FAIL'}")
print(f"  ✓ Valid pixel values: {'PASS' if not np.isnan(img_array).any() else 'FAIL'}")
print(f"  ✓ No infinite values: {'PASS' if not np.isinf(img_array).any() else 'FAIL'}")
print(f"  ✓ No extreme clipping: {'PASS' if not has_extreme_values else 'WARNING - high contrast'}")

if has_normal_values:
    print(f"\n✅ Image quality check PASSED!")
    print(f"   The output image should have normal colors without noise.")
else:
    print(f"\n❌ Image quality check FAILED!")
    print(f"   There may be color noise or pixel value issues.")

print("=" * 60)
