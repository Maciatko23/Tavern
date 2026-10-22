# Wycinki istniejących grafik gry jako obrazy stylu (style_image) dla PixelLab create_image_pro_flash:
# paleta <= 32 kolory, przycięte do treści, mniejsze niż płótno docelowe. Wynik: art/ref/<nazwa>.png
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))
OUT = os.path.join(HERE, "ref")


def cell(path, r=0, c=0, cols=3, rows=4):
    im = Image.open(os.path.join(GAME, path)).convert("RGBA")
    cw, ch = im.width // cols, im.height // rows
    x = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
    return x.crop(x.getbbox())


def fit(im, w, h):
    # za duze: przyciete (dol-srodek zostaje), nie skalowane - siatka pikseli musi zostac 1:1
    if im.width > w:
        x0 = (im.width - w) // 2
        im = im.crop((x0, 0, x0 + w, im.height))
    if im.height > h:
        im = im.crop((0, im.height - h, im.width, im.height))
    return im


def quant(im, n=32):
    a = im.getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    rgb = Image.new("RGB", im.size, (0, 0, 0))
    rgb.paste(im.convert("RGB"), mask=a)
    q = rgb.quantize(n, method=Image.MEDIANCUT).convert("RGBA")
    q.putalpha(a)
    return q


REFS = {
    "tent": (lambda: cell("img/characters/!$Mt_Tent.png"), 140, 92),
    "cave": (lambda: cell("img/characters/!$Mt_Cave.png"), 92, 92),
    "logs": (lambda: cell("img/characters/!$Logs_Big.png"), 92, 92),
    "ule": (lambda: cell("img/characters/!$Pustelnia_Ule.png"), 136, 92),
    "dyby": (lambda: cell("img/characters/!$Garnizon_Dyby.png"), 64, 60),
    "lodz": (lambda: cell("img/characters/!$Przystan_Lodz_Mala.png"), 136, 92),
    "deer": (lambda: cell("img/characters/$Animal_Deer.png", r=2, c=1), 60, 60),
    "chest": (lambda: Image.open(os.path.join(GAME, "img/system/Farm_ChestL.png")).convert("RGBA"), 96, 64),
    "chest_s": (lambda: Image.open(os.path.join(GAME, "img/system/Farm_ChestS.png")).convert("RGBA"), 44, 44),
    "workbench": (lambda: Image.open(os.path.join(GAME, "img/system/Farm_Workbench.png")).convert("RGBA"), 92, 60),
    "mushroom": (lambda: Image.open(os.path.join(GAME, "img/system/Gather_Mushroom_0.png")).convert("RGBA"), 44, 44),
    "bench": (lambda: Image.open(os.path.join(GAME, "img/system/Farm_Bench.png")).convert("RGBA"), 48, 48),
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k, (f, w, h) in REFS.items():
        im = quant(fit(f(), w, h))
        p = os.path.join(OUT, k + ".png")
        im.save(p, optimize=True)
        print(k, im.size, os.path.getsize(p), "B")
