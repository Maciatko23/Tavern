# -*- coding: utf-8 -*-
"""NOWE PODGRODZIE (Map111) - szkic układu do akceptacji (2026-10-22).

Zlecenie użytkownika: „Podgrodzie też przebuduj podobnie jak mapę z tawerną”. Decyzje: niski płot z wikliny i drewniana
palisada wokół osady; na wschodnim brzegu mur miasta z drewnianą bramą (tam naprawdę jest miasto - po powiększeniu mur stał
w połowie mapy); nowe: garncarnia, szynk, przytułek, domy biedoty; wnętrza dla wszystkich nowych i dla 4 dotąd zamkniętych;
4 nowych mieszkańców. Zostają: chaty drwala, kłusownika, praczki, izba znachorki, kram starzyzny, dom uchodźców, Chata pod
lasem gracza z kupioną działką (region 8), przejście na zachód do Przystani (0,19) i na wschód do miasta (91,17-18).

Użycie: python tools/podgrodzie2/plan.py  ->  docs/podgrodzie/plan_nowe_podgrodzie.png
"""
import os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L

W, H = 92, 112
S = 10

KOLORY = {
    "mur": ((88, 92, 100), (40, 42, 48)),
    "palisada": ((120, 84, 50), (70, 46, 24)),
    "plac": ((214, 196, 160), (140, 112, 74)),
    "droga": ((176, 146, 104), None),
    "stary": ((214, 120, 74), (110, 50, 24)),
    "nowy": ((104, 170, 98), (34, 86, 34)),
    "zamk": ((226, 170, 70), (120, 80, 20)),     # był zamknięty, dostaje wnętrze
    "ogrod": ((132, 186, 110), (70, 120, 60)),
    "pole": ((228, 200, 110), (150, 120, 40)),
    "las": ((70, 120, 76), None),
    "studnia": ((150, 150, 160), (60, 60, 70)),
    "brama": ((60, 60, 66), (20, 20, 24)),
    "brud": ((150, 120, 90), (90, 70, 50)),
}

PAL = (3, 3, 85, 64)        # palisada (x0, y0, x1, y1)
BRAMY_PAL = [("W", 18, 20), ("S", 40, 42)]   # bramy w palisadzie (bok, od, do)

BLOKI = [
    ("mur", 88, 0, 91, 70, ""), ("brama", 88, 16, 91, 19, ""),
    ("droga", 0, 18, 87, 20, ""), ("droga", 40, 21, 42, 74, ""), ("droga", 4, 58, 84, 60, ""),
    ("droga", 22, 74, 42, 76, ""),
    ("plac", 36, 26, 54, 40, "PLACYK"),
    ("studnia", 44, 32, 45, 33, ""),
    # na północ od drogi
    ("stary", 5, 5, 14, 15, "Chata drwala\n+ drewutnia"),
    ("zamk", 17, 6, 23, 12, "Chata pod\nstrzechą"),
    ("stary", 27, 5, 35, 13, "Dom\nuchodźców"),
    ("ogrod", 37, 5, 45, 13, "namioty"),
    ("nowy", 48, 5, 60, 14, "PRZYTUŁEK"),
    ("ogrod", 62, 6, 74, 13, "Ogródki 1-3"),
    ("nowy", 76, 4, 85, 14, "SZYNK"),
    # na południe od drogi
    ("stary", 5, 24, 12, 31, "Chata\nkłusownika"),
    ("zamk", 15, 24, 22, 31, "Chałupa\nz desek"),
    ("stary", 24, 26, 33, 34, "Izba\nznachorki"),
    ("stary", 48, 27, 53, 31, "Kram"),
    ("stary", 57, 24, 66, 33, "Chata praczki\n+ pranie"),
    ("zamk", 69, 24, 74, 29, "Szopa"),
    ("zamk", 77, 24, 82, 29, "Komórka"),
    ("nowy", 5, 40, 11, 46, "Lepianka 1"),
    ("nowy", 14, 40, 20, 46, "Lepianka 2"),
    ("nowy", 24, 42, 31, 49, "Chata 3"),
    ("nowy", 5, 49, 11, 55, "Chata 4"),
    ("nowy", 14, 49, 20, 55, "Chata 5"),
    ("ogrod", 23, 51, 34, 56, "kurniki,\nchlewiki"),
    ("nowy", 45, 45, 55, 55, "GARNCARNIA"),
    ("ogrod", 58, 37, 70, 46, "wybieg\n(kury, kozy)"),
    ("ogrod", 72, 34, 84, 46, "zagroda"),
    ("ogrod", 58, 49, 84, 56, "ogródki biedoty"),
    # za palisadą
    ("brud", 68, 68, 80, 74, "Wysypisko"),
    ("brud", 45, 69, 53, 75, "Glinianka"),
    ("stary", 8, 74, 14, 80, "Chata\npod lasem"),
    ("pole", 16, 78, 36, 89, "Twoja działka\n(kupiona)"),
]
ZNAKI = {
    "kapliczka": ((240, 240, 240), [(37, 27)]),
    "dzieci": ((255, 150, 200), [(50, 37)]),
    "pranie": ((140, 200, 255), [(60, 35), (63, 35)]),
    "latarnia": ((250, 200, 60), [(86, 15), (86, 21), (44, 26), (3, 17)]),
    "ławka (kłoda)": ((120, 80, 40), [(40, 30), (49, 34), (40, 36)]),
}


