# -*- coding: utf-8 -*-
"""Wicek (15-letni uczen kruczarza), arkusz $Npc_Wicek.png: PRZEROBIONY istniejacy arkusz $Npc_Kostek (nastolatek w stylu bohatera): blekitna tunika -> oliwkowo-brazowa
(kolory z postaci Wicka z PixelLaba: patched green-brown wool tunic), ciemne wlosy -> jasniejsze brazowe, plamy atramentu na dloniach (czarne piksele przy rekach).
Zastepuje sie go arkuszem z PixelLaba (tools/listonosz/arkusz.py --key Wicek --zip ...), gdy wygenerowany jest nowy. Zapis: tools/listonosz/art/$Npc_Wicek.png"""
import os, colorsys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
im = Image.open(os.path.join(ROOT, "img", "characters", "$Npc_Kostek.png")).convert("RGBA")
px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if not a: continue
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if 0.52 < h < 0.72 and s > 0.2:      # the blue tunic -> olive green-brown
            h2 = 0.20 + (h - 0.6) * 0.3; s2 = min(1, s * 0.75); v2 = v * 0.92
            r, g, b = [int(c * 255) for c in colorsys.hsv_to_rgb(h2, s2, v2)]
        elif v < 0.22 and s < 0.5 and y % 64 < 24:   # the dark hair (head rows) -> lighter brown
            r, g, b = [int(c * 255) for c in colorsys.hsv_to_rgb(0.08, 0.55, min(1, v * 2.6 + 0.16))]
        px[x, y] = (r, g, b, a)
out = os.path.join(ROOT, "tools", "listonosz", "art", "$Npc_Wicek.png")
im.save(out); print("ok", out)
