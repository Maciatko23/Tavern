"""Cut reference blocks/tiles out of the Winlu green A2 sheet (x1 and x4 zoom) for study and as PixelLab style images."""
import os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
A2 = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Fantasy_Tileset_Green_Edition_upgrade", "tilesets", "Fantasy_Outside_A2_2_green.png")
sheet = Image.open(A2).convert("RGBA")

def block(k):
    c, r = (k - 16) % 8, (k - 16) // 8
    return sheet.crop((c * 96, r * 144, c * 96 + 96, r * 144 + 144))

def on_checker(im):
    bg = Image.new("RGBA", im.size, (255, 0, 255, 255))
    bg.alpha_composite(im)
    return bg

if __name__ == "__main__":
    OUT = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(os.path.join(OUT, "a2_x2.png"))
    for k in (16, 17, 21, 24, 27, 39, 46):
        b = block(k)
        b.save(os.path.join(OUT, "k%d.png" % k))
        on_checker(b).resize((384, 576), Image.NEAREST).save(os.path.join(OUT, "k%d_x4.png" % k))
