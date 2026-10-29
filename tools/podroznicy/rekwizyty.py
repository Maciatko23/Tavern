# -*- coding: utf-8 -*-
"""Rekwizyty podróżnych z promu (docs/PODROZNI.md, etap 3): img/characters/!$Podr_<Nazwa>.png.

python tools/podroznicy/rekwizyty.py            -> sześć arkuszy + stykówka docs/postacie/podr_rekwizyty.png

Format jak !$Lud_Skrzynia.png: 144 x 192 = 3 kolumny x 4 wiersze RÓWNYCH klatek 48 x 48, w każdej klatce ta sama grafika
(przedmiot nie ma stanów ani kierunków); przedmiot przy dolnej krawędzi klatki, wyśrodkowany ('!' = bez przesunięcia 6 px).
- List, Szkatułka, Taca, Bagaż: z jednego obrazu PixelLab Pro Flash 96 x 96 (4 przedmioty w siatce 2 x 2, styl: klatka
  !$Lud_Skrzynia; 5 generacji, 2026-10-29) - raw/rekwizyty_a.png. Szkatułka wyszła wielkości skrzyni: zmniejszona do ok. 70%
  wyjmowaniem całych wierszy i kolumn (tools/npc/build_npc.shrink - kontur zostaje ostry).
- Sznur (cienki sznur z ołowianką zwisający z góry, pion) i Sadza (smuga sadzy na podłodze): rysowane tu kodem, 0 generacji.
Deterministyczne - można uruchamiać wiele razy.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CHARS = os.path.join(ROOT, "img", "characters")
RAW = os.path.join(HERE, "raw", "rekwizyty_a.png")
sys.path.insert(0, os.path.join(ROOT, "tools", "npc"))
import build_npc   # noqa: E402  (shrink: wyjmowanie wierszy i kolumn)

CW = CH = 48
LINE = (34, 24, 22, 255)


def clean(im, a_min=100, keep=6):
    """alfa 0/255, okruchy (do `keep` px, oddzielone od reszty) usunięte"""
    a = np.array(im.convert("RGBA"))
    a[..., 3] = np.where(a[..., 3] >= a_min, 255, 0)
    op = a[..., 3] > 0
    H, W = op.shape
    seen = np.zeros_like(op)
    for y in range(H):
        for x in range(W):
            if op[y, x] and not seen[y, x]:
                stack, comp = [(y, x)], []
                seen[y, x] = True
                while stack:
                    cy, cx = stack.pop()
                    comp.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and op[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True
                                stack.append((ny, nx))
                if len(comp) <= keep:
                    for cy, cx in comp:
                        a[cy, cx, 3] = 0
    return Image.fromarray(a, "RGBA")


def soften(im, sat=0.95):
    """barwy odrobinę mniej nasycone (PixelLab jest żywszy niż kafle Winlu) - jak build_objects.py paczki C"""
    a = np.array(im).astype(np.float32)
    g = a[..., :3].mean(axis=2, keepdims=True)
    a[..., :3] = np.clip(g + (a[..., :3] - g) * sat, 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def ground_shadow(rx, ry, cy, alpha=70, col=(16, 30, 16)):
    sh = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    d.ellipse((CW / 2 - rx, cy - ry, CW / 2 + rx, cy + ry), fill=col + (alpha,))
    return sh.filter(ImageFilter.GaussianBlur(1.2))


def in_cell(obj, shadow=None, bottom=1):
    """przedmiot w klatce 48 x 48: dół-środek na dole-środku klatki (podniesiony o `bottom` px)"""
    obj = obj.crop(obj.getbbox())
    cell = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    if shadow:
        rx, ry, al = shadow
        cell.alpha_composite(ground_shadow(rx, ry, CH - bottom - 2, al))
    cell.alpha_composite(obj, ((CW - obj.width) // 2, CH - bottom - obj.height))
    return cell


def quarter(raw, qx, qy):
    q = raw.crop((qx * 48, qy * 48, qx * 48 + 48, qy * 48 + 48))
    return soften(clean(q))


def smaller(obj, s):
    """obiekt zmniejszony wyjmowaniem całych wierszy i kolumn (build_npc.shrink na komórce 64 x 64, dół zostaje)"""
    obj = obj.crop(obj.getbbox())
    c = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    c.alpha_composite(obj, ((64 - obj.width) // 2, 63 - obj.height))
    st, _, _ = build_npc.shrink(c, [], s)
    return st.crop(st.getbbox())


def sznur():
    """cienki konopny sznur zwisający z góry klatki, na dole ołowianka (pion murarski)"""
    im = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    px = im.load()
    x = CW // 2
    CORD, CORD_D, CORD_L = (150, 118, 78, 255), (92, 68, 44, 255), (188, 160, 116, 255)
    for y in range(0, 33):
        px[x, y] = CORD if (y // 3) % 2 == 0 else CORD_L      # (skręt sznura: jaśniejsze i ciemniejsze odcinki)
        px[x + 1, y] = CORD_D
    # węzeł i uszko ołowianki
    for (dx, dy) in ((0, 33), (1, 33), (-1, 34), (0, 34), (1, 34), (2, 34)):
        px[x + dx, dy] = CORD_D
    # ołowianka: odwrócona kropla 6 x 9 px, szary ołów z blikiem z lewej-góry, ciemny kontur
    LEAD = [(60, 62, 70, 255), (96, 98, 108, 255), (138, 142, 152, 255), (186, 190, 198, 255)]
    rows = {35: (0, 1), 36: (-1, 2), 37: (-2, 3), 38: (-2, 3), 39: (-2, 3), 40: (-2, 3), 41: (-1, 2), 42: (0, 1), 43: (0, 1)}
    for y, (a, b) in rows.items():
        for xx in range(a, b + 1):
            edge = xx in (a, b) or y in (35, 43)
            if edge:
                c = LINE
            elif xx <= a + 1 and y <= 38:
                c = LEAD[3] if (xx, y) == (a + 1, 37) else LEAD[2]
            elif xx >= b - 1 or y >= 41:
                c = LEAD[0]
            else:
                c = LEAD[1]
            px[x + xx, y] = c
    px[x, 44] = LINE      # (ostry czubek)
    return im


def sadza():
    """smuga sadzy na podłodze: nieregularna plama, ciemniejszy rdzeń, odciśnięty ślad palców i drobiny wokół"""
    rng = np.random.RandomState(29)
    H, W = CH, CW
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = 24.0, 39.0
    # smuga: kilka nachodzących elips wzdłuż lekko ukośnej linii (rozmazana ręką)
    m = np.zeros((H, W), np.float32)
    for t, rx, ry in ((-10, 6.5, 3.6), (-4, 8.0, 4.4), (3, 7.5, 4.0), (9, 5.5, 3.2), (13, 3.0, 2.0)):
        ex, ey = cx + t, cy - t * 0.18
        d = ((xx - ex) / rx) ** 2 + ((yy - ey) / ry) ** 2
        m = np.maximum(m, np.clip(1.25 - d, 0, 1))
    noise = rng.rand(H, W).astype(np.float32)
    m = m * (0.65 + 0.35 * noise)
    # ślady palców: trzy cienkie ciemniejsze pasma
    for k in range(3):
        y0 = cy - 2.2 + k * 2.2
        band = np.exp(-((yy - (y0 - (xx - cx) * 0.18)) ** 2) / 0.6) * ((xx > cx - 9) & (xx < cx + 9))
        m = np.maximum(m, band * 0.95 * (m > 0.15))
    # drobiny
    for _ in range(14):
        a = rng.uniform(0, 2 * np.pi)
        r = rng.uniform(9, 16)
        sx, sy = int(cx + np.cos(a) * r), int(cy + np.sin(a) * r * 0.45)
        if 0 <= sx < W and 0 <= sy < H:
            m[sy, sx] = max(m[sy, sx], rng.uniform(0.45, 0.8))
    alpha = np.clip(m * 215, 0, 215)
    alpha = np.where(alpha < 40, 0, alpha)
    rgb = np.zeros((H, W, 3), np.float32)
    shade = 1 - np.clip(m, 0, 1)
    rgb[..., 0] = 20 + 26 * shade
    rgb[..., 1] = 18 + 22 * shade
    rgb[..., 2] = 18 + 20 * shade
    a = np.dstack([rgb, alpha]).astype(np.uint8)
    return Image.fromarray(a, "RGBA")


def sheet(cell, name):
    out = Image.new("RGBA", (CW * 3, CH * 4), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            out.alpha_composite(cell, (c * CW, r * CH))
    out.save(os.path.join(CHARS, name + ".png"))
    return out


def main():
    raw = Image.open(RAW).convert("RGBA")
    list_ = quarter(raw, 0, 0)
    szk = smaller(quarter(raw, 1, 0), 0.7)
    taca = quarter(raw, 0, 1)
    bagaz = quarter(raw, 1, 1)
    cells = {
        "!$Podr_List": in_cell(list_, shadow=(11, 2, 45), bottom=3),
        "!$Podr_Szkatulka": in_cell(szk, shadow=(10, 2, 70), bottom=2),
        "!$Podr_Sznur": sznur(),
        "!$Podr_Sadza": sadza(),
        "!$Podr_Taca": in_cell(taca, shadow=(15, 3, 60), bottom=2),
        "!$Podr_Bagaz": in_cell(bagaz, shadow=(13, 3, 70), bottom=1),
    }
    S = 4
    prev = Image.new("RGBA", (len(cells) * (CW * S + 8) + 8, CH * S + 30), (110, 96, 78, 255))   # (deski: ciepłe tło)
    d = ImageDraw.Draw(prev)
    for i, (name, cell) in enumerate(cells.items()):
        sheet(cell, name)
        x = 8 + i * (CW * S + 8)
        prev.alpha_composite(cell.resize((CW * S, CH * S), Image.NEAREST), (x, 22))
        d.rectangle((x, 22, x + CW * S - 1, 22 + CH * S - 1), outline=(80, 70, 56, 255))
        d.text((x + 2, 4), name, fill=(255, 255, 255, 255))
    out = os.path.join(ROOT, "docs", "postacie", "podr_rekwizyty.png")
    prev.convert("RGB").save(out)
    print("zapisano", len(cells), "arkuszy !$Podr_* - stykówka:", out)


if __name__ == "__main__":
    main()
