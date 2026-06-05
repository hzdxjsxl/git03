import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import io
import random
import math

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

def create_starry_night_style():
    img = Image.new('RGB', (512, 512), color=(10, 20, 60))
    draw = ImageDraw.Draw(img)
    
    for _ in range(200):
        x = random.randint(0, 512)
        y = random.randint(0, 200)
        size = random.randint(1, 5)
        brightness = random.randint(200, 255)
        draw.ellipse([x, y, x+size, y+size], fill=(brightness, brightness, brightness))
    
    for i in range(30):
        x = random.randint(0, 512)
        y = random.randint(150, 400)
        r = random.randint(50, 150)
        for j in range(10):
            angle = j * math.pi / 5
            color = (
                random.randint(100, 200),
                random.randint(100, 180),
                random.randint(200, 255)
            )
            draw.line(
                [x, y, x + r * math.cos(angle), y + r * math.sin(angle)],
                fill=color, width=3
            )
    
    for x in range(512):
        for y in range(350, 512):
            noise = random.randint(-30, 30)
            base_color = (20 + noise, 40 + noise, 30 + noise)
            img.putpixel((x, y), base_color)
    
    return img.filter(ImageFilter.SMOOTH)

def create_water_lilies_style():
    img = Image.new('RGB', (512, 512), color=(50, 100, 80))
    draw = ImageDraw.Draw(img)
    
    for _ in range(1000):
        x = random.randint(0, 512)
        y = random.randint(0, 512)
        color = (
            random.randint(30, 80),
            random.randint(80, 150),
            random.randint(60, 120)
        )
        draw.point((x, y), fill=color)
    
    for _ in range(15):
        x = random.randint(50, 462)
        y = random.randint(200, 462)
        size = random.randint(20, 50)
        color = (
            random.randint(150, 220),
            random.randint(80, 150),
            random.randint(150, 200)
        )
        draw.ellipse([x-size, y-size, x+size, y+size], fill=color)
    
    for _ in range(20):
        x1 = random.randint(0, 512)
        y1 = random.randint(0, 512)
        x2 = x1 + random.randint(-50, 50)
        y2 = y1 + random.randint(-50, 50)
        color = (
            random.randint(40, 90),
            random.randint(120, 180),
            random.randint(80, 140)
        )
        draw.line([x1, y1, x2, y2], fill=color, width=random.randint(2, 6))
    
    return img.filter(ImageFilter.GaussianBlur(radius=1))

def create_ink_landscape_style():
    img = Image.new('L', (512, 512), color=255)
    draw = ImageDraw.Draw(img)
    
    for y in range(200, 300):
        for x in range(512):
            if random.random() < 0.3:
                gray = random.randint(100, 180)
                draw.point((x, y), fill=gray)
    
    draw.polygon([(0, 250), (150, 150), (250, 220), (0, 280)], fill=80)
    draw.polygon([(200, 280), (300, 180), (400, 230), (512, 200), (512, 300), (200, 320)], fill=50)
    draw.polygon([(100, 320), (200, 250), (350, 300), (400, 350), (100, 380)], fill=30)
    
    for _ in range(50):
        x = random.randint(0, 512)
        y = random.randint(100, 400)
        gray = random.randint(50, 150)
        draw.line(
            [x, y, x + random.randint(-30, 30), y + random.randint(10, 50)],
            fill=gray, width=random.randint(1, 3)
        )
    
    for _ in range(100):
        x = random.randint(0, 512)
        y = random.randint(350, 512)
        gray = random.randint(100, 200)
        draw.point((x, y), fill=gray)
    
    img_rgb = ImageOps.colorize(img, black='black', white='white')
    return img_rgb.filter(ImageFilter.SMOOTH)

def create_ink_bamboo_style():
    img = Image.new('L', (512, 512), color=250)
    draw = ImageDraw.Draw(img)
    
    for i in range(4):
        x = 100 + i * 120
        for y in range(512):
            width = 8 + int(math.sin(y / 30) * 3)
            gray = random.randint(20, 60)
            draw.line([x - width, y, x + width, y], fill=gray, width=1)
            if y % 80 == 0 and y > 0:
                draw.line([x - width - 10, y, x + width + 10, y], fill=gray - 10, width=2)
    
    for _ in range(30):
        start_x = random.randint(80, 432)
        start_y = random.randint(50, 450)
        angle = random.choice([-60, -30, 30, 60]) * math.pi / 180
        length = random.randint(30, 80)
        
        end_x = start_x + length * math.cos(angle)
        end_y = start_y + length * math.sin(angle)
        
        gray = random.randint(30, 70)
        draw.line([start_x, start_y, end_x, end_y], fill=gray, width=random.randint(2, 5))
        
        for _ in range(5):
            lx = random.uniform(0, length * 0.8)
            leaf_x = start_x + lx * math.cos(angle)
            leaf_y = start_y + lx * math.sin(angle)
            leaf_angle = angle + random.uniform(-0.5, 0.5)
            leaf_len = random.randint(8, 15)
            draw.line(
                [leaf_x, leaf_y, 
                 leaf_x + leaf_len * math.cos(leaf_angle), 
                 leaf_y + leaf_len * math.sin(leaf_angle)],
                fill=random.randint(40, 80), width=2
            )
    
    for _ in range(500):
        x = random.randint(0, 512)
        y = random.randint(0, 512)
        gray = random.randint(220, 245)
        draw.point((x, y), fill=gray)
    
    img_rgb = ImageOps.colorize(img, black='black', white='white')
    return img_rgb

