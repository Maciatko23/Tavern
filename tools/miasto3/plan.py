# -*- coding: utf-8 -*-
"""Plan nowego Kruczogrodu (do zatwierdzenia przez gracza, nic w grze): na zdjęciu obecnego miasta - dzielnice, główny trakt (bruk),
uliczki (ubita ziemia, kręte), budynki z ich drzwiami (adresy zostają), przeprowadzka stajni do zajazdu przy tawernie.
  python tools/miasto3/plan.py <zdjęcie miasta 10 px na kratkę> <wyjście.png>"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
P = 10
F = lambda s, b=False: ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSans-Bold.ttf" if b else "AlegreyaSans-Medium.ttf"), s)

# districts: name, colour, polygon (cells)
DZIELNICE = [
    ("Wzgórze zamkowe: tawerna i zajazd", (230, 170, 60), [(30, 1), (80, 1), (80, 29), (30, 29)]),
    ("Kaplica i cmentarz", (150, 150, 220), [(2, 1), (29, 1), (29, 30), (2, 30)]),
    ("Dzielnica Lorda", (210, 80, 80), [(81, 1), (117, 1), (117, 44), (81, 44)]),
    ("Rynek", (240, 230, 120), [(34, 33), (74, 33), (74, 64), (34, 64)]),
    ("Ulica rzemieślników", (200, 120, 60), [(2, 31), (33, 31), (33, 70), (2, 70)]),
    ("Ratusz i strażnica", (210, 80, 80), [(75, 45), (117, 45), (117, 70), (75, 70)]),
    ("Uliczki mieszkalne", (110, 190, 110), [(2, 71), (117, 71), (117, 99), (2, 99)]),
    ("Błonia, ogrody i pastwisko (w murach)", (160, 140, 90), [(2, 100), (117, 100), (117, 117), (2, 117)]),
]
# the main road (cobbles): gates -> square -> castle stairs -> tavern
TRAKT = [[(0, 50), (20, 51), (36, 50), (51, 50), (72, 50), (100, 50), (119, 49)],
         [(31, 119), (36, 104), (48, 94), (52, 80), (51, 63), (51, 50), (51, 30), (51, 17)],
         [(0, 106), (14, 104), (31, 108)],
         [(78, 14), (98, 12), (119, 11)],
         [(26, 0), (26, 12), (33, 18), (44, 22), (51, 22)]]
# the lanes (earth, winding)
ULICZKI = [[(8, 30), (12, 40), (9, 52), (13, 62), (10, 75), (7, 88)],
           [(20, 33), (24, 45), (21, 58), (26, 72), (33, 86)],
           [(36, 72), (44, 76), (52, 74), (60, 76), (70, 73), (80, 76), (95, 75)],
           [(30, 88), (40, 90), (48, 88), (60, 91), (72, 88), (85, 90), (96, 88)],
           [(84, 14), (88, 22), (85, 31), (90, 40), (85, 48)],
           [(84, 52), (88, 58), (84, 64), (95, 64)]]
# the buildings at their doors (x, y): the name; "*" moved
BUDYNKI = [
    (51, 16, "Tawerna (zajazd)"), (70, 14, "*Stajnia i wozownia"), (8, 16, "Kaplica"), (20, 12, "Dom grabarza"), (33, 12, "Płyta / archiwum"),
    (85, 12, "Dom 1"), (96, 28, "Kamienica"), (85, 31, "Dzwonnica"), (36, 38, "Dom mieszczan"), (39, 37, "Izba pod skałą"), (21, 33, "Dom 15"),
    (14, 47, "Kantor"), (7, 48, "Szwaczka"), (13, 60, "Kowal"), (85, 48, "Ratusz"), (98, 47, "Strażnica Lorda"), (84, 63, "Dom Haliny"),
    (95, 62, "Dom kupca"), (52, 49, "Studnia"), (38, 72, "Piekarnia"), (31, 73, "Dom 10"), (45, 73, "Dom 11"), (59, 73, "Woziwoda"),
    (79, 74, "Dom 13"), (33, 86, "Cieśla"), (42, 87, "Staruszkowie"), (45, 87, "Dom 12"), (61, 87, "Szopa woźniców"), (78, 88, "Dom 14"),
    (84, 88, "Weteran"), (95, 88, "Izba do wynajęcia"), (6, 88, "Garbarz"), (15, 85, "Garbarnia"),
]


LABEL_AT = {"Staruszkowie": (-60, 18), "Dom 12": (18, 18), "Dom 14": (-50, 18), "Dom mieszczan": (-60, 18), "Izba pod skałą": (18, -20),
            "Garbarnia": (18, -20), "Dom 10": (-50, 18), "Piekarnia": (8, -24)}


# the town wall on the map's edges, its gates where the neighbours' roads come in: (side, from, to, name)
BRAMY = [("N", 25, 27, "Brama Dworska"), ("W", 50, 51, "Brama Zachodnia"), ("W", 104, 107, "Brama Rybacka"), ("E", 10, 12, "Brama Wschodnia"),
         ("E", 48, 50, "Brama Łąkowa"), ("S", 30, 32, "Brama Południowa")]


def main(src, out):
    base = Image.open(src).convert("RGB")
    base = Image.eval(base, lambda v: int(v * 0.55))
    im = base.convert("RGBA")
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for name, col, poly in DZIELNICE:
        d.polygon([(x * P, y * P) for x, y in poly], fill=col + (46,), outline=col + (200,))
    im.alpha_composite(ov)
    d = ImageDraw.Draw(im)
    for line in ULICZKI: d.line([(x * P + 5, y * P + 5) for x, y in line], fill=(176, 130, 80, 255), width=22, joint="curve")
    for line in TRAKT: d.line([(x * P + 5, y * P + 5) for x, y in line], fill=(196, 196, 186, 255), width=30, joint="curve")
    # the wall on the edges and its gates
    W2 = 120 * P
    for side in "NWES":
        if side == "N": d.rectangle([0, 0, W2, 12], fill=(70, 70, 76, 255))
        if side == "S": d.rectangle([0, W2 - 12, W2, W2], fill=(70, 70, 76, 255))
        if side == "W": d.rectangle([0, 0, 12, W2], fill=(70, 70, 76, 255))
        if side == "E": d.rectangle([W2 - 12, 0, W2, W2], fill=(70, 70, 76, 255))
    for side, a, b, nm in BRAMY:
        if side in "NS":
            y = 0 if side == "N" else W2 - 12
            d.rectangle([a * P, y, (b + 1) * P, y + 12], fill=(196, 196, 186, 255))
            d.text(((b + 1) * P + 30, y + (16 if side == "N" else -26)), nm, font=F(18, True), fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(10, 10, 12, 255))
        else:
            x = 0 if side == "W" else W2 - 12
            d.rectangle([x, a * P, x + 12, (b + 1) * P], fill=(196, 196, 186, 255))
            tw = d.textlength(nm, font=F(18, True))
            d.text((x + 16 if side == "W" else x - 6 - tw, (b + 1) * P + 4), nm, font=F(18, True), fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(10, 10, 12, 255))
    for name, col, poly in DZIELNICE:
        x0, y0 = poly[0]
        d.text((x0 * P + 8, y0 * P + 6), name, font=F(22, True), fill=col + (255,), stroke_width=3, stroke_fill=(10, 10, 12, 255))
    for x, y, nm in BUDYNKI:
        moved = nm.startswith("*")
        c = (255, 210, 63, 255) if moved else (240, 240, 244, 255)
        d.rectangle([x * P - 4, y * P - 4, x * P + 14, y * P + 14], fill=c, outline=(10, 10, 12, 255), width=2)
        ox, oy = LABEL_AT.get(nm.lstrip("*"), (18, -4))   # (the label's place by the door: neighbours' names apart)
        d.text((x * P + ox, y * P + oy), nm.lstrip("*"), font=F(17), fill=c, stroke_width=3, stroke_fill=(10, 10, 12, 255))
    # the stable's move: its old place (61,87) -> the inn's yard (70,14)
    d.line([(61 * P, 85 * P), (64 * P, 40 * P), (70 * P, 17 * P)], fill=(255, 210, 63, 255), width=4)
    d.polygon([(70 * P - 10, 19 * P), (70 * P + 10, 19 * P), (70 * P, 16 * P)], fill=(255, 210, 63, 255))
    leg = ["PLAN KRUCZOGRODU (styl Fantastic Buildings: Medieval)",
           "jasny pas - trakt brukowany: bramy -> rynek -> schody zamkowe -> tawerna",
           "brązowe - uliczki z ubitej ziemi, kręte",
           "białe kwadraty - drzwi budynków (zostają na swoich miejscach: wnętrza, mieszkańcy i zadania działają)",
           "żółte - przeprowadzka: stajnia z wozownią na podwórze zajazdu przy tawernie",
           "mur na krawędziach mapy, bramy tam, gdzie dochodzą drogi sąsiednich map; stary mur wschodni i południowy znika",
           "na sąsiednich mapach (dwór, Łąka, Kruczy Jar, Podgrodzie) ten sam mur przy krawędzi, brama w tym samym miejscu, droga do bramy"]
    full = Image.new("RGB", (im.width, im.height + 26 * len(leg) + 24), (14, 15, 18))
    full.paste(im.convert("RGB"), (0, 0))
    d2 = ImageDraw.Draw(full)
    for i, t in enumerate(leg): d2.text((18, im.height + 12 + i * 26), t, font=F(20, i == 0), fill=(240, 240, 244))
    full.save(out)
    print(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
