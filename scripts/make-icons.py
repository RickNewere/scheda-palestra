"""Generates the PWA icons from the same shapes used in public/icon.svg."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
BG = (14, 19, 29, 255)
FG = (163, 230, 53, 255)


def draw_icon(size: int, padding: float, rounded: bool) -> Image.Image:
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, s, s], fill=BG)

    inner = s * (1 - padding * 2)
    off = s * padding

    def box(x0, y0, x1, y1, r):
        d.rounded_rectangle(
            [off + inner * x0, off + inner * y0, off + inner * x1, off + inner * y1],
            radius=int(inner * r),
            fill=FG,
        )

    box(0.27, 0.46, 0.73, 0.54, 0.04)
    box(0.21, 0.35, 0.30, 0.65, 0.04)
    box(0.70, 0.35, 0.79, 0.65, 0.04)
    box(0.13, 0.41, 0.19, 0.59, 0.03)
    box(0.81, 0.41, 0.87, 0.59, 0.03)

    return img.resize((size, size), Image.LANCZOS)


draw_icon(192, 0.06, True).save(os.path.join(OUT, "icon-192.png"))
draw_icon(512, 0.06, True).save(os.path.join(OUT, "icon-512.png"))
draw_icon(512, 0.18, False).save(os.path.join(OUT, "icon-maskable.png"))
print("icone generate in", OUT)
