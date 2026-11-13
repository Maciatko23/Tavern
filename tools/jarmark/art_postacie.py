# -*- coding: utf-8 -*-
"""Arkusze postaci jarmarku (W17): istniejące arkusze mieszkańców przebarwione (kolory kostiumowe, ale zszargane: „teatr w nędzy”).
Zero generacji PixelLab. python tools/jarmark/art_postacie.py -> tools/jarmark/art/$Npc_Jarmark_*.png"""
import colorsys, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "art")
# klucz -> (arkusz bazowy, reguły: (h0, h1 [0-360], s_min, v_min, dh, ds*, dv*))  - przesunięcie barwy zakresu
R = {
  "Ofelia":      ("Przekupka", [(30, 70, .35, 0.3, +230, 0.9, 0.85), (80, 160, .2, 0.2, +165, 0.9, 0.9)]),                 # żółta chusta -> fiolet, zielony stanik -> śliwka
  "Pimpek":      ("Gracz",     [(335, 360, .45, 0.2, -250, 1.0, 1.15), (0, 8, .45, 0.2, +110, 1.0, 1.1)]),                  # bordo kaftan -> morski
  "Zar":         ("Kowal",     [(0, 60, .25, 0.0, 0, 0.5, 0.82)]),                                                          # spłowiały, osmalony
  "Bonawentura": ("Werbownik", [(200, 250, .25, 0.2, +165, 0.8, 0.9), (190, 215, .08, 0.5, +170, 0.5, 0.95)]),               # niebieski -> wyblakła czerwień
  "Ania":        ("Jagodka",   [(60, 160, .1, 0.2, -50, 0.5, 0.85)]),                                                       # sukienka -> ciepły szary brąz (futro Wilka)
  "Szept":       ("Zlodziej",  [(0, 40, .35, 0.0, 0, 0.2, 0.9)]),                                                           # kaptur -> szary płaszcz suflera (skóra jaśniejsza: v>.6 omijana)
  "Marcel":      ("Kupiec",    [(90, 170, .2, 0.15, +110, 0.7, 0.9), (330, 360, .25, 0.2, +215, 0.5, 0.8)]),                # zielony surdut -> granat, kapelusz -> szary
  "Wanda":       ("Przekupka", [(30, 70, .35, 0.3, +320, 0.7, 0.45), (80, 160, .2, 0.2, +250, 1.0, 0.95)]),                 # czarna chusta, karminowy stanik
}
SKIN = True
def recolor(img, rules):
    img = img.convert("RGBA"); px = img.load(); w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0: continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            hd = hh * 360
            for h0, h1, smin, vmin, dh, ds, dv in rules:
                hit = (h0 <= hd <= h1) if h0 <= h1 else (hd >= h0 or hd <= h1)
                if hit and ss >= smin and vv >= vmin and not (SKIN and 12 <= hd <= 40 and .25 <= ss <= .6 and vv > .6):
                    hh = ((hd + dh) % 360) / 360; ss = min(1, ss * ds); vv = min(1, vv * dv)
                    r, g, b = [int(round(c * 255)) for c in colorsys.hsv_to_rgb(hh, ss, vv)]
                    px[x, y] = (r, g, b, a)
                    break
    return img
if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k, (base, rules) in R.items():
        src = Image.open(os.path.join(ROOT, "img", "characters", "$Npc_%s.png" % base))
        recolor(src, rules).save(os.path.join(OUT, "$Npc_Jarmark_%s.png" % k))
    # zestawienie do oka
    names = list(R); S = 3
    M = Image.new("RGBA", (len(names) * 200, 200 + 10), (70, 90, 70, 255))
    for i, k in enumerate(names):
        im = Image.open(os.path.join(OUT, "$Npc_Jarmark_%s.png" % k)); c = im.crop((64, 0, 128, 64)).resize((192, 192), Image.NEAREST); M.paste(c, (i * 200, 5), c)
    M.save(os.path.join(HERE, "podglad", "postacie.png"))
