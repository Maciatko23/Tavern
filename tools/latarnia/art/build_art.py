# python tools/latarnia/art/build_art.py
# Grafiki pakietu C „Przylądek z latarnią” (docs/miejsca_wyspy/PAKIETY.md) z surowych obrazków PixelLab w tools/latarnia/art/raw/
# i z rysunków w kodzie (0 generacji):
#   img/characters/!$Latarnia_Wieza.png    wieża latarni (PixelLab Pro Flash 144x256, styl kamiennej cegielni z gry, prosto z przodu,
#                                          cienki piksel) jako arkusz "!$" 3x4 tych samych klatek; stopa przesunięta na dół komórki
#   img/system/Latarnia_Szyby.png          maska szyb laterny (te same piksele co szkło wieży, ciepły bursztyn) - nocą świecą od ognia
#   img/pictures/Latarnia_Wizja_1..3.png   plansze wizji (PixelLab Pro Flash 256x256 w stylu plansz prologu, x2 bez wygładzania) z miękkim
#                                          okrągłym brzegiem - wizja widziana „przez soczewkę” na białym ekranie
#   img/characters/!$Latarnia_Soczewka.png soczewka w mosiężnym pierścieniu na stojaku (rysunek w kodzie): wiersz 1 cała (połysk w 3
#                                          klatkach), wiersz 2 pęknięta, wiersz 3 pusty pierścień (skradziona / zabrana), wiersz 4 jak 1
#   tools/latarnia/art/icons/tran_177.png  ikona 32x32 przedmiotu 177 „Tran” (butelka z bursztynowym tranem) - do IconSet przy integracji
#   tools/latarnia/art/art.json            miary dla Latarnia.js: ogień (px od środka stopy), szyby
import os, json, math
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
CHARS = os.path.join(ROOT, "img", "characters")
SYSTEM = os.path.join(ROOT, "img", "system")
PICS = os.path.join(ROOT, "img", "pictures")
ICONS = os.path.join(HERE, "icons")
OUTLINE = (24, 18, 16, 255)


def sheet_of(cell, cols=3, rows=4, frames=None):
    """an "!$" sheet: 3 patterns x 4 directions of one cell (or of frames[row][col])"""
    w, h = (cell or frames[0][0]).size
    out = Image.new("RGBA", (w * cols, h * rows), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            out.alpha_composite(frames[r][c] if frames else cell, (c * w, r * h))
    return out


# ---------------------------------------------------------------------------------------------------------------- the tower
def tower():
    im = Image.open(os.path.join(RAW, "wieza_1.png")).convert("RGBA")
    W, H = im.size
    box = im.getbbox()
    drop = (H - 3) - box[3]            # the foot 3 px above the cell's bottom (it stands on the tile, not over it)
    cell = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cell.alpha_composite(im, (0, drop))
    sheet_of(cell).save(os.path.join(CHARS, "!$Latarnia_Wieza.png"))
    # the fire basket (measured on the raw picture: rim at y 68, x 67..81) and the glass of the lantern room
    fire = {"x": 74 - W // 2, "y": H - (68 + drop)}
    glass = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px, gp = cell.load(), glass.load()
    n = 0
    for y in range(52 + drop, 86 + drop):
        for x in range(46, 104):
            r, g, b, a = px[x, y]
            if a > 200 and b > 120 and b >= r + 6 and (r + g + b) > 330:   # (the pale blue-grey panes)
                k = min(1.0, ((r + g + b) - 330) / 300.0 + 0.45)
                gp[x, y] = (255, int(186 + 40 * k), int(96 + 50 * k), int(255 * k))
                n += 1
    glass.save(os.path.join(SYSTEM, "Latarnia_Szyby.png"))
    return {"cell": [W, H], "fire": fire, "glassPixels": n, "foot": H - 3}


# ---------------------------------------------------------------------------------------------------------------- the visions
def scarf_flowers(im):
    """vision 3: the mother's scarf has red flowers (W10: "chusta w czerwone kwiaty") - tiny muted red crosses on the beige cloth"""
    px = im.load()
    def cloth(x, y):
        r, g, b, a = px[x, y]
        if (x - 80) ** 2 / 17.0 ** 2 + (y - 125) ** 2 / 21.0 ** 2 < 1: return False      # (not on her face)
        return a > 200 and r > 140 and 12 < r - b < 46 and g > 118                        # (the beige cloth, not the skin)
    k = 0
    for y in range(96, 232, 6):
        for x in range(24 + (y // 6 % 2) * 3, 120, 7):
            if not all(cloth(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)): continue
            for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)): px[x + dx, y + dy] = (176, 74, 66, 255)
            px[x, y] = (128, 46, 42, 255)
            k += 1
    return k


def visions():
    out = []
    for n in (1, 2, 3):
        im = Image.open(os.path.join(RAW, "wizja%d_1.png" % n)).convert("RGBA")
        if n == 3: scarf_flowers(im)
        im = im.resize((512, 512), Image.NEAREST)
        px = im.load()
        R = 256.0
        for y in range(512):
            for x in range(512):
                d = math.hypot(x + 0.5 - 256, y + 0.5 - 256) / R
                t = 1.0 if d < 0.72 else max(0.0, 1.0 - (d - 0.72) / 0.28)
                t = t * t * (3 - 2 * t)
                r, g, b, a = px[x, y]
                # (towards the edge into the white mist: lighter and see-through)
                m = 1 - t
                px[x, y] = (int(r + (246 - r) * m * 0.6), int(g + (248 - g) * m * 0.6), int(b + (252 - b) * m * 0.6), int(a * t))
        p = os.path.join(PICS, "Latarnia_Wizja_%d.png" % n)
        im.save(p)
        out.append(os.path.basename(p))
    return out


# ---------------------------------------------------------------------------------------------------------------- the lens
BRASS = [(92, 58, 24), (150, 104, 44), (204, 158, 72), (240, 210, 130)]
GLASS = [(150, 182, 196), (186, 214, 224), (218, 236, 242), (248, 252, 252)]


def lens_cell(state, shine):
    W, H = 48, 64
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy, R, r = 24, 22, 16, 12
    # the stand: a post and a three-footed base (brass, outlined)
    d.rectangle([22, 37, 26, 57], fill=OUTLINE)
    d.rectangle([23, 38, 25, 56], fill=BRASS[1])
    d.line([(23, 38), (23, 56)], fill=BRASS[2])
    d.polygon([(10, 61), (16, 55), (32, 55), (38, 61)], fill=OUTLINE)
    d.polygon([(12, 60), (17, 56), (31, 56), (36, 60)], fill=BRASS[1])
    d.line([(17, 56), (31, 56)], fill=BRASS[3])
    d.line([(12, 60), (36, 60)], fill=BRASS[0])
    # the ring and its yoke
    d.ellipse([cx - R - 1, cy - R - 1, cx + R + 1, cy + R + 1], fill=OUTLINE)
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=BRASS[1])
    d.arc([cx - R, cy - R, cx + R, cy + R], 150, 300, fill=BRASS[3])
    d.arc([cx - R, cy - R, cx + R, cy + R], -30, 120, fill=BRASS[0])
    d.ellipse([cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1], fill=OUTLINE)
    for k in (-1, 1):   # (the two pins of the yoke)
        d.rectangle([cx + k * (R + 1) - 1, cy - 1, cx + k * (R + 1) + 1, cy + 1], fill=OUTLINE)
        d.point((cx + k * (R + 1), cy), fill=BRASS[2])
    if state == "empty":
        im.putpixel((cx, cy), (0, 0, 0, 0))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 0, 0, 0))
        return im
    # the glass: a soft round gradient, lighter to the upper left
    px = im.load()
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            dd = math.hypot(x - cx, y - cy)
            if dd > r + 0.3: continue
            u = (dd / r) * 0.6 + (((x - cx) + (y - cy)) / (2 * r) + 0.5) * 0.4
            i = 3 if u < 0.22 else 2 if u < 0.5 else 1 if u < 0.8 else 0
            px[x, y] = GLASS[i] + (236,)
    # the moving shine (3 frames)
    sx = [-6, -3, 0][shine]
    for t in range(-3, 4):
        x, y = cx + sx + t, cy - 6 + t
        if math.hypot(x - cx, y - cy) < r - 1: px[x, y] = (255, 255, 255, 255)
    if state == "cracked":
        crack = [(cx - 9, cy - 6), (cx - 3, cy - 1), (cx - 5, cy + 5), (cx + 2, cy + 2), (cx + 8, cy + 8)]
        d.line(crack, fill=(70, 84, 94, 255))
        d.line([(cx - 3, cy - 1), (cx + 4, cy - 8)], fill=(70, 84, 94, 255))
        d.line([(cx + 2, cy + 2), (cx + 1, cy + 10)], fill=(70, 84, 94, 255))
    return im


