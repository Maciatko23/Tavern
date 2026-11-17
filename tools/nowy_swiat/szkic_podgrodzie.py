# -*- coding: utf-8 -*-
"""Szkic układu Podgrodzia 80x80 (nowy świat, docs/NOWY_SWIAT/PLAN.md) - plan z lotu ptaka do akceptacji, nie mapa gry.
python tools/nowy_swiat/szkic_podgrodzie.py  ->  docs/NOWY_SWIAT/szkic_podgrodzie.png"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "docs", "NOWY_SWIAT", "szkic_podgrodzie.png")
W = H = 80
S = 10                      # px na kafel w szkicu
PAD_R = 330                 # legenda po prawej

def font(size, bold=False):
    for f in (("arialbd.ttf" if bold else "arial.ttf"), "DejaVuSans.ttf"):
        try: return ImageFont.truetype(os.path.join("C:/Windows/Fonts", f), size)
        except Exception: pass
    return ImageFont.load_default()

img = Image.new("RGB", (W * S + PAD_R, H * S + 40), (34, 38, 32))
d = ImageDraw.Draw(img)
OX, OY = 0, 40

def rect(x0, y0, x1, y1, fill, outline=None, width=1):
    d.rectangle([OX + x0 * S, OY + y0 * S, OX + (x1 + 1) * S - 1, OY + (y1 + 1) * S - 1], fill=fill, outline=outline, width=width)

def label(x, y, text, size=11, col=(20, 20, 20), anchor="mm", bold=False):
    d.text((OX + x * S, OY + y * S), text, fill=col, font=font(size, bold), anchor=anchor)

# trawa (wydeptana, biedna) i krzaki przy brzegach
rect(0, 0, W - 1, H - 1, (120, 140, 84))
for (x0, y0, x1, y1) in [(0, 0, 79, 3), (0, 76, 79, 79), (0, 0, 2, 79), (77, 0, 79, 34), (77, 48, 79, 79)]:
    rect(x0, y0, x1, y1, (78, 104, 62))          # zarośla, skały - brzeg mapy (nieprzechodni poza drogami)
# pniaki: dawno wycięty las (drewno jest drogie)
for (x, y) in [(6, 8), (9, 6), (44, 6), (52, 9), (60, 5), (68, 8), (8, 70), (30, 73), (56, 72), (70, 69), (73, 20), (48, 64)]:
    rect(x, y, x, y, (110, 82, 50))

# suche koryto: od wschodu (spod miasta) na zachód, do morza
koryto = [(79, 50), (70, 51), (62, 54), (54, 55), (46, 56), (38, 58), (30, 58), (22, 60), (14, 61), (6, 62), (0, 63)]
for (a, b) in zip(koryto, koryto[1:]):
    d.line([OX + a[0] * S, OY + a[1] * S, OX + b[0] * S, OY + b[1] * S], fill=(176, 150, 112), width=4 * S)
label(58, 57, "suche koryto (do morza)", 11, (60, 45, 30))

# droga główna: wschód (miasteczko) - zachód (wybrzeże); odnogi
droga = [(79, 41), (66, 41), (54, 42), (42, 42), (30, 43), (18, 44), (8, 45), (0, 45)]
for (a, b) in zip(droga, droga[1:]):
    d.line([OX + a[0] * S, OY + a[1] * S, OX + b[0] * S, OY + b[1] * S], fill=(196, 172, 128), width=3 * S)
for line in [[(22, 43), (22, 30), (20, 22)], [(46, 42), (46, 30)], [(40, 42), (40, 58), (40, 66)], [(62, 41), (62, 30)], [(14, 44), (14, 66)]]:
    d.line([(OX + x * S, OY + y * S) for (x, y) in line], fill=(196, 172, 128), width=2 * S)
# kładki przez koryto
for (x, y) in [(40, 57), (14, 61)]:
    rect(x - 1, y - 2, x + 1, y + 2, (140, 100, 60), (70, 50, 30))

# DZIADEK: dom + większa działka (północny zachód, spokojnie)
rect(12, 14, 19, 19, (170, 120, 70), (60, 40, 20), 2); label(15.5, 16.5, "DOM\nDZIADKA", 10, (30, 20, 10), bold=True)
rect(21, 10, 40, 24, (150, 120, 76), (90, 70, 40), 2)          # działka 20x15 w płotku
for yy in range(12, 24, 2): d.line([OX + 22 * S, OY + yy * S + S // 2, OX + 40 * S, OY + yy * S + S // 2], fill=(128, 98, 60), width=2)
label(30.5, 17, "DZIAŁKA DZIADKA (20x15)", 11, (40, 25, 10), bold=True)
rect(11, 20, 15, 23, (200, 180, 140), (90, 70, 40)); label(13, 21.5, "podwórko", 8)

# domy (chałupy ok. 6x5) z ogródkami
domy = [
    (27, 30, "tkaczka"), (34, 30, "wodziarz"), (52, 30, "woziwoda\nKuba"), (66, 30, "rodzina\nz dzieckiem"),
    (58, 33, "wdowa\nz kozą"), (70, 36, "kramarz\nstarzyzny"),
    (20, 48, "praczka"), (30, 48, "rybaczka"), (52, 46, "garncarz"), (62, 46, "drwal"),
    (8, 66, "znachorka"), (22, 66, "węglarz\n(mielerz)"), (48, 66, "kłusownik"), (66, 64, "garbarz\n(z dala)"),
]
for (x, y, name) in domy:
    rect(x, y, x + 5, y + 4, (176, 128, 80), (70, 45, 20), 2)
    rect(x, y + 5, x + 5, y + 6, (110, 132, 70))               # ogródek
    label(x + 3, y + 2.5, name, 9, (30, 20, 10))
# przytułek (większy)
rect(36, 46, 46, 52, (160, 112, 72), (60, 40, 20), 2); label(41, 49, "PRZYTUŁEK\n(siostra Klara)", 10, (30, 20, 10), bold=True)
label(47.5, 53.5, "Gaweł śpi\npod ścianą", 8, (60, 30, 30))
# kapliczka na skrzyżowaniu
rect(45, 39, 47, 40, (210, 200, 180), (90, 80, 60)); label(46, 37.8, "kapliczka", 8)
# szopa Wróbli, obóz uciekinierów (później)
rect(70, 10, 74, 14, (130, 100, 70), (60, 40, 20)); label(72, 12, "ruina\nszopy\n„Wróble”", 8)
rect(50, 12, 64, 22, (132, 150, 92), (90, 100, 60)); label(57, 17, "łąka: obóz uciekinierów\n(Rafał, Marek - później)", 9, (30, 40, 20))
# wyschnięta studnia i miejsce na nową w korycie
rect(30, 38, 31, 39, (90, 90, 90), (40, 40, 40)); label(30.5, 36.8, "wyschnięta studnia", 8)
rect(29, 57, 31, 59, (90, 110, 140), (40, 50, 70)); label(30, 61, "tu kopiemy studnię (zadanie)", 8, (30, 40, 60))
# wyjścia
label(2, 45, "◄ WYBRZEŻE", 12, (250, 240, 200), "lm", True)
label(78, 41, "MIASTECZKO ►", 12, (250, 240, 200), "rm", True)

# siatka co 10 kafli
for i in range(0, W + 1, 10):
    d.line([OX + i * S, OY, OX + i * S, OY + H * S], fill=(0, 0, 0), width=1)
    d.line([OX, OY + i * S, OX + W * S, OY + i * S], fill=(0, 0, 0), width=1)
    if i < W: d.text((OX + i * S + 2, OY + 2), str(i), fill=(0, 0, 0), font=font(9))

d.text((10, 10), "Podgrodzie 80x80 - szkic układu (nowy świat)", fill=(240, 230, 200), font=font(18, True))
leg = [
    "Plan z lotu ptaka, nie mapa gry.",
    "1 kratka siatki = 10 kafli.",
    "",
    "Droga: wybrzeże (zachód) - miasteczko (wschód).",
    "Suche koryto: spod miasta do morza (woda",
    "trzymana jazem Lorda).",
    "",
    "Dziadek: dom + działka 20x15 w płotku,",
    "północny zachód, spokojnie, blisko drogi.",
    "",
    "14 chałup z ogródkami + przytułek:",
    "tkaczka, wodziarz, woziwoda Kuba, rodzina",
    "z dzieckiem, wdowa z kozą, kramarz,",
    "praczka, rybaczka, garncarz, drwal,",
    "znachorka, węglarz, kłusownik, garbarz.",
    "",
    "Pniaki wszędzie: las dawno wycięty",
    "(drewno drogie, las należy do Lorda).",
    "",
    "Miejsca: kapliczka, wyschnięta studnia,",
    "miejsce na studnię w korycie (zadanie),",
    "łąka na obóz uciekinierów, ruina szopy",
    "dzieciaków „Wróble”.",
    "",
    "Brzegi mapy: zarośla i skały, przejścia",
    "tylko drogą (zachód, wschód).",
]
for i, t in enumerate(leg):
    d.text((W * S + 14, OY + 6 + i * 22), t, fill=(225, 220, 200), font=font(13))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT)
print(OUT)
