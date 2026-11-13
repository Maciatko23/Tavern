# -*- coding: utf-8 -*-
"""Pary z gry (lewo przed, prawo po, pasek z podpisem) -> docs/audyt_map/poprawki/krok4/Map162/ + zestawienie_gra.png.
Wejscie: tools/poprawki_krok4/garnizon/tmp/zdjecia/{before,after}/<miejsce>.png (gra_test.js)"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "docs", "audyt_map", "poprawki", "krok4", "Map162"); os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(HERE, "tmp", "zdjecia")
try: F = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
except Exception: F = ImageFont.load_default()
NAMES = {
    "01_droga_i_brama_poludniowa": "Garnizon 1: droga przez dziedziniec dochodzi do poludniowej palisady i wychodzi bramą (slupy bramne)",
    "02_brama_polnocna": "Garnizon 2: wylom w polnocnej palisadzie = brama ze slupami, droga wychodzi na zewnatrz",
    "03_kamienny_budynek": "Garnizon 3: kamienny budynek - oderwany pasek bluszczu zdjety",
    "04_woz_i_beczki": "Garnizon 4: urwane kafle wozu i worki zdjete, zostaje caly stos beczek i stos drewna",
    "05_06_dom_z_czerwonym_dachem": "Garnizon 5+6: dom z czerwonym dachem przebudowany z kafli, plasko z gory, bez zerdzi za dachem",
    "07_oboz_namiotowy": "Garnizon 7: oboz - namioty w rownym rzedzie, ognisko, rozrzucone drobiazgi zdjete",
    "08_manekiny_i_tarcze": "Garnizon 8: manekiny i tarcze w jednej osi, symetrycznie do osi placu (x=52)",
    "09_choinka_przy_kamiennym": "Garnizon 9: choinka z gwiazdka przy kamiennym budynku zdjeta (bohater juz nie wchodzi pod nia)",
    "10_zerdz_w_obozie": "Garnizon 10: zerdz ze slomą i gwiazdka w obozie zdjeta, w to miejsce ognisko",
    "11_zatoka": "Garnizon 11: prostokatna zatoczka w morzu zlana z morzem",
    "13_place_bruku": "Garnizon 13: dwa samotne place bruku usuniete (razem z petlami gruntu pod nimi)",
    "16_sciezka_poludniowa": "Garnizon 16: sciezka poludniowa - jedna rowna szerokosc, wchodzi w pole na gorze, bez przewezenia",
    "17a_petle_gruntu": "Garnizon 17: cienkie zielone petle wokol wysepek gruntu - wysepki zlane z gruntem",
    "17b_petla_gruntu": "Garnizon 17: cienka zielona petla - wysepka zlana z gruntem",
}
def pair(a, b, title):
    w = a.width * 2 + 6
    im = Image.new("RGB", (w, a.height + 30), (255, 255, 255)); d = ImageDraw.Draw(im); d.rectangle([0, 0, w, 29], fill=(24, 22, 30))
    d.text((8, 5), "%s   |   LEWO: przed   PRAWO: po" % title, font=F, fill=(255, 220, 90))
    im.paste(a, (0, 30)); im.paste(b, (a.width + 6, 30)); return im
sheet = []
for key, title in NAMES.items():
    pa, pb = os.path.join(SRC, "before", key + ".png"), os.path.join(SRC, "after", key + ".png")
    if not (os.path.exists(pa) and os.path.exists(pb)): print("brak", key); continue
    im = pair(Image.open(pa).convert("RGB"), Image.open(pb).convert("RGB"), title)
    im.save(os.path.join(OUT, "gra_%s.png" % key)); sheet.append(im)
tw = 1800; rows = [i.resize((tw, int(i.height * tw / i.width)), Image.LANCZOS) for i in sheet]
S = Image.new("RGB", (tw, sum(r.height + 8 for r in rows)), (255, 255, 255)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height + 8
S.save(os.path.join(OUT, "zestawienie_gra.png")); print(len(sheet), "par; zestawienie", S.size)
