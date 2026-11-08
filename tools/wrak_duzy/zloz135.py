# -*- coding: utf-8 -*-
"""Wrak o 35% większy (gracz 2026-11-07: „jeszcze trochę większy powinien być, o jakieś 30-40%”). Połówki 612x340 / 606x356
(img/characters/!$1_Wrak_*_Duzy.png) powiększone x1.35 i przerysowane z powrotem w czysty piksel przez PixelLab image_to_pixelart
(faithful, po dwa kawałki na połówkę - limit 512 px; surowe135/<Dziob|Rufa>_<0|1>.png, źródła wycinał ten sam podział):
  - kawałki złożone na swoim miejscu, szew w środku zakładki (48 px),
  - barwy z powrotem na paletę oryginalnej połówki (przerysowanie je lekko wybieliło),
  - przezroczystość: maska oryginału powiększona x1.35 (najbliższy sąsiad).
Wynik nadpisuje img/characters/!$1_Wrak_<Dziob|Rufa>_Duzy.png (kopie poprzednich: kopie_zapasowe/obrazki_<czas>).
  python tools/wrak_duzy/zloz135.py"""
import datetime, os, shutil
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CH = os.path.join(ROOT, "img", "characters")
K = 1.35
kop = os.path.join(HERE, "kopie_zapasowe", "obrazki_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
os.makedirs(kop, exist_ok=True)
for n in ("Dziob", "Rufa"):
    p = os.path.join(CH, "!$1_Wrak_%s_Duzy.png" % n)
    src = Image.open(p).convert("RGBA")
    shutil.copy(p, kop)
    W, H = round(src.width * K / 2) * 2, round(src.height * K)
    half = W // 2
    t0 = Image.open(os.path.join(HERE, "surowe135", "%s_0.png" % n)).convert("RGB")
    t1 = Image.open(os.path.join(HERE, "surowe135", "%s_1.png" % n)).convert("RGB")
    out = Image.new("RGB", (W, H))
    out.paste(t0.crop((0, 0, half, H)), (0, 0))                    # (tile 0 covers 0 .. half+24, tile 1 half-24 .. W: the seam at half)
    out.paste(t1.crop((24, 0, t1.width, H)), (half, 0))
    # the original half's own colours
    pal = src.convert("RGB").quantize(colors=96, method=Image.MEDIANCUT)
    out = out.quantize(palette=pal, dither=Image.NONE).convert("RGB")
    alpha = src.split()[3].point(lambda v: 255 if v > 100 else 0).resize((W, H), Image.NEAREST)
    res = out.convert("RGBA"); res.putalpha(alpha)
    res.save(p)
    print("  %s %dx%d (było %dx%d)" % (os.path.basename(p), W, H, src.width, src.height))
print("kopie poprzednich:", kop)
