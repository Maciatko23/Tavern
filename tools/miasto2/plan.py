# -*- coding: utf-8 -*-
"""NOWE MIASTO (Map008) - szkic układu do akceptacji (2026-10-22).

Zlecenie użytkownika: miasto na całej szerokości powiększonej mapy, w murach (góra ~104x95), na środku wielki plac
handlowy ze studnią, tawerna na tarasie zamkowym nad placem (szerokie schody na plac), budynki rozproszone, łatwo do nich
dojść; nowe: kaplica (z cmentarzem), stajnia z wozownią, strażnica Lorda, domy mieszkalne (wszystkie z wnętrzami);
za murem na południu pola mieszczan, szubienica, droga na Polną drogę.

Użycie: python tools/miasto2/plan.py  ->  docs/miasteczko/plan_nowe_miasto.png
Współrzędne bloków (kratki, włącznie) są też planem budowy: build.py czyta BLOKI stąd.
"""
import os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L

W, H = 104, 138
MUR_POLUDNIE = (93, 99)          # południowy mur (rzędy), brama w kolumnach 50-53
S = 10                           # px na kratkę

# rodzaj -> (wypełnienie, obrys)
KOLORY = {
    "mur": ((88, 92, 100), (40, 42, 48)),
    "taras": ((196, 190, 176), (120, 112, 96)),
    "plac": ((226, 214, 186), (150, 130, 96)),
    "ulica": ((176, 168, 156), None),
    "stary": ((214, 120, 74), (110, 50, 24)),        # budynek przeniesiony z obecnej mapy
    "nowy": ((104, 170, 98), (34, 86, 34)),          # nowy budynek (z wnętrzem)
    "ogrod": ((132, 186, 110), (70, 120, 60)),
    "pole": ((228, 200, 110), (150, 120, 40)),
    "las": ((70, 120, 76), None),
    "droga": ((170, 140, 100), None),
    "studnia": ((90, 140, 200), (30, 60, 110)),
    "brama": ((60, 60, 66), (20, 20, 24)),
}