def create_cubism_style():
    img = Image.new('RGB', (512, 512), color=(180, 160, 140))
    draw = ImageDraw.Draw(img)
    
    colors = [
        (200, 100, 80), (80, 120, 180), (220, 180, 100),
        (100, 180, 120), (150, 80, 160), (60, 60, 80),
        (255, 200, 150), (100, 100, 120)
    ]
    
    for _ in range(40):
        shape_type = random.choice(['triangle', 'polygon'])
        color = random.choice(colors)
        
        if shape_type == 'triangle':
            points = [
                (random.randint(0, 512), random.randint(0, 512)),
                (random.randint(0, 512), random.randint(0, 512)),
                (random.randint(0, 512), random.randint(0, 512))
            ]
        else:
            points = [(random.randint(0, 512), random.randint(0, 512)) for _ in range(random.randint(4, 6))]
        
        draw.polygon(points, fill=color, outline=(50, 50, 50))
    
    for _ in range(20):
        x1 = random.randint(0, 512)
        y1 = random.randint(0, 512)
        x2 = random.randint(0, 512)
        y2 = random.randint(0, 512)
        draw.line([x1, y1, x2, y2], fill=(50, 50, 50), width=2)
    
    return img

def create_pencil_sketch_style():
    img = Image.new('L', (512, 512), color=255)
    draw = ImageDraw.Draw(img)
    
    for _ in range(50):
        y = random.randint(0, 512)
        start_x = random.randint(0, 100)
        length = random.randint(300, 450)
        gray = random.randint(150, 220)
        
        for x in range(start_x, min(start_x + length, 512)):
            if random.random() < 0.7:
                y_offset = random.randint(-2, 2)
                draw.point((x, y + y_offset), fill=gray)
    
    for _ in range(30):
        x = random.randint(0, 512)
        y = random.randint(0, 512)
        radius = random.randint(20, 60)
        gray = random.randint(100, 180)
        
        for i in range(radius * 2):
            for j in range(radius * 2):
                dx = i - radius
                dy = j - radius
                if dx * dx + dy * dy < radius * radius:
                    if random.random() < 0.3:
                        px = x + dx - radius
                        py = y + dy - radius
                        if 0 <= px < 512 and 0 <= py < 512:
                            draw.point((px, py), fill=gray)
    
    for _ in range(100):
        x = random.randint(0, 512)
        y = random.randint(0, 512)
        angle = random.uniform(0, math.pi)
        length = random.randint(10, 40)
        gray = random.randint(80, 160)
        
        for t in range(int(length)):
            px = int(x + t * math.cos(angle))
            py = int(y + t * math.sin(angle))
            if 0 <= px < 512 and 0 <= py < 512 and random.random() < 0.6:
                draw.point((px, py), fill=gray)
    
    img_rgb = ImageOps.colorize(img, black='black', white='white')
    return img_rgb.filter(ImageFilter.EDGE_ENHANCE)

def generate_sample_style_images():
    os.makedirs(STYLES_DIR, exist_ok=True)
    
    style_generators = {
        'oil_painting_van_gogh': create_starry_night_style,
        'oil_painting_monet': create_water_lilies_style,
        'ink_chinese_landscape': create_ink_landscape_style,
        'ink_bamboo': create_ink_bamboo_style,
        'cubism_picasso': create_cubism_style,
        'sketch_pencil': create_pencil_sketch_style
    }
    
    for style_key, style_info in STYLE_PRESETS.items():
        style_path = os.path.join(STYLES_DIR, style_info['file'])
        if not os.path.exists(style_path):
            print(f"Generating: {style_info['name']}...")
            img = style_generators[style_key]()
            img.save(style_path, 'JPEG', quality=95)
            print(f"  Saved: {style_info['file']}")
