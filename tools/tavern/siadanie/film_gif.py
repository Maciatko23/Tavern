# -*- coding: utf-8 -*-
"""GIF z zrzutów film_siadania.js (część „siada”): python tools/tavern/siadanie/film_gif.py [od_klatki]  -> docs/tawerna_siadanie/siadanie.gif"""
import glob, os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
D = os.path.join(ROOT, "docs", "tawerna_siadanie")
OD = int(sys.argv[1]) if len(sys.argv) > 1 else 23
pliki = sorted(glob.glob(os.path.join(D, "film", "*.png")))[OD:]
CX, CY, R = 832, 262, 80   # gość: 4 kratki w prawo i 2 w górę od bohatera na środku ekranu
kl = [Image.open(p).convert("RGB").crop((CX - R, CY - R, CX + R, CY + R)).resize((R * 4, R * 4), Image.NEAREST) for p in pliki]
gif = [k.convert("P", palette=Image.ADAPTIVE, colors=160) for k in kl]
czasy = [66] * (len(gif) - 1) + [1500]   # 4 klatki gry na zrzut = prawdziwe tempo; na końcu chwila siedzenia
gif[0].save(os.path.join(D, "siadanie.gif"), save_all=True, append_images=gif[1:], duration=czasy, loop=0)
print(len(kl), "klatek")
