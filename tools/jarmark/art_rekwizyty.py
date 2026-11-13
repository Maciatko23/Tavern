# -*- coding: utf-8 -*-
"""Rekwizyty jarmarku (W17), rysowane skryptem w paletach Winlu: scena trupy (7x3 kratki) i poduszka z Srebrnym Krukiem (1x1).
Arkusze '!$' (3 wzorce x 4 kierunki, te same ramki). python tools/jarmark/art_rekwizyty.py"""
import os, random
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "art")
def sheet(frame, path):
    w, h = frame.size; S = Image.new("RGBA", (w * 3, h * 4), (0, 0, 0, 0))
    for i in range(3):
        for j in range(4): S.paste(frame, (i * w, j * h), frame)
    S.save(path)
def scena():
    W, H = 336, 144; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); rnd = random.Random(7)
    OL = (28, 20, 18, 255); WD = (112, 80, 50, 255); WL = (150, 110, 70, 255); WDK = (78, 54, 36, 255); WSK = (64, 44, 30, 255)
    R1 = (138, 38, 46, 255); R2 = (104, 28, 38, 255); R3 = (168, 58, 58, 255); GOLD = (206, 170, 76, 255); BACK = (36, 26, 32, 255)
    # tył: ciemna kulisa + kurtyny
    d.rectangle((14, 6, W - 15, 54), fill=BACK)
    for x in range(16, W - 16):          # fałdy: pasy 7 px, jaśniejsze i ciemniejsze
        k = ((x - 16) // 7) % 3
        col = (R1, R2, R3)[k]
        mid = 160 <= x <= 176             # rozsunięte na środku
        if mid: continue
        bottom = 54 - (4 if ((x - 16) // 7) % 2 else 0)
        d.line((x, 12, x, bottom), fill=col)
    d.rectangle((14, 6, W - 15, 12), fill=R2); d.line((14, 12, W - 15, 12), fill=GOLD)      # lambrekin
    for x in range(16, W - 16, 6): d.line((x, 13, x, 17), fill=GOLD)                          # frędzle
    d.rectangle((10, 4, 18, 58), fill=WDK, outline=OL); d.rectangle((W - 19, 4, W - 11, 58), fill=WDK, outline=OL)   # słupki
    d.rectangle((9, 2, 19, 6), fill=WD, outline=OL); d.rectangle((W - 20, 2, W - 10, 6), fill=WD, outline=OL)
    # podłoga: deski poziome
    d.rectangle((6, 54, W - 7, 110), fill=WD, outline=OL)
    for y in range(58, 110, 7):
        d.line((7, y, W - 8, y), fill=WSK)
        x = 8 + rnd.randint(0, 30)
        while x < W - 8: d.line((x, y - 6, x, y - 1), fill=WSK); x += rnd.randint(34, 60)
    for y in range(55, 110, 7): d.line((7, y, W - 8, y), fill=WL)
    for _ in range(90):
        x, y = rnd.randint(8, W - 9), rnd.randint(56, 108); d.point((x, y), fill=(130, 94, 60, 255) if rnd.random() < .5 else (96, 68, 44, 255))
    # krawędź i fartuch
    d.rectangle((4, 108, W - 5, 114), fill=WL, outline=OL)
    d.rectangle((6, 115, W - 7, 139), fill=WSK, outline=OL)
    for x in range(10, W - 8, 12): d.line((x, 116, x, 138), fill=(52, 36, 26, 255))
    for x in range(16, W - 8, 24): d.rectangle((x, 124, x + 3, 127), fill=(90, 64, 42, 255))
    # schody pośrodku
    for i, (x0, x1, y0) in enumerate(((146, 190, 115), (142, 194, 123), (138, 198, 131))):
        d.rectangle((x0, y0, x1, y0 + 7), fill=WL if i % 2 == 0 else WD, outline=OL)
    # cień pod sceną
    for y in range(140, 144): d.line((8, y, W - 9, y), fill=(0, 0, 0, 90 - (y - 140) * 20))
    im.save(os.path.join(OUT, "!$Jarmark_Scena_ramka.png")); sheet(im, os.path.join(OUT, "!$Jarmark_Scena.png"))
def poduszka():
    W = H = 48; im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    OL = (28, 20, 18, 255)
    d.ellipse((6, 28, 42, 44), fill=(120, 34, 44, 255), outline=OL); d.ellipse((9, 29, 39, 38), fill=(158, 52, 60, 255))
    d.line((6, 36, 4, 40), fill=(206, 170, 76, 255)); d.line((42, 36, 44, 40), fill=(206, 170, 76, 255))
    S = (170, 180, 194, 255); S2 = (112, 122, 138, 255)      # kruk srebrny: korpus, skrzydło, głowa, dziób
    d.ellipse((15, 14, 31, 31), fill=S, outline=OL); d.polygon([(26, 17), (38, 20), (30, 27)], fill=S2, outline=OL)
    d.ellipse((12, 8, 22, 18), fill=S, outline=OL); d.polygon([(12, 11), (3, 15), (12, 17)], fill=(70, 76, 90, 255), outline=OL); d.polygon([(26, 28), (34, 40), (24, 31)], fill=S2, outline=OL)
    d.rectangle((16, 11, 17, 12), fill=(250, 230, 120, 255)); d.point((17, 12), fill=OL); d.polygon([(30, 28), (36, 33), (29, 31)], fill=S2, outline=OL)
    sheet(im, os.path.join(OUT, "!$Jarmark_Kruk.png"))
if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True); scena(); poduszka()
    a = Image.open(os.path.join(OUT, "!$Jarmark_Scena_ramka.png")); b = Image.open(os.path.join(OUT, "!$Jarmark_Kruk.png")).crop((0, 0, 48, 48))
    M = Image.new("RGBA", (a.width * 2 + 120, a.height * 2 + 10), (72, 110, 70, 255)); M.paste(a.resize((a.width * 2, a.height * 2), Image.NEAREST), (0, 5), a.resize((a.width * 2, a.height * 2), Image.NEAREST))
    M.paste(b.resize((96, 96), Image.NEAREST), (a.width * 2 + 10, 5), b.resize((96, 96), Image.NEAREST)); M.save(os.path.join(HERE, "podglad", "rekwizyty.png"))
