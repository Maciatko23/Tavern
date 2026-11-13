# -*- coding: utf-8 -*-
"""Projekt (obraz, nic w grze): front tawerny i podwórze zajazdu w Kruczogrodzie z budynków Fantastic Buildings: Medieval, na zdjęciu
obecnej okolicy tawerny (wygląd B). Drzwi tawerny zostają na swojej kratce (51,16 - przejście do sali i wtyczki), stajnia zajazdu
na miejscu ogródka piwnego po prawej. Obszar zdjęcia: mapa 8, x 34-83, y 0-25.
  python tools/miasto3/projekt_tawerna.py <zdjęcie okolicy> <wyjście.png>"""
import os, sys
import numpy as np
import cv2
from PIL import Image

PACK = r"C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MZ\dlc\Fantastic Buildings - Medieval\Tilesets"
T, OX, OY = 48, 34, 0
sheets = {}


def piece(name, x0, y0, x1, y1):
    if name not in sheets: sheets[name] = Image.open(os.path.join(PACK, name + ".png")).convert("RGBA")
    return sheets[name].crop((x0 * T, y0 * T, (x1 + 1) * T, (y1 + 1) * T))


# (sheet window, map cell of its top-left)
TAWERNA = [
    (("City_TileB", 3, 0, 7, 5), (38, 11)),       # dom z balkonem kwiatów (lewe skrzydło)
    (("City_TileC", 2, 0, 7, 8), (43, 8)),        # długa kamienica z lukarnami
    (("City_TileD", 8, 0, 12, 9), (49, 7)),       # dom cechowy z wieżyczkami i godłem - wejście do tawerny (drzwi 51,16)
    (("City_TileC", 8, 1, 11, 12), (54, 5)),      # wysoki dom z balkonem
    (("City_TileC", 12, 1, 15, 10), (58, 7)),     # dom z galerią i beczkami
]
ZAJAZD = [
    (("Rural_TileD", 0, 11, 7, 15), (64, 4)),     # stajnia z bali, konie w boksach
    (("Rural_TileE", 0, 12, 7, 15), (70, 11)),    # stajnia pod strzechą, konie
]
CLEAR = (37, 2, 78, 17)                           # (the old tavern and the beer garden: under the new buildings, the yard)


def shadow_under(im, pc, tx, ty):
    a = np.asarray(pc)[..., 3]
    foot = np.zeros(a.shape, np.uint8)
    foot[-T // 2:, :] = (a[-T // 2:, :] > 128) * 120
    sh = Image.fromarray(np.dstack([np.zeros(a.shape + (3,), np.uint8), cv2.GaussianBlur(foot, (0, 0), 7)]), "RGBA")
    im.alpha_composite(sh, ((tx - OX) * T + 8, (ty - OY) * T + 10))


def main(src, out):
    im = Image.open(src).convert("RGBA")
    # the yard: the plaza's light cobbles (a 2 x 2 cells patch from the entrance path, map 50-51 x 19-20) over the cleared area
    patch = im.crop(((50 - OX) * T, (19 - OY) * T, (52 - OX) * T, (21 - OY) * T))
    x0, y0, x1, y1 = CLEAR
    for y in range(y0, y1 + 1, 2):
        for x in range(x0, x1 + 1, 2):
            im.paste(patch, ((x - OX) * T, (y - OY) * T))
    for (name, a, b, c, d), (tx, ty) in TAWERNA + ZAJAZD:
        pc = piece(name, a, b, c, d)
        shadow_under(im, pc, tx, ty)
        im.alpha_composite(pc, ((tx - OX) * T, (ty - OY) * T))
    im.convert("RGB").save(out)
    small = im.convert("RGB").resize((im.width // 2, im.height // 2), Image.LANCZOS)
    small.save(out.replace(".png", "_male.png"))
    print(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
