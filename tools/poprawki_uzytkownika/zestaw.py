# before/after pairs -> docs/poprawki_uzytkownika/*.png and zestawienie.png; python tools/poprawki_uzytkownika/zestaw.py
import os, shutil
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "docs", "poprawki_uzytkownika"); os.makedirs(OUT, exist_ok=True)
PAIRS = [("1_dom_dziadka", "m20_dom", "1. Dom dziadka (Map020): pole, trofeum, bramki zagrod, sciezka"),
         ("2_plot_zachod", "m3_zach", "2. Kruczy Jar (Map003): zachodni szereg plotu, bramka, resztki"),
         ("3a_zrodlo_kruczy_jar", "m3_zrodlo", "3a. Zrodlo Jagny (Map003)"),
         ("3b_zrodlo_lesna_droga", "m4_zrodlo", "3b. Zrodlo w lesie (Map004)"),
         ("4_przystan_klif", "m125_klif", "4. Przystan (Map125): brama na klif precz"),
         ("5_przystan_posterunek", "m125_kapitan", "5. Przystan (Map125): posterunek strazy")]
try: font = ImageFont.truetype("arial.ttf", 22)
except Exception: font = ImageFont.load_default()
rows = []
for name, src, title in PAIRS:
    b = Image.open(os.path.join(HERE, "tmp", "before", src + ".png")).convert("RGB"); a = Image.open(os.path.join(HERE, "tmp", "after", src + ".png")).convert("RGB")
    w, h = b.size
    pair = Image.new("RGB", (w * 2 + 12, h + 34), (20, 20, 20)); d = ImageDraw.Draw(pair)
    d.text((6, 6), title + "   |   PRZED", fill=(255, 220, 60), font=font); d.text((w + 18, 6), "PO", fill=(120, 255, 140), font=font)
    pair.paste(b, (0, 34)); pair.paste(a, (w + 12, 34))
    pair.save(os.path.join(OUT, name + "_przed_po.png")); rows.append(pair)
    shutil.copy(os.path.join(HERE, "tmp", "before", src + ".png"), os.path.join(OUT, name + "_przed.png"))
    shutil.copy(os.path.join(HERE, "tmp", "after", src + ".png"), os.path.join(OUT, name + "_po.png"))
for n in (3, 4, 20, 125):
    shutil.copy(os.path.join(HERE, "tmp", "after", "mapa%d.png" % n), os.path.join(OUT, "mapa%03d_cala_po.png" % n))
W = 1700; sc = [r.resize((W, int(r.height * W / r.width)), Image.LANCZOS) for r in rows]
Z = Image.new("RGB", (W, sum(s.height for s in sc)), (20, 20, 20)); y = 0
for s in sc: Z.paste(s, (0, y)); y += s.height
Z.save(os.path.join(OUT, "zestawienie.png")); print("ok", Z.size)
