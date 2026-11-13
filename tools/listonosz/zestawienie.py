# -*- coding: utf-8 -*-
"""Obrazki W20 „Kruczy listonosz”: bierze zdjecia z gry (tests/poczta/*.png, robi je tests/poczta_test.js), kopiuje do
docs/zadania_nowe/kruczy_listonosz_gra/, dorabia paski klatek (kruk na zerdzi, przelot, postacie) i sklada zestawienie.png.
   python tools/listonosz/zestawienie.py"""
import os, sys, shutil
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(ROOT, "tests", "poczta")
DST = os.path.join(ROOT, "docs", "zadania_nowe", "kruczy_listonosz_gra")
os.makedirs(DST, exist_ok=True)
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OPISY = {
    "01_drzwi": "Drzwi kruczarni w rogu miasta (po oswojeniu kruka)", "02_wnetrze_gawron": "Kruczarnia: Gawron wita bohatera (wnętrze, mapa 214)",
    "03_wieza": "Wieża: żerdzie z krukami", "04_torba": "Torba listonosza (klawisz B)", "05_doreczenie_hanka": "Doręczenie: „Masz list.”",
    "06_list_dziadka": "Okno listu: czarno-żółta ramka", "07_grum": "S3: Grum czyta list", "08_okno_listu": "Okno listu (pokusa)",
    "09_noc_kaptur": "S5: noc w kruczarni, zdrajca w kapturze", "10_przynieta": "S6: trzecia noc, paczka", "11_final": "S7/S8: prawda i odlot",
    "12_przelot": "S1: kruk z listem nad miastem", "13_wnetrze_dzien": "Kruczarnia za dnia"}
shots = sorted(f for f in os.listdir(SRC) if f.endswith(".png") and f[:2].isdigit()) if os.path.isdir(SRC) else []
for f in shots: shutil.copy2(os.path.join(SRC, f), os.path.join(DST, f))
# strip: the raven on the perch (stand, caw, peck, sleep) from the Kruczarnia's sheet
art = os.path.join(HERE, "art", "!$Kruczarnia_Zerdz.png")
if os.path.exists(art):
    im = Image.open(art).convert("RGBA"); W, H = 96, 128
    frames = [im.crop((c * W, r * H, c * W + W, r * H + H)) for r in (0, 2, 3) for c in range(3)]
    strip = Image.new("RGBA", (W * 3 * len(frames), H * 3), (74, 62, 52, 255))
    for i, fr in enumerate(frames): strip.alpha_composite(fr.resize((W * 3, H * 3), Image.NEAREST), (i * W * 3, 0))
    strip.convert("RGB").save(os.path.join(DST, "animacja_kruk_na_zerdzi.png"))
# contact sheet
tiles = [(f, OPISY.get(f[:-4], f[:-4])) for f in shots] + [(f, "postać: " + f[6:-4]) for f in sorted(os.listdir(DST)) if f.startswith("postac_")]
cols, TW = 3, 640
cells = []
for f, d in tiles:
    im = Image.open(os.path.join(DST, f)).convert("RGB"); r = TW / im.width
    cells.append((im.resize((TW, int(im.height * r)), Image.LANCZOS), d))
rows = (len(cells) + cols - 1) // cols
rh = max(c[0].height for c in cells) + 34 if cells else 0
sheet = Image.new("RGB", (cols * (TW + 10) + 10, rows * (rh + 10) + 10), (22, 22, 22))
dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype("arial.ttf", 18)
except Exception: font = ImageFont.load_default()
for i, (im, d) in enumerate(cells):
    x, y = 10 + (i % cols) * (TW + 10), 10 + (i // cols) * (rh + 10)
    sheet.paste(im, (x, y)); dr.text((x + 4, y + im.height + 6), d, fill=(255, 210, 63), font=font)
sheet.save(os.path.join(DST, "zestawienie.png"))
print("ok", len(cells), "obrazkow ->", DST)
