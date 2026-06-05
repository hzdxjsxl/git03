import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model.style_transfer import StyleTransferModel
from model.style_loader import STYLE_PRESETS, get_style_image
from PIL import Image
import io
import numpy as np

print("=" * 80)
print("  Style Difference Verification Test")
print("=" * 80)

print("\n[1/4] Initializing model...")
model = StyleTransferModel()
print(f"  OK - Image size: {model.imsize}px")

print("\n[2/4] Creating test content image...")
content_img = Image.new('RGB', (400, 400), color='white')
for x in range(400):
    for y in range(400):
        if (x // 50) % 2 == (y // 50) % 2:
            content_img.putpixel((x, y), (255, 200, 100))
        else:
            content_img.putpixel((x, y), (100, 150, 255))

content_buf = io.BytesIO()
content_img.save(content_buf, format='JPEG')
content_data = content_buf.getvalue()
print("  OK - Content image created")

print("\n[3/4] Testing different styles (100 steps each for speed)...")
style_keys = ['ink_chinese_landscape', 'sketch_pencil', 'oil_painting_van_gogh']
results = {}

for style_key in style_keys:
    style_name = STYLE_PRESETS[style_key]['name']
    print(f"\n  Processing: {style_name}...")
    
    style_data = get_style_image(style_key)
    
    def progress_cb(p):
        if p % 25 == 0:
            print(f"    Progress: {p}%")
    
    result_img = model.transfer_style(
        content_data,
        style_data,
        num_steps=100,
        style_weight=1e8,
        content_weight=5e0,
        progress_callback=progress_cb
    )
    
    results[style_key] = {
        'name': style_name,
        'image': result_img,
        'array': np.array(result_img)
    }
    
    output_path = os.path.join(os.path.dirname(__file__), f'test_{style_key}.jpg')
    result_img.save(output_path)
    print(f"    OK - Saved to {output_path}")

print("\n[4/4] Analyzing style differences...")
print("\n  Image Statistics:")
for style_key, info in results.items():
    arr = info['array']
    print(f"\n  {info['name']}:")
    print(f"    Size: {info['image'].size[0]}x{info['image'].size[1]}")
    print(f"    Mean RGB: ({arr[:,:,0].mean():.1f}, {arr[:,:,1].mean():.1f}, {arr[:,:,2].mean():.1f})")
    print(f"    Std RGB:  ({arr[:,:,0].std():.1f}, {arr[:,:,1].std():.1f}, {arr[:,:,2].std():.1f})")

print("\n" + "=" * 80)
print("  Style Difference Analysis:")
print("=" * 80)

ink_arr = results['ink_chinese_landscape']['array']
sketch_arr = results['sketch_pencil']['array']
oil_arr = results['oil_painting_van_gogh']['array']

diff_ink_sketch = np.abs(ink_arr.mean() - sketch_arr.mean())
diff_ink_oil = np.abs(ink_arr.mean() - oil_arr.mean())
diff_sketch_oil = np.abs(sketch_arr.mean() - oil_arr.mean())

print(f"\n  Average brightness difference:")
print(f"    Ink vs Sketch: {diff_ink_sketch:.1f} (should be significant)")
print(f"    Ink vs Oil:    {diff_ink_oil:.1f} (should be significant)")
print(f"    Sketch vs Oil: {diff_sketch_oil:.1f} (should be significant)")

ink_gray = ink_arr[:,:,0] * 0.299 + ink_arr[:,:,1] * 0.587 + ink_arr[:,:,2] * 0.114
oil_gray = oil_arr[:,:,0] * 0.299 + oil_arr[:,:,1] * 0.587 + oil_arr[:,:,2] * 0.114

ink_saturation = np.abs(ink_arr[:,:,0] - ink_arr[:,:,1]).mean() + \
                 np.abs(ink_arr[:,:,1] - ink_arr[:,:,2]).mean() + \
                 np.abs(ink_arr[:,:,0] - ink_arr[:,:,2]).mean()

oil_saturation = np.abs(oil_arr[:,:,0] - oil_arr[:,:,1]).mean() + \
                 np.abs(oil_arr[:,:,1] - oil_arr[:,:,2]).mean() + \
                 np.abs(oil_arr[:,:,0] - oil_arr[:,:,2]).mean()

print(f"\n  Color saturation (higher = more colorful):")
print(f"    Ink painting: {ink_saturation:.1f} (should be LOW - grayscale)")
print(f"    Oil painting: {oil_saturation:.1f} (should be HIGH - colorful)")

all_different = (diff_ink_sketch > 10 and diff_ink_oil > 10 and diff_sketch_oil > 10)
ink_less_colorful = ink_saturation < oil_saturation * 0.7

print("\n" + "=" * 80)
if all_different and ink_less_colorful:
    print("  ✅ ALL TESTS PASSED!")
    print("  - Different styles produce significantly different results")
    print("  - Ink painting is less colorful than oil painting (as expected)")
else:
    print("  ⚠️  Some tests need attention")
    print("  - Check if style images have distinct characteristics")
    print("  - Consider increasing style_weight further")
print("=" * 80)
