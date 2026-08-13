"""Generates the PWA icons in public/ and the Android sources in assets/.

    python scripts/make-icons.py
    npx @capacitor/assets generate --android   # turns assets/ into launcher icons
"""
from PIL import Image, ImageDraw
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
ASSETS = os.path.join(ROOT, "assets")
BG = (14, 19, 29, 255)
SPLASH_BG = (9, 12, 18, 255)
FG = (163, 230, 53, 255)

# Dumbbell drawn in a 0..1 box: bar, inner plates, outer plates.
SHAPES = [
    (0.27, 0.46, 0.73, 0.54, 0.04),
    (0.21, 0.35, 0.30, 0.65, 0.04),
    (0.70, 0.35, 0.79, 0.65, 0.04),
    (0.13, 0.41, 0.19, 0.59, 0.03),
    (0.81, 0.41, 0.87, 0.59, 0.03),
]


def draw(size, padding, background, rounded=True, scale=4):
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if background:
        if rounded:
            d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=background)
        else:
            d.rectangle([0, 0, s, s], fill=background)
    inner = s * (1 - padding * 2)
    off = s * padding
    for x0, y0, x1, y1, r in SHAPES:
        d.rounded_rectangle(
            [off + inner * x0, off + inner * y0, off + inner * x1, off + inner * y1],
            radius=int(inner * r),
            fill=FG,
        )
    return img.resize((size, size), Image.LANCZOS)


def splash(size, mark_ratio=0.34):
    img = Image.new("RGBA", (size, size), SPLASH_BG)
    mark = draw(int(size * mark_ratio), 0.0, None, rounded=False, scale=2)
    img.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    return img


os.makedirs(ASSETS, exist_ok=True)

# Web
draw(192, 0.06, BG).save(os.path.join(PUBLIC, "icon-192.png"))
draw(512, 0.06, BG).save(os.path.join(PUBLIC, "icon-512.png"))
draw(512, 0.18, BG, rounded=False).save(os.path.join(PUBLIC, "icon-maskable.png"))

# Android sources, the foreground keeps the safe padding adaptive icons need
draw(1024, 0.10, BG).save(os.path.join(ASSETS, "icon-only.png"))
draw(1024, 0.26, None).save(os.path.join(ASSETS, "icon-foreground.png"))
Image.new("RGBA", (1024, 1024), BG).save(os.path.join(ASSETS, "icon-background.png"))
splash(2732).save(os.path.join(ASSETS, "splash.png"))
splash(2732).save(os.path.join(ASSETS, "splash-dark.png"))

print("icone in", PUBLIC, "e", ASSETS)
