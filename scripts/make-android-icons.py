"""Writes launcher icons and splash screens into the Android project.

    python scripts/make-android-icons.py

Run it after scripts/make-icons.py, it reuses the same dumbbell mark.
"""
from PIL import Image, ImageDraw
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
BG = (14, 19, 29, 255)
SPLASH_BG = (9, 12, 18, 255)
FG = (163, 230, 53, 255)

SHAPES = [
    (0.27, 0.46, 0.73, 0.54, 0.04),
    (0.21, 0.35, 0.30, 0.65, 0.04),
    (0.70, 0.35, 0.79, 0.65, 0.04),
    (0.13, 0.41, 0.19, 0.59, 0.03),
    (0.81, 0.41, 0.87, 0.59, 0.03),
]

DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
LAUNCHER = dict(zip(DENSITIES, [48, 72, 96, 144, 192]))
FOREGROUND = dict(zip(DENSITIES, [108, 162, 216, 324, 432]))
PORTRAIT = dict(zip(DENSITIES, [(320, 480), (480, 800), (720, 1280), (960, 1600), (1280, 1920)]))


def mark(size, padding, scale=4):
    """The dumbbell alone, transparent background."""
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    inner = s * (1 - padding * 2)
    off = s * padding
    for x0, y0, x1, y1, r in SHAPES:
        d.rounded_rectangle(
            [off + inner * x0, off + inner * y0, off + inner * x1, off + inner * y1],
            radius=max(1, int(inner * r)),
            fill=FG,
        )
    return img.resize((size, size), Image.LANCZOS)


def launcher(size, round_icon=False):
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if round_icon:
        d.ellipse([0, 0, s - 1, s - 1], fill=BG)
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    glyph = mark(s, 0.14, scale=1)
    img.alpha_composite(glyph)
    return img.resize((size, size), Image.LANCZOS)


def splash(width, height):
    img = Image.new("RGBA", (width, height), SPLASH_BG)
    side = int(min(width, height) * 0.34)
    glyph = mark(side, 0.0)
    img.paste(glyph, ((width - side) // 2, (height - side) // 2), glyph)
    return img


def save(img, *parts):
    path = os.path.join(RES, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)


for density in DENSITIES:
    save(launcher(LAUNCHER[density]), f"mipmap-{density}", "ic_launcher.png")
    save(launcher(LAUNCHER[density], round_icon=True), f"mipmap-{density}", "ic_launcher_round.png")
    # Adaptive icons crop 33%, so the foreground keeps the mark small and centred.
    save(mark(FOREGROUND[density], 0.30), f"mipmap-{density}", "ic_launcher_foreground.png")
    w, h = PORTRAIT[density]
    save(splash(w, h), f"drawable-port-{density}", "splash.png")
    save(splash(h, w), f"drawable-land-{density}", "splash.png")

save(splash(1280, 1920), "drawable", "splash.png")

with open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0E131D</color>\n</resources>\n')

print("icone Android scritte in", RES)
