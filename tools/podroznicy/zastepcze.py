# -*- coding: utf-8 -*-
"""Zastępcze arkusze i popiersia podróżnych z promu (docs/PODROZNI.md 7.4) - 0 generacji PixelLab.

python tools/podroznicy/zastepcze.py            -> img/characters/$Npc_<Klucz>.png + img/pictures/<Klucz>_Bust.png
python tools/podroznicy/zastepcze.py --podglad  -> tylko podgląd (stykówka) w katalogu tymczasowym systemu

Każda postać obsady i każde ciało puli to istniejący mieszkaniec (arkusz 3x4 klatki 64x64 + jego popiersie) przekolorowany
regułą: barwy ubrania (piksele nasycone, poza skórą twarzy i dłoni) obracane / przyciemniane / szarzone. Te same reguły na
popiersiu, więc popiersie pasuje do sprite'a. Pliki mają już nazwy docelowe: grafika z PixelLab wejdzie później podmianą pliku
(tools/npc/build_npc.py) - kod gry nic nie zmienia.
Głowa (górne HEAD_ROWS wierszy każdej klatki, górne BUST_HEAD popiersia): skóra zostaje, włosy / broda tylko wg `wlosy`.
"""
import os, sys, colorsys, tempfile
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
PICS = os.path.join(ROOT, "img", "pictures")
C = 64
HEAD_ROWS = 30          # wiersze klatki z głową (skóra twarzy zostaje)
BUST_HEAD = 0.55        # część wysokości popiersia z głową

# klucz -> (baza, reguła). Reguła: hue = docelowa barwa ubrania (stopnie) albo None (bez zmiany), sat / val - mnożniki,
# hair = (hue, sat, val) albo None - włosy i broda (brązy / czernie w głowie), keep = barwy (zakres stopni) zostawione w spokoju
POSTACIE = {
    # ---- obsada (14 + Ksenia, „gość spod trójki”)
    "Poborca":    ("Celnik",     dict(hue=230, sat=0.20, val=0.32)),                 # czarny kubrak
    "Pielgrzym":  ("Grabarz",    dict(hue=38, sat=0.30, val=1.25)),                  # habit z niebarwionej wełny
    "Posel":      ("Lord",       dict(hue=28, sat=0.95, val=1.20)),                  # biel i pomarańcz Korony
    "Gwardzista": ("Straznik",   dict(hue=30, sat=0.90, val=1.10)),                  # pomarańczowy feniks na bieli
    "Ksenia":     ("Szwaczka",   dict(hue=150, sat=0.70, val=0.62)),                 # ciemnozielona suknia
    "Trojka":     ("Woznica",    dict(hue=230, sat=0.10, val=0.30)),                 # człowiek w czerni
    # ---- Wolna Kompania (szare płaszcze najemników)
    "Kompania_1": ("Grum",       dict(hue=210, sat=0.18, val=0.80)),                 # Hubert Szary
    "Kompania_2": ("Drwal",      dict(hue=210, sat=0.22, val=0.70)),                 # Jasiek Brzytwa
    "Kompania_3": ("Weteran",    dict(hue=200, sat=0.25, val=0.75)),                 # Kazik Kołek
    "Kompania_4": ("Praczka",    dict(hue=210, sat=0.20, val=0.70, hair=(12, 0.95, 1.05))),   # Ruda Hela
    # ---- ciała puli: mężczyzna w płaszczu, kobieta w chuście, starzec z laską, marynarz - po kilka kolorów
}
# Halina nie ma popiersia - ciało kobiety bierze popiersie Praczki (ta sama chusta)
BUST_OF = {"Halina": "Praczka"}


def skin(h, s, v):
    """skóra twarzy i dłoni: ciepła barwa, średnie nasycenie, jasna"""
    return 5 <= h <= 38 and 0.18 <= s <= 0.62 and v >= 0.45


