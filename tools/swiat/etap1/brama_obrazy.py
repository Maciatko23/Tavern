# -*- coding: utf-8 -*-
"""Nowe bramy miasta (Map008) na wzor bramy zachodniej (!$West_Gate: drewniana wiata z gontem na slupach, wiszaca latarnia, otwarte skrzydlo z cieniem).
  python tools/swiat/etap1/brama_obrazy.py
  - img/characters/!$North_Gate_B.png: brama polnocna (x 24-26): kamienny luk z klinami i kluczem, mur z krenelazem ciagnie sie nad przejazdem
    (kafle muru z Map008 x 20-22), sklepienie przejazdu, kamienne przyczolki, otwarte skrzydla (z okuciami), cien na bruku, latarnie z ogniem.
    Klatka 240 x 288 (5 x 6 kratek: x 23-27, y 0-5), zdarzenie obrazu na (25, 5), priorytet nad bohaterem. Arkusz 3x4 identycznych klatek.
  - img/characters/!$East_Gate.png: brama wschodnia (x 102-103, y 17-19) = !$West_Gate odbita lustrzanie, dach bez zmian.
    Klatka 240 x 288. Wiersz 0 (kierunek 2, wzor 1): dach i slupy, zdarzenie (102, 20) nad bohaterem; wiersz 1 (kierunek 4, wzor 1): skrzydlo i cien,
    zdarzenie (102, 18) pod bohaterem."""
import os, sys, random
from PIL import Image, ImageDraw, ImageOps
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as M
import most as MO
T = 48


def sheet_of(frames, fw, fh, cols=3, rows=4):
    sh = Image.new("RGBA", (fw * cols, fh * rows), (0, 0, 0, 0))
    for j in range(rows):
        f = frames[j] if isinstance(frames, list) else frames
        for i in range(cols): sh.paste(f, (i * fw, j * fh))
    return sh