def rysuj(out):
    img = Image.new("RGB", (W * S + 300, H * S + 40), (24, 22, 30))
    d = ImageDraw.Draw(img)
    ox, oy = 10, 30
    d.rectangle([ox, oy, ox + W * S - 1, oy + H * S - 1], fill=(112, 150, 92))
    d.rectangle([ox + (PAL[0]) * S, oy + PAL[1] * S, ox + (PAL[2] + 1) * S - 1, oy + (PAL[3] + 1) * S - 1], fill=(150, 176, 120))
    for (x0, y0, x1, y1) in [(0, 90, 91, 111), (0, 66, 6, 73), (82, 72, 87, 111), (56, 78, 66, 90)]:
        d.rectangle([ox + x0 * S, oy + y0 * S, ox + (x1 + 1) * S - 1, oy + (y1 + 1) * S - 1], fill=KOLORY["las"][0])
    f = L.font(12, True)
    fs = L.font(11)
    for (k, x0, y0, x1, y1, napis) in BLOKI:
        fill, line = KOLORY[k]
        d.rectangle([ox + x0 * S, oy + y0 * S, ox + (x1 + 1) * S - 1, oy + (y1 + 1) * S - 1], fill=fill, outline=line,
                    width=2 if line else 0)
    # palisada: obrys z przerwami na bramy
    x0, y0, x1, y1 = PAL
    pc = KOLORY["palisada"][1]
    def odc(xa, ya, xb, yb):
        d.line([(ox + xa * S, oy + ya * S), (ox + xb * S, oy + yb * S)], fill=pc, width=4)
    odc(x0, y0, x1 + 1, y0)
    odc(x0, y0, x0, 18); odc(x0, 21, x0, y1 + 1)
    odc(x0, y1 + 1, 40, y1 + 1); odc(43, y1 + 1, x1 + 1, y1 + 1)
    odc(x1 + 1, y0, x1 + 1, 18); odc(x1 + 1, 21, x1 + 1, y1 + 1)
    for x in range(0, W + 1, 10):
        d.line([(ox + x * S, oy), (ox + x * S, oy + H * S)], fill=(0, 0, 0), width=1)
        d.text((ox + x * S + 2, oy - 14), str(x), fill=(230, 230, 120), font=fs)
    for y in range(0, H + 1, 10):
        d.line([(ox, oy + y * S), (ox + W * S, oy + y * S)], fill=(0, 0, 0), width=1)
        d.text((ox + W * S + 4, oy + y * S - 6), str(y), fill=(230, 230, 120), font=fs)
    for k, (col, pts) in ZNAKI.items():
        for (x, y) in pts:
            cx, cy = ox + x * S + S // 2, oy + y * S + S // 2
            d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=col, outline=(0, 0, 0))
    for (k, bx0, by0, bx1, by1, napis) in BLOKI:
        if not napis: continue
        cx, cy = ox + (bx0 + bx1 + 1) * S // 2, oy + (by0 + by1 + 1) * S // 2
        lines = napis.split("\n")
        for i, ln in enumerate(lines):
            tw = d.textlength(ln, font=f)
            ty = cy - len(lines) * 7 + i * 14
            d.text((cx - tw / 2 + 1, ty + 1), ln, fill=(0, 0, 0), font=f)
            d.text((cx - tw / 2, ty), ln, fill=(255, 255, 255), font=f)
    d.text((ox + 1 * S, oy + 19 * S - 4), "<- Przystań", fill=(255, 255, 255), font=f)
    d.text((ox + 73 * S, oy + 21 * S + 2), "miasto ->", fill=(255, 255, 255), font=f)
    t = L.font(15, True)
    d.text((ox, 6), "Plan nowego Podgrodzia (Map111, 92x112) - szkic do akceptacji", fill=(255, 230, 120), font=t)
    lx, ly = ox + W * S + 34, oy + 10
    leg = [("stary", "budynek przeniesiony (ma wnętrze)"), ("zamk", "był zamknięty - dostaje wnętrze"),
           ("nowy", "nowy budynek (nowe wnętrze)"), ("plac", "placyk"), ("droga", "droga"), ("ogrod", "zieleń, ogródki"),
           ("brud", "wysypisko / glinianka"), ("pole", "działka gracza"), ("mur", "mur miasta"), ("brama", "brama")]
    for k, txt in leg:
        fill, line = KOLORY[k]
        d.rectangle([lx, ly, lx + 16, ly + 12], fill=fill, outline=line or (0, 0, 0))
        d.text((lx + 22, ly - 1), txt, fill=(235, 235, 235), font=fs)
        ly += 22
    d.line([(lx, ly + 6), (lx + 16, ly + 6)], fill=KOLORY["palisada"][1], width=4)
    d.text((lx + 22, ly - 1), "palisada / płot z wikliny", fill=(235, 235, 235), font=fs)
    ly += 26
    for k, (col, _) in ZNAKI.items():
        d.ellipse([lx + 4, ly + 2, lx + 12, ly + 10], fill=col, outline=(0, 0, 0))
        d.text((lx + 22, ly - 1), k, fill=(235, 235, 235), font=fs)
        ly += 18
    ly += 14
    notki = ["Mur miasta z drewnianą bramą", "na WSCHODNIM brzegu (tam jest", "miasto); przejście do miasta", "bez zmian (91,17-18).", "",
             "Droga przez całą osadę:", "brama miasta -> brama zachodnia", "w palisadzie -> Przystań.", "",
             "Placyk: sucha studnia,", "kapliczka, kram, zabawa dzieci.", "",
             "Wnętrza (12): szynk, przytułek,", "garncarnia, lepianki 1-2,", "chaty 3-5 i 4 dotąd zamknięte.", "",
             "Nowi mieszkańcy (4): garncarz,", "szynkarz, opiekunka przytułku,", "dziecko biedoty.", "",
             "Chata pod lasem i Twoja", "działka: za palisadą, przy lesie."]
    for n in notki:
        d.text((lx, ly), n, fill=(210, 210, 210), font=fs)
        ly += 14
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out)
    return out


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    print(rysuj(os.path.join(ROOT, "docs", "podgrodzie", "plan_nowe_podgrodzie.png")))
