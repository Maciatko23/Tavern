"""Obiekty pustelni (pakiet A): img/characters/!$Pustelnia_<Nazwa>.png + podgląd docs/miejsca_wyspy/pustelnia/obiekty.png.

Surowe obrazy (PixelLab) w raw/:
  ule_proflash_1.png   Pro Flash 144x96 (6 generacji), wzór stylu = beczki z Fantasy_Outside_C (Winlu): dwa ule kłodowe z daszkami
                       i słomiany kosz między nimi na niskiej ławie z desek

Poprawki stylu (jak obiekty przystani): najciemniejsze piksele -> ciemny brąz Winlu, lekko mniejsze nasycenie, płaski cień Winlu
(0,0,0,100) w prawo-dół pod spodem. Arkusz "!$" 3 x 4 komórek, komórka = rozmiar obiektu, dół obiektu 2 px nad dołem komórki,
wyśrodkowany w poziomie (zdarzenie stoi na środkowym polu pod obiektem). Wszystkie komórki takie same (bez animacji).
Uruchom: python tools/pustelnia/art/build_objects.py
"""
import colorsys
import os
import shutil

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
CHARS = os.path.join(ROOT, "img", "characters")
BACKUP = os.path.join(ROOT, "backup_art_2026-10-16", "miejsca_wyspy", "A")
PREVIEW = os.path.join(ROOT, "docs", "miejsca_wyspy", "pustelnia", "obiekty.png")
WINLU_DARK, WINLU_OUT2 = (47, 38, 45), (65, 52, 50)

OBJECTS = {
    # name: (raw file, cell w, cell h)
    "Ule": ("ule_proflash_1.png", 144, 96),
}


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def winlu_tone(img, dark=52, sat=0.93):
    img = img.copy()
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            L = lum((r, g, b))
            if L < dark:
                t = L / float(dark)
                px[x, y] = tuple(int(WINLU_DARK[i] + (WINLU_OUT2[i] - WINLU_DARK[i]) * t) for i in range(3)) + (a,)
                continue
            hh, ll, ss = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
            rr, gg, bb = colorsys.hls_to_rgb(hh, ll, ss * sat)
            px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return img


def alpha_clean(img):
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= 128 else 0)
    return img


def ground_shadow(obj, dx=3, dy=2, alpha=100):
    """a flat Winlu shadow: the bottom third of the silhouette pushed right-down, under the object"""
    w, h = obj.size
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    a = obj.getchannel("A")
    bb = obj.getbbox()
    if not bb:
        return obj
    cut = bb[3] - max(4, (bb[3] - bb[1]) // 5)
    mask = Image.new("L", (w, h), 0)
    mask.paste(a.crop((0, cut, w, h)), (dx, cut + dy))
    sh.putalpha(mask.point(lambda v: alpha if v else 0))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.alpha_composite(sh)
    out.alpha_composite(obj)
    return out


def build(name, raw, cw, ch):
    src = alpha_clean(Image.open(os.path.join(RAW, raw)).convert("RGBA"))
    bb = src.getbbox()
    obj = winlu_tone(src.crop(bb))
    cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x0 = (cw - obj.width) // 2
    y0 = ch - 2 - obj.height
    cell.alpha_composite(obj, (x0, y0))
    cell = ground_shadow(cell)
    sheet = Image.new("RGBA", (cw * 3, ch * 4), (0, 0, 0, 0))
    for j in range(4):
        for i in range(3):
            sheet.alpha_composite(cell, (i * cw, j * ch))
    out = os.path.join(CHARS, "!$Pustelnia_%s.png" % name)
    if os.path.exists(out):
        os.makedirs(BACKUP, exist_ok=True)
        shutil.copy2(out, os.path.join(BACKUP, os.path.basename(out)))
    sheet.save(out)
    return out, cell


def main():
    cells = []
    for name, (raw, cw, ch) in OBJECTS.items():
        out, cell = build(name, raw, cw, ch)
        cells.append(cell)
        print("zapisano", os.path.relpath(out, ROOT))
    os.makedirs(os.path.dirname(PREVIEW), exist_ok=True)
    W = sum(c.width for c in cells) * 3 + 20
    H = max(c.height for c in cells) * 3 + 20
    prev = Image.new("RGBA", (W, H), (96, 120, 72, 255))
    x = 10
    for c in cells:
        prev.alpha_composite(c.resize((c.width * 3, c.height * 3), Image.NEAREST), (x, 10))
        x += c.width * 3
    prev.convert("RGB").save(PREVIEW)
    print("podgląd", os.path.relpath(PREVIEW, ROOT))


if __name__ == "__main__":
    main()