# (rodzaj, x0, y0, x1, y1, napis)
BLOKI = [
    # -- mury
    ("mur", 0, 0, 103, 1, ""), ("mur", 0, 0, 1, 99, ""), ("mur", 102, 0, 103, 99, ""),
    ("mur", 0, MUR_POLUDNIE[0], 49, MUR_POLUDNIE[1], ""), ("mur", 54, MUR_POLUDNIE[0], 103, MUR_POLUDNIE[1], ""),
    ("brama", 0, 50, 1, 51, ""), ("brama", 102, 50, 103, 51, ""), ("brama", 50, 93, 53, 99, ""),
    # -- ulice
    ("ulica", 2, 49, 29, 52, ""), ("ulica", 74, 49, 101, 52, ""), ("ulica", 49, 64, 54, 92, ""),
    ("ulica", 2, 33, 25, 35, ""), ("ulica", 78, 33, 101, 35, ""), ("ulica", 2, 75, 101, 77, ""),
    ("ulica", 26, 2, 27, 92, ""), ("ulica", 76, 2, 77, 92, ""),
    # -- taras zamkowy z tawerną
    ("taras", 28, 2, 75, 36, ""),
    ("ogrod", 29, 4, 37, 19, "Ogród\nrycerzy"),
    ("stary", 38, 3, 64, 19, "TAWERNA (hala)"),
    ("ogrod", 66, 5, 74, 19, "Ogródek\npiwny"),
    ("mur", 28, 26, 75, 32, "mur zamku z wieżami"),
    ("taras", 49, 26, 54, 36, "schody"),
    ("stary", 36, 31, 42, 36, "Izba pod\nskałą"),
    # -- plac
    ("plac", 30, 37, 73, 63, ""),
    ("studnia", 51, 49, 52, 51, ""),
    # -- wokół placu
    ("stary", 16, 37, 25, 46, "Kantor"),
    ("stary", 18, 54, 25, 62, "Dom\nmieszczan"),
    ("stary", 78, 37, 87, 47, "Ratusz"),
    ("stary", 79, 26, 82, 32, "Dzwon-\nnica"),
    ("stary", 33, 65, 40, 74, "Piekarnia"),
    ("stary", 57, 65, 64, 74, "Dom\nwoziwody"),
    # -- przy bramie zachodniej (Podgrodzie)
    ("stary", 3, 53, 15, 63, "Kuźnia +\nwarsztat"),
    ("stary", 3, 79, 21, 90, "Garbarnia +\nsuszarnia skór"),
    # -- przy bramie wschodniej (Lord)
    ("nowy", 89, 37, 100, 47, "Strażnica\nLorda"),
    # -- północny zachód: kaplica i cmentarz
    ("nowy", 4, 4, 15, 16, "KAPLICA"),
    ("ogrod", 3, 19, 21, 30, "Cmentarz\n(przeniesiony)"),
    ("nowy", 17, 5, 23, 12, "Dom\ngrabarza"),
    # -- północny wschód
    ("ogrod", 82, 3, 97, 17, "Dawny staw\n(suchy)"),
    ("nowy", 80, 19, 88, 25, "Dom 1"),
    ("nowy", 92, 19, 100, 30, "Dom 2"),
    # -- domy mieszkalne
    ("nowy", 3, 37, 13, 46, "Dom 3"),
    ("nowy", 80, 54, 89, 63, "Dom 4"),
    ("nowy", 92, 54, 100, 63, "Dom 5"),
    ("nowy", 28, 79, 36, 88, "Dom 6"),
    ("nowy", 40, 79, 47, 88, "Dom 7"),
    ("nowy", 80, 79, 89, 89, "Dom 8"),
    ("nowy", 91, 79, 100, 90, "Dom 9"),
    ("nowy", 57, 79, 74, 91, "Stajnia\nz wozownią"),
    ("ogrod", 66, 65, 74, 73, "Skwer"),
    ("ogrod", 92, 66, 100, 73, ""),
    ("ogrod", 3, 66, 24, 73, "Ogrody"),
    # -- za murem
    ("droga", 50, 100, 53, 112, ""), ("droga", 25, 112, 53, 115, ""), ("droga", 24, 115, 27, 137, ""),
    ("pole", 6, 102, 22, 110, "Pole 1"), ("pole", 30, 117, 46, 125, "Pole 2"), ("pole", 58, 102, 76, 110, "Pole 3"),
    ("ogrod", 84, 118, 92, 126, "Szubienica\n(wzgórze)"),
]
# rzeczy na placu (małe znaczki): ławki, krzaki, drzewa, stragany, latarnie, tablica
PLAC = {
    "ławka": [(46, 47), (57, 47), (46, 53), (57, 53), (40, 42), (63, 42), (40, 58), (63, 58)],
    "krzak": [(44, 45), (59, 45), (44, 55), (59, 55), (33, 40), (70, 40), (33, 60), (70, 60)],
    "drzewo": [(37, 50), (66, 50), (51, 41), (51, 59)],
    "stragan": [(33, 44), (33, 54), (68, 44), (68, 54), (40, 61), (61, 61)],
    "latarnia": [(48, 48), (55, 48), (48, 52), (55, 52), (31, 38), (72, 38), (31, 62), (72, 62)],
    "tablica": [(47, 37)],
}
ZNAK = {"ławka": (120, 80, 40), "krzak": (60, 130, 50), "drzewo": (30, 90, 40), "stragan": (200, 60, 60),
        "latarnia": (250, 200, 60), "tablica": (110, 70, 30)}


