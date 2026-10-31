# -*- coding: utf-8 -*-
"""img/characters/!$North_Gate_A.png: nadproze bramy polnocnej miasta (3 x 5 kratek, arkusz 3x4 identycznych klatek).
Kafle muru z Map008 (x 20-22, y 0-4: mur z krenelazem), z wycietym lukiem nad ulica; ciemny cien pod lukiem."""
import os, sys, math
from PIL import Image, ImageDraw, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as M
m = M.Mapa(8)
src = M.render(m, region=(20, 0, 22, 4), hide=lambda e: True).convert("RGBA")   # 144 x 240
w, h = src.size
mask = Image.new("L", (w, h), 255)   # 255 = kamien zostaje
d = ImageDraw.Draw(mask)
cx, top, rx, ry = w / 2, 150, w / 2 - 1, 62
d.ellipse([cx - rx, top, cx + rx, top + 2 * ry], fill=0)
d.rectangle([0, top + ry, w, h], fill=0)
# kamienne obrzeze luku: ciemniejsza i jasniejsza obwodka
ring = Image.new("L", (w, h), 0); dr = ImageDraw.Draw(ring)
dr.ellipse([cx - rx - 7, top - 7, cx + rx + 7, top + 2 * ry + 7], fill=255)
dr.ellipse([cx - rx, top, cx + rx, top + 2 * ry], fill=0)
dr.rectangle([0, top + ry, w, h], fill=0)
out = src.copy()
shade = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ds = ImageDraw.Draw(shade)
ds.ellipse([cx - rx, top, cx + rx, top + 2 * ry], fill=(0, 0, 0, 120)); ds.rectangle([0, top + ry, w, h], fill=(0, 0, 0, 0))
shade = shade.filter(ImageFilter.GaussianBlur(4))
# obrzeze: rozjasnij kamien w pierscieniu, ciemna kreska od strony luku
px = out.load(); rp = ring.load()
for y in range(h):
    for x in range(w):
        if rp[x, y]:
            r, g, b, a = px[x, y]; k = 1.18 if (x + y) % 5 else 0.92
            px[x, y] = (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)), a)
out.alpha_composite(shade)
a = Image.new("L", (w, h), 255); a.paste(0, mask=Image.eval(mask, lambda v: 255 - v))
out.putalpha(a)
# smuga cienia pod lukiem (polprzezroczysta, nad ulica): tylko w otworze
cast = Image.new("RGBA", (w, h), (0, 0, 0, 0)); dc = ImageDraw.Draw(cast)
dc.ellipse([cx - rx + 4, top + 4, cx + rx - 4, top + 2 * ry - 4], fill=(5, 5, 10, 90))
dc.rectangle([4, top + ry, w - 4, top + ry + 4], fill=(5, 5, 10, 0))
cast = cast.filter(ImageFilter.GaussianBlur(6))
holo = Image.new("RGBA", (w, h), (0, 0, 0, 0)); holo.paste(cast, mask=Image.eval(mask, lambda v: 255 - v))
out.alpha_composite(holo)
sheet = Image.new("RGBA", (w * 3, h * 4), (0, 0, 0, 0))
for i in range(3):
    for j in range(4): sheet.paste(out, (i * w, j * h))
dst = os.path.join(ROOT, "img", "characters", "!$North_Gate_A.png")
sheet.save(dst); print("zapisano", dst, sheet.size)
out.save(os.path.join(HERE, "staging", "brama_klatka.png"))
