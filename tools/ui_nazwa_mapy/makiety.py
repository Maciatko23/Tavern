# python tools/ui_nazwa_mapy/makiety.py
# Makiety nazwy mapy przy wejściu (gracz 2026-10-23: „jak się wchodzi na mapę i jest wyświetlona nazwa mapy, to można tę nazwę
# jakoś ładnie zaprezentować, upiększyć?”). Pięć wariantów narysowanych na prawdziwych zrzutach z gry (baza_*.png, bez napisu),
# czcionki z fonts/ gry. Wynik: docs/ui_nazwa_mapy/<n>_<wariant>_<miejsce>.png + wszystkie.png (zestawienie).
import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "docs", "ui_nazwa_mapy")
FONTS = os.path.join(ROOT, "fonts")
GOLD, CREAM, MUTED, INK = (255, 210, 63), (240, 232, 214), (170, 164, 150), (66, 40, 20)

MIEJSCA = {
    "podgrodzie": dict(baza="baza_podgrodzie.png", nazwa="Podgrodzie", pod="biedna dzielnica za murami miasta",
                       opis="Tu dym pachnie smołą, a każdy grosz liczy się dwa razy.", znak="dom", rejon="PRZEDMIEŚCIA"),
    "las": dict(baza="baza_las.png", nazwa="Leśna droga", pod="trakt przez sosnowy las",
                opis="Ślady kół, żywica i czyjeś ognisko gdzieś w głębi.", znak="sosna", rejon="TRAKT NA WSCHÓD"),
    "przystan": dict(baza="baza_przystan.png", nazwa="Przystań", pod="tu przybijają ostatnie promy",
                     opis="Woda pamięta wojnę lepiej niż ludzie.", znak="kotwica", rejon="WYBRZEŻE"),
}


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def tw(f, s, sp=0):
    return sum(f.getlength(ch) for ch in s) + sp * max(0, len(s) - 1)


def spaced(d, xy, s, f, sp, fill, stroke=0, sfill=None, anchor_center=True):
    x, y = xy
    if anchor_center: x -= tw(f, s, sp) / 2
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill, stroke_width=stroke, stroke_fill=sfill)
        x += f.getlength(ch) + sp


def shadow_text(img, xy, s, f, sp, fill, blur=4, alpha=170, stroke=3, center=True):
    """napis z miękkim cieniem i obrysem"""
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    spaced(ImageDraw.Draw(sh), (xy[0] + 2, xy[1] + 3), s, f, sp, (0, 0, 0, alpha), stroke, (0, 0, 0, alpha), center)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    spaced(ImageDraw.Draw(img), xy, s, f, sp, fill, stroke, (0, 0, 0, 200), center)


def grad_text(img, xy, s, f, sp, top, bottom, center=True):
    """napis z pionowym przejściem kolorów (złoto), obrysem i cieniem"""
    shadow_text(img, xy, s, f, sp, (0, 0, 0, 0), blur=5, alpha=190, stroke=4, center=center)
    mask = Image.new("L", img.size, 0)
    spaced(ImageDraw.Draw(mask), xy, s, f, sp, 255, 0, None, center)
    bb = mask.getbbox()
    if not bb: return
    g = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    for y in range(bb[1], bb[3] + 1):
        k = (y - bb[1]) / max(1, bb[3] - bb[1])
        gd.line([(bb[0], y), (bb[2], y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * k) for i in range(3)) + (255,))
    img.paste(g, (0, 0), mask)


def noise(im, amount, seed=1):
    r = random.Random(seed)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] == 0: continue
            n = r.randint(-amount, amount)
            px[x, y] = (max(0, min(255, p[0] + n)), max(0, min(255, p[1] + n)), max(0, min(255, p[2] + n)), p[3])
    return im


