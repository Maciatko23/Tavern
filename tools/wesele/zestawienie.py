# -*- coding: utf-8 -*-
"""docs/zadania_nowe/wesele_gra/zestawienie.png: the in-game pictures of W18 in one sheet (+ the brawl's frame strip)"""
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "zadania_nowe", "wesele_gra")
ITEMS = [("01_borgar_zlecenie", "Zlecenie Borgara"), ("02_kuchnia_lada", "Lada w kuchni, tort"), ("03_plan_stolow", "Plan stołów (okno)"), ("04_plan_znane_wasnie", "Znane waśnie (Q)"),
         ("05_kawalerski", "Wieczór kawalerski"), ("06_sala_przed_slubem", "Sala przed ślubem"), ("07_slub_4", "S1 ślub"), ("08_toast_0", "S2 toast"),
         ("09_taniec_scena_0", "S3 taniec - scena"), ("18_taniec_minigra", "S3 taniec - minigra"), ("10_zniknecie_1", "S4 zniknięcie"), ("16_bojka_2", "S5 bójka"),
         ("11_miejsce_beczka_0", "Szukanie: beczka"), ("11_miejsce_kuchnia_0", "Szukanie: kuchnia"), ("11_miejsce_gry_0", "Szukanie: sala gier"), ("11_miejsce_palarnia_0", "Szukanie: palarnia"),
         ("11_miejsce_drzwi_0", "Szukanie: drzwi na piętrze"), ("11_miejsce_platki_0", "Szukanie: płatki"), ("12_taras_pan_mlody", "Taras: pan młody"), ("14_poranek_1", "S7 poranek"), ("15_tawerna_po_weselu", "Po weselu")]
W, H = 640, 360
cols = 3
rows = (len(ITEMS) + cols - 1) // cols
sheet = Image.new("RGB", (cols * W, rows * (H + 30) + (H // 2 + 40)), (12, 12, 14))
d = ImageDraw.Draw(sheet)
for i, (f, cap) in enumerate(ITEMS):
    p = os.path.join(D, f + ".png")
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB").resize((W, H), Image.LANCZOS)
    x, y = (i % cols) * W, (i // cols) * (H + 30)
    sheet.paste(im, (x, y + 30))
    d.text((x + 8, y + 8), cap, fill=(255, 210, 63))
y0 = rows * (H + 30)
d.text((8, y0 + 8), "Bójka: klatki sceny (co 240 klatek)", fill=(255, 210, 63))
for i in range(5):
    p = os.path.join(D, "16_bojka_%d.png" % i)
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert("RGB").resize((W // 2 - 2, H // 2 - 2), Image.LANCZOS), (i * (W // 2), y0 + 30)) if i < 4 else None
sheet.save(os.path.join(D, "zestawienie.png"))
for f in os.listdir(D):
    if f.startswith("_"):
        os.remove(os.path.join(D, f))
print("OK")