def rysuj(out):
    img = Image.new("RGB", (W * S + 300, H * S + 40), (24, 22, 30))
    d = ImageDraw.Draw(img)
    ox, oy = 10, 30
    # tło: w murach trawa/bruk, za murem łąka z lasem
    d.rectangle([ox, oy, ox + W * S - 1, oy + 100 * S - 1], fill=(150, 176, 120))
    d.rectangle([ox, oy + 100 * S, ox + W * S - 1, oy + H * S - 1], fill=(112, 150, 92))
    for (x0, y0, x1, y1) in [(0, 100, 20, 137), (60, 128, 103, 137), (96, 100, 103, 128), (30, 128, 50, 137)]:
        d.rectangle([ox + x0 * S, oy + y0 * S, ox + (x1 + 1) * S - 1, oy + (y1 + 1) * S - 1], fill=KOLORY["las"][0])
    f = L.font(12, True)
    fs = L.font(11)
    for (k, x0, y0, x1, y1, napis) in BLOKI:
        fill, line = KOLORY[k]
        d.rectangle([ox + x0 * S, oy + y0 * S, ox + (x1 + 1) * S - 1, oy + (y1 + 1) * S - 1], fill=fill, outline=line,
                    width=2 if line else 0)
    # siatka co 10 kratek
    for x in range(0, W + 1, 10):
        d.line([(ox + x * S, oy), (ox + x * S, oy + H * S)], fill=(0, 0, 0), width=1)
        d.text((ox + x * S + 2, oy - 14), str(x), fill=(230, 230, 120), font=fs)
    for y in range(0, H + 1, 10):
        d.line([(ox, oy + y * S), (ox + W * S, oy + y * S)], fill=(0, 0, 0), width=1)
        d.text((ox + W * S + 4, oy + y * S - 6), str(y), fill=(230, 230, 120), font=fs)
    for k, pts in PLAC.items():
        for (x, y) in pts:
            cx, cy = ox + x * S + S // 2, oy + y * S + S // 2
            d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=ZNAK[k], outline=(0, 0, 0))
    for (k, x0, y0, x1, y1, napis) in BLOKI:
        if not napis: continue
        cx, cy = ox + (x0 + x1 + 1) * S // 2, oy + (y0 + y1 + 1) * S // 2
        lines = napis.split("\n")
        for i, ln in enumerate(lines):
            tw = d.textlength(ln, font=f)
            ty = cy - len(lines) * 7 + i * 14
            d.text((cx - tw / 2 + 1, ty + 1), ln, fill=(0, 0, 0), font=f)
            d.text((cx - tw / 2, ty), ln, fill=(255, 255, 255), font=f)
    # opisy na marginesie
    t = L.font(15, True)
    d.text((ox, 6), "Plan nowego miasta (Map008, 104x138) - szkic do akceptacji", fill=(255, 230, 120), font=t)
    lx, ly = ox + W * S + 34, oy + 10
    leg = [("stary", "budynek przeniesiony (stare wnętrze)"), ("nowy", "nowy budynek (nowe wnętrze)"),
           ("taras", "taras zamkowy"), ("plac", "plac handlowy"), ("ulica", "ulica / bruk"), ("ogrod", "zieleń"),
           ("pole", "pola mieszczan"), ("mur", "mury"), ("brama", "brama"), ("studnia", "studnia")]
    for k, txt in leg:
        fill, line = KOLORY[k]
        d.rectangle([lx, ly, lx + 16, ly + 12], fill=fill, outline=line or (0, 0, 0))
        for i, part in enumerate(_zawin(txt, 26)):
            d.text((lx + 22, ly - 1 + i * 13), part, fill=(235, 235, 235), font=fs)
        ly += 32
    ly += 6
    for k, col in ZNAK.items():
        d.ellipse([lx + 4, ly + 2, lx + 12, ly + 10], fill=col, outline=(0, 0, 0))
        d.text((lx + 22, ly - 1), k, fill=(235, 235, 235), font=fs)
        ly += 18
    ly += 14
    notki = ["Bramy na tych samych", "miejscach: zachód -> Podgrodzie,", "wschód -> posiadłość Lorda.",
             "Południowa brama na osi placu;", "droga za nią skręca do starego", "wyjścia na Polną drogę.", "",
             "Tawerna, ogród rycerzy, mur", "z wieżami i schody: przeniesione", "kafelek w kafelek (z poprawkami).", "",
             "Przechodnie: 6-8 nowych postaci", "= mieszkańcy nowych domów.", "",
             "Wnętrza nowe: kaplica, stajnia,", "strażnica, dom grabarza,", "domy 1-9 (razem 13)."]
    for n in notki:
        d.text((lx, ly), n, fill=(210, 210, 210), font=fs)
        ly += 14
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out)
    return out


def _zawin(txt, n):
    out, cur = [], ""
    for w in txt.split():
        if len(cur) + len(w) + 1 > n:
            out.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur: out.append(cur)
    return out


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    print(rysuj(os.path.join(ROOT, "docs", "miasteczko", "plan_nowe_miasto.png")))