def hairy(h, s, v):
    """włosy / broda w głowie: brązy i czernie (ciemne albo mało nasycone)"""
    return (v < 0.42) or (8 <= h <= 45 and s > 0.35 and v < 0.62)


def shift(p, head, rule):
    r, g, b, a = p
    if not a:
        return p
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hd = h * 360
    if head:
        if skin(hd, s, v):
            return p
        if hairy(hd, s, v):
            if not rule.get("hair"):
                return p   # (włosy i broda zostają)
            hh, hs, hv = rule["hair"]
            h2, s2, v2 = hh / 360, min(1, s * hs + (0.25 * hs if hs > 0.9 else 0)), min(1, v * hv)
            rr, gg, bb = colorsys.hsv_to_rgb(h2, s2, v2)
            return (int(round(rr * 255)), int(round(gg * 255)), int(round(bb * 255)), a)
        if s < 0.30 or v < 0.20:
            return p   # (oczy, kontur, cienie głowy)
    elif skin(hd, s, v) and v > 0.62:
        return p       # (dłonie)
    if v < 0.10:
        return p       # (kontur)
    if rule.get("keep") and rule["keep"][0] <= hd <= rule["keep"][1] and s > 0.2:
        return p       # (barwy zostawione: brązy brody i pasa marynarza)
    if rule.get("rot"):
        h2 = ((hd + rule["hue"]) % 360) / 360
    else:
        h2 = rule["hue"] / 360 if rule.get("hue") is not None and s > 0.08 else h
    s2 = min(1.0, s * rule.get("sat", 1.0))
    v2 = min(1.0, v * rule.get("val", 1.0))
    rr, gg, bb = colorsys.hsv_to_rgb(h2, s2, v2)
    return (int(round(rr * 255)), int(round(gg * 255)), int(round(bb * 255)), a)


def recolor_sheet(src, rule):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    rows = rule.get("head", HEAD_ROWS)
    for y in range(im.height):
        head = (y % C) < rows
        for x in range(im.width):
            px[x, y] = shift(px[x, y], head, rule)
    return im


def recolor_bust(src, rule):
    im = Image.open(src).convert("RGBA")
    px, cut = im.load(), int(im.height * BUST_HEAD)
    for y in range(im.height):
        for x in range(im.width):
            px[x, y] = shift(px[x, y], y < cut, rule)
    return im


def main():
    preview = "--podglad" in sys.argv
    out_dir = tempfile.mkdtemp(prefix="podroznicy_") if preview else None
    sheet = Image.new("RGBA", (len(POSTACIE) * 150, 240), (54, 54, 64, 255))
    d = ImageDraw.Draw(sheet)
    for i, (key, (base, rule)) in enumerate(POSTACIE.items()):
        im = recolor_sheet(os.path.join(CH, "$Npc_" + base + ".png"), rule)
        bust_base = BUST_OF.get(base, base)
        bust = recolor_bust(os.path.join(PICS, bust_base + "_Bust.png"), rule)
        if preview:
            im.save(os.path.join(out_dir, "$Npc_" + key + ".png"))
            bust.save(os.path.join(out_dir, key + "_Bust.png"))
        else:
            im.save(os.path.join(CH, "$Npc_" + key + ".png"))
            bust.save(os.path.join(PICS, key + "_Bust.png"))
        fr = im.crop((64, 0, 128, 64)).resize((96, 96), Image.NEAREST)
        sheet.alpha_composite(fr, (i * 150 + 4, 4))
        bt = bust.copy()
        bt.thumbnail((100, 120))
        sheet.alpha_composite(bt, (i * 150 + 4, 104))
        d.text((i * 150 + 4, 226), key, fill=(255, 255, 255, 255))
    where = out_dir or tempfile.gettempdir()
    sheet.save(os.path.join(where, "podroznicy_zastepcze.png"))
    print("zapisano", len(POSTACIE), "postaci" + (" (podgląd: " + where + ")" if preview else ""), "- stykówka:", os.path.join(where, "podroznicy_zastepcze.png"))


if __name__ == "__main__":
    main()
