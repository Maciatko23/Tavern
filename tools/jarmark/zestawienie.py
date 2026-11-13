# -*- coding: utf-8 -*-
"""docs/zadania_nowe/jarmark_gra/zestawienie.png - plansza ze zdjęć testu (tests/jarmark_test.js) i pościgu (tools/jarmark/chase_probe.js)."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(HERE, "..", "..", "docs", "zadania_nowe", "jarmark_gra")
ITEMS = [("00_kamienice_dzien", "Dwie nowe kamienice (kafle Winlu) nad dzwonnicą"), ("02_kramy_stoja", "Sześć kramów postawionych"), ("03_lampiony_noc", "Lampiony i beczki Borgara"),
    ("05_otwarcie_pochod", "Otwarcie: pochód"), ("06_konkurs_sedziowie", "Konkurs piwny: czterej sędziowie"), ("09_scena_wieczor", "Scena trupy i pochodnie"),
    ("10_sztuka_akt", "Sztuka na rynku"), ("12_poduszka_pusta", "Kruk zniknął"), ("14_zasadzka_u_dzwonnicy", "Zasadzka przy dzwonnicy"),
    ("15a_poscig_szept_na_dachu", "Pościg: start na dachu"), ("18_dach_kamienica", "Dach pierwszej kamienicy"), ("20_dach_dzwonnica", "Skok na grzbiet dzwonnicy"),
    ("21_po_poscigu", "Meta pościgu"), ("22_zamkniecie_jarmarku", "Zamknięcie jarmarku (A)"), ("23_po_jarmarku", "Rynek po jarmarku")]
W, H, PAD, COLS = 640, 360, 10, 3
try: F = ImageFont.truetype("arial.ttf", 18)
except Exception: F = ImageFont.load_default()
have = [(n, c) for n, c in ITEMS if os.path.exists(os.path.join(D, n + ".png"))]
rows = (len(have) + COLS - 1) // COLS
M = Image.new("RGB", (COLS * (W + PAD) + PAD, rows * (H + 28 + PAD) + PAD), (24, 22, 28)); d = ImageDraw.Draw(M)
for i, (n, c) in enumerate(have):
    x = PAD + (i % COLS) * (W + PAD); y = PAD + (i // COLS) * (H + 28 + PAD)
    im = Image.open(os.path.join(D, n + ".png")).convert("RGB").resize((W, H), Image.LANCZOS); M.paste(im, (x, y + 26)); d.text((x + 4, y + 2), c, fill=(255, 226, 122), font=F)
M.save(os.path.join(D, "zestawienie.png")); print("zestawienie:", len(have), "obrazów")

# pasek klatek skoku przez trzy pola ulicy (tools/jarmark/chase_probe.js: skok_klatka_1..6)
fr = [os.path.join(D, "skok_klatka_%d.png" % i) for i in range(1, 7)]
if all(os.path.exists(f) for f in fr):
    cw, ch = 360, 360
    S = Image.new("RGB", (cw * 6, ch), (24, 22, 28))
    for i, f in enumerate(fr):
        im = Image.open(f).convert("RGB"); w, h = im.size; S.paste(im.crop((w // 2 - cw // 2, h // 2 - ch // 2, w // 2 + cw // 2, h // 2 + ch // 2)), (i * cw, 0))
    S.save(os.path.join(D, "skok_pasek.png")); print("pasek skoku")
