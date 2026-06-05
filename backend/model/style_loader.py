import os
from PIL import Image
import io

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLES_DIR = os.path.join(BASE_DIR, 'styles')

STYLE_PRESETS = {
    'oil_painting_van_gogh': {
        'name': '梵高星空',
        'category': 'oil_painting',
        'file': 'starry_night.jpg',
        'description': '梵高经典油画风格'
    },
    'oil_painting_monet': {
        'name': '莫奈睡莲',
        'category': 'oil_painting',
        'file': 'water_lilies.jpg',
        'description': '印象派油画风格'
    },
    'ink_chinese_landscape': {
        'name': '水墨山水',
        'category': 'ink_painting',
        'file': 'ink_landscape.jpg',
        'description': '中国传统水墨画风格'
    },
    'ink_bamboo': {
        'name': '墨竹图',
        'category': 'ink_painting',
        'file': 'ink_bamboo.jpg',
        'description': '中国墨竹画风格'
    },
    'cubism_picasso': {
        'name': '毕加索立体派',
        'category': 'abstract',
        'file': 'cubism.jpg',
        'description': '立体派抽象风格'
    },
    'sketch_pencil': {
        'name': '铅笔素描',
        'category': 'sketch',
        'file': 'pencil_sketch.jpg',
        'description': '铅笔素描效果'
    }
}

def get_style_list():
    return STYLE_PRESETS

def get_style_image(style_key):
    if style_key not in STYLE_PRESETS:
        return None
    
    style_info = STYLE_PRESETS[style_key]
    style_path = os.path.join(STYLES_DIR, style_info['file'])
    
    if os.path.exists(style_path):
        with open(style_path, 'rb') as f:
            return f.read()
    return None

def generate_sample_style_images():
    os.makedirs(STYLES_DIR, exist_ok=True)
    
    for style_key, style_info in STYLE_PRESETS.items():
        style_path = os.path.join(STYLES_DIR, style_info['file'])
        if not os.path.exists(style_path):
            img = Image.new('RGB', (512, 512), color='white')
            img.save(style_path)
            print(f"Generated placeholder: {style_info['file']}")