def lens():
    rows = []
    for state in ("whole", "cracked", "empty", "whole"):
        rows.append([lens_cell(state, i) for i in range(3)])
    sheet_of(None, frames=rows).save(os.path.join(CHARS, "!$Latarnia_Soczewka.png"))


# ---------------------------------------------------------------------------------------------------------------- the icon of Tran
def icon():
    os.makedirs(ICONS, exist_ok=True)
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # a stout glass bottle of amber fish oil with a cork, a string round its neck
    body = [(9, 14), (11, 11), (13, 10), (13, 6), (19, 6), (19, 10), (21, 11), (23, 14), (23, 27), (21, 29), (11, 29), (9, 27)]
    d.polygon(body, fill=OUTLINE)
    inner = [(10, 15), (12, 12), (14, 11), (14, 7), (18, 7), (18, 11), (20, 12), (22, 15), (22, 26), (20, 28), (12, 28), (10, 26)]
    d.polygon(inner, fill=(150, 176, 150, 255))          # (the empty glass at the top: pale green)
    d.rectangle([10, 17, 22, 27], fill=(196, 128, 32, 255))   # the oil
    d.rectangle([10, 17, 22, 18], fill=(236, 176, 64, 255))
    d.rectangle([20, 19, 21, 26], fill=(150, 92, 22, 255))
    d.rectangle([11, 26, 21, 27], fill=(150, 92, 22, 255))
    d.line([(12, 19), (12, 25)], fill=(250, 214, 120, 255))
    d.line([(15, 12), (15, 15)], fill=(220, 236, 220, 255))
    d.rectangle([13, 3, 19, 6], fill=OUTLINE)            # the cork
    d.rectangle([14, 4, 18, 6], fill=(170, 124, 80, 255))
    d.line([(14, 4), (18, 4)], fill=(206, 164, 112, 255))
    d.line([(13, 9), (19, 9)], fill=(110, 80, 52, 255))  # the string
    p = os.path.join(ICONS, "tran_177.png")
    im.save(p)
    return p


def main():
    os.makedirs(SYSTEM, exist_ok=True)
    meta = {"tower": tower(), "visions": visions(), "lens": "!$Latarnia_Soczewka", "icon": os.path.relpath(icon(), ROOT).replace("\\", "/")}
    lens()
    with open(os.path.join(HERE, "art.json"), "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    print(json.dumps(meta, ensure_ascii=False))


if __name__ == "__main__":
    main()
