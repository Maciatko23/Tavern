# -*- coding: utf-8 -*-
"""Pary z gry -> docs/audyt_map/poprawki/krok4/Map111/ (lewo przed, prawo po, pasek z podpisem) + zestawienie_gra.png"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "docs", "audyt_map", "poprawki", "krok4", "Map111"); os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(HERE, "tmp", "zdjecia")
F = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
NAMES = {
    "03_wybieg_poludnie": "Podgrodzie 3: wybieg na poludniu domkniety plotem z czterech stron, furtka przy sciezce i furtka od poludnia",
    "04_fosa_poczatek": "Podgrodzie 4 + 10: poczatek fosy zaokraglony, droga schodzi lagodnie do mostu",
    "05_fosa_koniec": "Podgrodzie 5: koniec fosy zamkniety rowna krawedzia (brama w murze przy y106-107 to przejscie do miasta)",
    "06_fosa_blota_trzciny_kamienie": "Podgrodzie 6: sucha fosa - plamy blota, suche trzciny, kamienie",
    "07_fosa_pobocza": "Podgrodzie 7: jedno pobocze fosy (ciemny kamien) na calej dlugosci",
    "08a_szpaler_polnoc": "Podgrodzie 8: szpaler sosen co 4 kratki na jednej osi (polnoc)",
    "08b_szpaler_poludnie": "Podgrodzie 8: szpaler sosen co 4 kratki na jednej osi (poludnie)",
    "09_brzeg_morza": "Podgrodzie 9: brzeg morza (bez zmian - w grze jest juz zaokraglony)",
    "10_droga_polnoc": "Podgrodzie 10: droga polnocna o stalej szerokosci 3 kratek, lagodne wijace sie przesuniecia",
    "11_luzne_kawalki_plotu": "Podgrodzie 11: luzne kawalki plotu i lancuszek kamieni usuniete",
    "12a_cienie_domow": "Podgrodzie 12: twarde ciemne prostokaty cieni (edytor) usuniete - miekkie cienie daje Cienie.js",
    "12b_cienie_plotow": "Podgrodzie 12: twarde cienie przy plotach usuniete",
}
def pair(a, b, title):
    w = a.width * 2 + 6
    im = Image.new("RGB", (w, a.height + 30), (255, 255, 255)); d = ImageDraw.Draw(im); d.rectangle([0, 0, w, 29], fill=(24, 22, 30))
    d.text((8, 5), "%s   |   LEWO: przed   PRAWO: po" % title, font=F, fill=(255, 220, 90))
    im.paste(a, (0, 30)); im.paste(b, (a.width + 6, 30)); return im
sheet = []
for key, title in NAMES.items():
    pa, pb = os.path.join(SRC, "before", key + ".png"), os.path.join(SRC, "after", key + ".png")
    if os.path.exists(pa) and os.path.exists(pb):
        im = pair(Image.open(pa).convert("RGB"), Image.open(pb).convert("RGB"), title)
        im.save(os.path.join(OUT, "gra_%s.png" % key)); sheet.append(im)
tw = 1600; rows = [i.resize((tw, int(i.height * tw / i.width)), Image.LANCZOS) for i in sheet]
S = Image.new("RGB", (tw, sum(r.height + 8 for r in rows)), (255, 255, 255)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height + 8
S.save(os.path.join(OUT, "zestawienie_gra.png")); print(len(sheet), "par", S.size)
