# -*- coding: utf-8 -*-
"""GIF z zrzutów film.js: python tools/tavern/pokoje/film_gif.py  -> docs/tawerna_porzadki/zasieg_widzenia.gif oraz pasek klatek dla sprawdzenia"""
import glob, os
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
D = os.path.join(ROOT, "docs", "tawerna_porzadki")
pliki = sorted(glob.glob(os.path.join(D, "film", "*.png")))
kl = [Image.open(p).convert("RGB").resize((800, 450), Image.LANCZOS) for p in pliki]
gif = [k.convert("P", palette=Image.ADAPTIVE, colors=200) for k in kl]
gif[0].save(os.path.join(D, "zasieg_widzenia.gif"), save_all=True, append_images=gif[1:], duration=83, loop=0)
wyb = kl[::max(1, len(kl) // 12)][:12]
sh = Image.new("RGB", (4 * 480, 3 * 270))
for i, k in enumerate(wyb):
    sh.paste(k.resize((480, 270), Image.LANCZOS), ((i % 4) * 480, (i // 4) * 270))
sh.save(os.path.join(D, "zasieg_pasek.png"))
print(len(kl), "klatek", sh.size)