# ------------------------------------------------------------------------------------------------ brama polnocna
def north():
    m = M.Mapa(8)
    wall = M.render(m, region=(20, 0, 22, 2), hide=lambda e: True).convert("RGBA")       # 144 x 144: krenelaz + gzyms + korbele muru
    face = M.render(m, region=(20, 3, 22, 4), hide=lambda e: True).convert("RGBA")       # 144 x 96: lico muru
    rnd = random.Random(5)
    FW, FH = 5 * T, 6 * T
    img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    img.paste(wall, (T, 0))                    # mur nad przejazdem (x 24-26, y 0-2) z krenelazem - ciag dalszy muru
    img.paste(face.crop((0, 0, 144, 48)), (T, 144))   # lico muru y 3 (nad otworem luku, ponizej zostanie wyciete)
    d = ImageDraw.Draw(img)
    cx, base = 120, 240                        # os przejazdu, podloga (dol y 4)
    hw, rise = 70, 62                          # otwor luku: px 50..190, szczyt luku y = 240 - 62 - ... (nizej)
    spring = 176                               # linia nasady luku
    top = spring - rise
    # wycinamy otwor w licu: luk odcinkowy (elipsa) nad prostokatem
    px = img.load()
    import math
    for y in range(top - 12, base):
        for x in range(cx - hw - 12, cx + hw + 13):
            if y < spring: e = ((x - cx) / (hw + 11)) ** 2 + ((y - spring) / (rise + 11)) ** 2
            else: e = ((x - cx) / (hw + 11)) ** 2
            inside_ring = e <= 1
            if inside_ring and y >= 100: px[x, y] = MO.TONES[3] if ((x + y) // 6) % 7 else MO.HIGH
    for k in range(-8, 9):                     # kliny wienca
        a = math.pi / 2 + k * 0.17
        ex, ey = cx + (hw + 11) * math.cos(a), spring - (rise + 11) * math.sin(a)
        ix, iy = cx + hw * math.cos(a), spring - rise * math.sin(a)
        if ey < spring: d.line([ix, iy, ex, ey], fill=MO.JOINT)
    # sklepienie (ciemne, kamienne): w otworze od gory do y 206, dalej przezroczysta podloga z cieniem
    for y in range(top, base):
        for x in range(cx - hw, cx + hw + 1):
            if y < spring: e = ((x - cx) / hw) ** 2 + ((y - spring) / rise) ** 2
            else: e = ((x - cx) / hw) ** 2
            if e <= 1:
                if y < 192:
                    t = (y - top) / (192 - top)
                    c = (int(28 + 30 * t), int(36 + 32 * t), int(42 + 30 * t), 255)
                    if y % 12 == 0: c = (c[0] - 10, c[1] - 10, c[2] - 10, 255)         # fugi sklepienia
                    px[x, y] = c
                else:
                    px[x, y] = (6, 8, 12, int(130 * (1 - (y - 192) / (base - 192))))      # cien tunelu na bruku
    d.line([cx - hw, spring, cx - hw, base - 1], fill=MO.JOINT); d.line([cx + hw, spring, cx + hw, base - 1], fill=MO.JOINT)
    # klucz luku
    d.rectangle([cx - 9, top - 16, cx + 8, top - 1], fill=MO.CAP); d.line([cx - 9, top - 16, cx + 8, top - 16], fill=(205, 216, 212, 255))
    d.line([cx - 9, top - 16, cx - 9, top - 1], fill=MO.JOINT); d.line([cx + 8, top - 16, cx + 8, top - 1], fill=MO.JOINT)
    # gzyms nad lukiem
    MO.cap(img, T + 2, 99, 4 * T - 2, 111)
    # przyczolek tylko z lewej (kamienny slup, wchodzi w sklepienie); z prawej luk opiera sie o baszte (x 27 = px 192),
    # wiec nic nie moze na nia wchodzic (gracz: "po prawo kolumna wchodzi na mur")
    for (xa, xb) in ((18, 56),):
        MO.bricks(img, xa, 118, xb, base, rnd, course=12, bw=(16, 22))
        MO.cap(img, xa - 4, 108, xb + 4, 120)
        d.line([xa, 120, xa, base - 1], fill=MO.JOINT); d.line([xb - 1, 120, xb - 1, base - 1], fill=MO.JOINT)
    # otwarte skrzydla bramy: widziane od krawedzi, przy scianach przejazdu (deski z okuciami), cien na bruku
    for (xa, xb) in ((58, 72), (168, 182)):
        d.rectangle([xa, 150, xb - 1, base - 1], fill=MO.WOOD[1])
        for yy in range(152, base - 4, 16): d.rectangle([xa, yy, xb - 1, yy + 3], fill=MO.IRON)
        d.line([xa, 150, xa, base - 1], fill=(150, 112, 74, 255)); d.line([xb - 1, 150, xb - 1, base - 1], fill=MO.WOODD)
        sh = Image.new("RGBA", (FW, FH), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
        sx = xb if xa < 120 else xa - 22
        ds.rectangle([sx, 168, sx + 22, base + 14], fill=(0, 0, 0, 70)); img.alpha_composite(sh)
    # cien pod lukiem na ulicy (wiersz y 5)
    sh = Image.new("RGBA", (FW, FH), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.rectangle([60, base, 180, base + 12], fill=(0, 0, 0, 45)); img.alpha_composite(sh)
    # latarnie z ogniem na szczytach przyczolkow (te same latarenki co przy moscie)
    MO.lantern(img, 37, 76); MO.lantern(img, 178, 76)
    px = img.load()
    for y in range(FH):                         # od px 192 w prawo stoi baszta (kafle mapy): obraz tam przezroczysty
        for x in range(192, FW): px[x, y] = (0, 0, 0, 0)
    img.save(os.path.join(HERE, "staging", "brama_N_klatka.png"))
    out = os.path.join(ROOT, "img", "characters", "!$North_Gate_B.png")
    sheet_of(img, FW, FH).save(out); print("zapisano", out)


# ------------------------------------------------------------------------------------------------ brama wschodnia
def east():
    src = Image.open(os.path.join(ROOT, "img", "characters", "!$West_Gate.png")).convert("RGBA")
    FW, FH = 240, 288
    roof = src.crop((FW * 1, 0, FW * 2, FH))                    # kierunek 2, wzor 1
    leaf = src.crop((FW * 1, FH * 1, FW * 2, FH * 2))           # kierunek 4, wzor 1
    # dach bez zmian (wiata nad dwoma poludniowymi rzedami przejazdu, skrzydlo przy polnocnej scianie - jak w bramie zachodniej)
    roof_m = ImageOps.mirror(roof)
    leaf_m = ImageOps.mirror(leaf)
    FH2 = FH
    sh = Image.new("RGBA", (FW * 3, FH2 * 4), (0, 0, 0, 0))
    for i in range(3):
        sh.paste(roof_m, (i * FW, 0)); sh.paste(leaf_m, (i * FW, FH2 * 1)); sh.paste(roof_m, (i * FW, FH2 * 2)); sh.paste(leaf_m, (i * FW, FH2 * 3))
    out = os.path.join(ROOT, "img", "characters", "!$East_Gate.png")
    sh.save(out); print("zapisano", out, sh.size)
    bg = Image.new("RGBA", (FW * 2, FH2), (70, 100, 70, 255)); bg.alpha_composite(roof_m, (0, 0)); bg.alpha_composite(leaf_m, (FW, 0))
    bg.save(os.path.join(HERE, "staging", "brama_E_klatki.png"))


if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "staging"), exist_ok=True)
    north(); east()