# ------------------------------------------------------------------ 1. Wstęga (pergaminowa)
def wstega(img, m):
    f, fs = font("AlegreyaSC-Bold.ttf", 34), font("Caveat-Bold.ttf", 26)
    w = int(tw(f, m["nazwa"], 3)) + 120
    h, cx, y0 = 58, img.width // 2, 34
    S = 2
    lay = Image.new("RGBA", (img.width * S, 160 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x0, x1 = (cx - w // 2) * S, (cx + w // 2) * S
    dark, mid = (150, 112, 66, 255), (190, 150, 96, 255)
    for side in (-1, 1):    # ogony: niżej, ciemniejsze, z wcięciem
        xe = x0 if side < 0 else x1
        xt = xe + side * 70 * S
        top, bot = (y0 + 14) * S, (y0 + 14 + h) * S
        d.polygon([(xe - side * 30 * S, top), (xt, top), (xt - side * 22 * S, (top + bot) // 2), (xt, bot), (xe - side * 30 * S, bot)], fill=dark)
        d.polygon([(xe, (y0 + h) * S), (xe - side * 30 * S, bot), (xe - side * 30 * S, (y0 + h) * S)], fill=(110, 80, 46, 255))
    d.rectangle([x0, y0 * S, x1, (y0 + h) * S], fill=(226, 204, 158, 255))
    lay = lay.resize((img.width, 160), Image.LANCZOS)
    noise(lay, 9)
    # ciemniejsze brzegi wstęgi
    edge = Image.new("L", lay.size, 0)
    ImageDraw.Draw(edge).rectangle([cx - w // 2 + 6, y0 + 6, cx + w // 2 - 6, y0 + h - 6], fill=255)
    edge = edge.filter(ImageFilter.GaussianBlur(7))
    shade = Image.new("RGBA", lay.size, (120, 84, 44, 110))
    band = Image.new("L", lay.size, 0)
    ImageDraw.Draw(band).rectangle([cx - w // 2, y0, cx + w // 2, y0 + h], fill=255)
    inv = Image.eval(edge, lambda v: 255 - v)
    lay.paste(shade, (0, 0), Image.composite(inv, Image.new("L", lay.size, 0), band))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    a = lay.split()[3].point(lambda v: int(v * 0.55))
    sh.paste((0, 0, 0, 255), (4, 6), a)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    img.alpha_composite(lay, (0, 0))
    spaced(ImageDraw.Draw(img), (cx, y0 + 7), m["nazwa"].upper(), f, 3, INK)
    shadow_text(img, (cx, y0 + h + 10), m["pod"], fs, 0, CREAM, blur=3, alpha=200, stroke=2)


# ------------------------------------------------------------------ 2. Kronika (złoty napis + ornament)
def kronika(img, m):
    f, fs, fo = font("AlegreyaSC-Bold.ttf", 48), font("AlegreyaSans-Medium.ttf", 21), font("EBGaramond-Variable.ttf", 22)
    cx, y = img.width // 2, 30
    grad_text(img, (cx, y), m["nazwa"].upper(), f, 6, (255, 236, 150), (214, 160, 30))
    ly = y + 70
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    half = 190
    for i in range(half):
        a = int(230 * (1 - i / half) ** 1.4)
        for side in (-1, 1):
            d.point((cx + side * (14 + i), ly), fill=GOLD + (a,))
            d.point((cx + side * (14 + i), ly + 1), fill=(0, 0, 0, a // 2))
    d.polygon([(cx, ly - 7), (cx + 7, ly), (cx, ly + 7), (cx - 7, ly)], fill=GOLD + (255,), outline=(60, 40, 0, 255))
    for side in (-1, 1):
        d.ellipse([cx + side * 22 - 2, ly - 2, cx + side * 22 + 2, ly + 2], fill=GOLD + (230,))
    img.alpha_composite(lay)
    shadow_text(img, (cx, ly + 12), m["pod"].upper(), fs, 3, CREAM, blur=3, alpha=200, stroke=2)
    shadow_text(img, (cx, ly + 42), m["opis"], fo, 0, MUTED, blur=3, alpha=200, stroke=2)


# ------------------------------------------------------------------ 3. Kinowy (pasy, nazwa w lewym dolnym rogu)
def kinowy(img, m):
    bars = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(bars)
    d.rectangle([0, 0, img.width, 64], fill=(0, 0, 0, 235))
    d.rectangle([0, img.height - 64, img.width, img.height], fill=(0, 0, 0, 235))
    # przyciemnienie od dołu pod napisem
    for i in range(220):
        d.line([(0, img.height - 64 - i), (img.width, img.height - 64 - i)], fill=(0, 0, 0, int(120 * (1 - i / 220))))
    img.alpha_composite(bars)
    f, ft, fo = font("AlegreyaSC-Bold.ttf", 60), font("AlegreyaSansSC-Medium.ttf", 17), font("EBGaramond-Variable.ttf", 25)
    x, y = 70, img.height - 64 - 168
    shadow_text(img, (x, y), m["rejon"], ft, 5, GOLD, blur=2, alpha=180, stroke=1, center=False)
    shadow_text(img, (x - 2, y + 20), m["nazwa"], f, 2, CREAM, blur=5, alpha=200, stroke=2, center=False)
    ImageDraw.Draw(img).rectangle([x, y + 98, x + 120, y + 100], fill=GOLD + (255,))
    shadow_text(img, (x, y + 110), m["opis"], fo, 0, (220, 212, 196), blur=3, alpha=200, stroke=1, center=False)


# ------------------------------------------------------------------ 4. Szyld (drewniana tablica na linkach)
def szyld(img, m):
    f, fs = font("PirataOne-Regular.ttf", 44), font("AlegreyaSans-Medium.ttf", 19)
    cx = img.width // 2
    w, h, top = int(tw(f, m["nazwa"], 1)) + 90, 74, 40
    x0, x1 = cx - w // 2, cx + w // 2
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for xr in (x0 + 34, x1 - 34):   # linki
        d.line([(xr, 0), (xr, top + 6)], fill=(92, 74, 50, 255), width=3)
        d.line([(xr + 1, 0), (xr + 1, top + 6)], fill=(140, 116, 80, 255), width=1)
    d.rounded_rectangle([x0, top, x1, top + h], radius=8, fill=(118, 76, 42, 255), outline=(52, 32, 16, 255), width=3)
    r = random.Random(7)
    for i in range(26):     # słoje
        yy = top + 6 + r.randint(0, h - 12)
        xa = x0 + 8 + r.randint(0, w // 3)
        d.line([(xa, yy), (xa + r.randint(w // 4, w // 2), yy + r.choice((-1, 0, 1)))], fill=(92, 58, 30, 160), width=1)
    d.line([(x0 + 6, top + 4), (x1 - 6, top + 4)], fill=(160, 110, 66, 200), width=2)
    for xr in (x0 + 34, x1 - 34):   # gwoździe
        d.ellipse([xr - 4, top + 8, xr + 4, top + 16], fill=(60, 56, 52, 255), outline=(150, 140, 120, 255))
    noise(lay, 7, 3)
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 255), (5, 7), lay.split()[3].point(lambda v: int(v * 0.5)))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    img.alpha_composite(lay)
    d = ImageDraw.Draw(img)
    spaced(d, (cx, top + 11), m["nazwa"], f, 1, (196, 150, 96, 255))           # jasna krawędź wypalenia
    spaced(d, (cx, top + 9), m["nazwa"], f, 1, (38, 20, 8, 255))
    shadow_text(img, (cx, top + h + 12), m["pod"], fs, 1, CREAM, blur=3, alpha=200, stroke=2)


# ------------------------------------------------------------------ 5. Pieczęć (znak miejsca + nazwa, „odkryto”)
def znak(d, kind, cx, cy, col):
    if kind == "dom":
        d.polygon([(cx - 14, cy + 2), (cx, cy - 13), (cx + 14, cy + 2)], fill=col)
        d.rectangle([cx - 10, cy + 2, cx + 10, cy + 14], fill=col)
        d.rectangle([cx - 3, cy + 6, cx + 3, cy + 14], fill=(110, 18, 18, 255))
    elif kind == "sosna":
        for i, ww in enumerate((8, 12, 16)):
            yy = cy - 14 + i * 8
            d.polygon([(cx, yy), (cx + ww, yy + 12), (cx - ww, yy + 12)], fill=col)
        d.rectangle([cx - 2, cy + 10, cx + 2, cy + 16], fill=col)
    else:
        d.ellipse([cx - 4, cy - 15, cx + 4, cy - 7], outline=col, width=2)
        d.line([(cx, cy - 7), (cx, cy + 14)], fill=col, width=3)
        d.line([(cx - 8, cy - 3), (cx + 8, cy - 3)], fill=col, width=3)
        d.arc([cx - 13, cy - 2, cx + 13, cy + 16], 20, 160, fill=col, width=3)


def pieczec(img, m):
    f, fs, ft = font("AlegreyaSC-Bold.ttf", 40), font("AlegreyaSans-Medium.ttf", 19), font("AlegreyaSansSC-Medium.ttf", 16)
    name_w = tw(f, m["nazwa"].upper(), 3)
    total = 84 + 16 + name_w
    x0 = img.width // 2 - total / 2
    cx, cy = int(x0 + 42), 74
    S = 3
    seal = Image.new("RGBA", (96 * S, 96 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(seal)
    r = random.Random(5)
    pts = []
    import math
    for i in range(28):
        a = i / 28 * 2 * math.pi
        rr = (40 + r.uniform(-2.5, 2.5)) * S
        pts.append((48 * S + rr * math.cos(a), 48 * S + rr * math.sin(a)))
    d.polygon(pts, fill=(150, 28, 30, 255))
    d.ellipse([16 * S, 16 * S, 80 * S, 80 * S], outline=(110, 16, 18, 255), width=3 * S)
    d.ellipse([19 * S, 18 * S, 77 * S, 76 * S], outline=(196, 70, 62, 255), width=S)
    seal = seal.resize((96, 96), Image.LANCZOS)
    znak(ImageDraw.Draw(seal), m["znak"], 48, 48, (238, 196, 160, 255))
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 255), (cx - 48 + 3, cy - 48 + 5), seal.split()[3].point(lambda v: int(v * 0.6)))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)))
    img.alpha_composite(seal, (cx - 48, cy - 48))
    tx = int(x0 + 84 + 16)
    shadow_text(img, (tx, 40), m["nazwa"].upper(), f, 3, CREAM, blur=4, alpha=200, stroke=3, center=False)
    shadow_text(img, (tx + 2, 90), "ODKRYTO  ·  +25 DOŚW.", ft, 3, GOLD, blur=2, alpha=200, stroke=1, center=False)
    shadow_text(img, (tx + 2, 110), m["pod"], fs, 0, MUTED, blur=2, alpha=200, stroke=2, center=False)


WARIANTY = [("1_wstega", "Wstęga", wstega), ("2_kronika", "Kronika", kronika), ("3_kinowy", "Kinowy", kinowy),
            ("4_szyld", "Szyld", szyld), ("5_pieczec", "Pieczęć", pieczec)]


def main():
    os.makedirs(OUT, exist_ok=True)
    shots = []
    for key, label, fn in WARIANTY:
        for mk in ("podgrodzie", "las", "przystan"):
            m = MIEJSCA[mk]
            img = Image.open(os.path.join(HERE, m["baza"])).convert("RGBA")
            fn(img, m)
            p = os.path.join(OUT, "%s_%s.png" % (key, mk))
            img.convert("RGB").save(p)
            shots.append((label, mk, img))
    # zestawienie: wiersz = wariant, kolumny = miejsca
    sc = 0.4
    tw_, th = int(1280 * sc), int(720 * sc)
    sheet = Image.new("RGB", (40 + 3 * (tw_ + 10), 5 * (th + 36) + 10), (18, 18, 20))
    d = ImageDraw.Draw(sheet)
    fl = font("AlegreyaSans-Bold.ttf", 20)
    for i, (label, mk, img) in enumerate(shots):
        r, c = i // 3, i % 3
        x, y = 30 + c * (tw_ + 10), 10 + r * (th + 36)
        if c == 0: d.text((x, y), "%d. %s" % (r + 1, label), font=fl, fill=GOLD)
        sheet.paste(img.convert("RGB").resize((tw_, th), Image.LANCZOS), (x, y + 28))
    sheet.save(os.path.join(OUT, "wszystkie.png"))
    print("zapisano", OUT)


if __name__ == "__main__":
    main()
