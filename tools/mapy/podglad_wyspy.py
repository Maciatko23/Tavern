# -*- coding: utf-8 -*-
"""Podglad calej prawdziwej mapy wyspy (jak pod E w zakladce Mapa, bez napisow): obrazy map planszy (4 px na kratke) w ich miejscach
SwiatData, morze z img/mapa_wyspy/morze.png wszedzie poza nimi.
  python tools/mapy/podglad_wyspy.py <folder z obrazami map> <plik.png> [skala]"""
import json, os, re, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
src, out = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
t = open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), "rb").read().decode("utf-8")
maps = json.loads(re.search(r"maps: (\{[^}]*\})", t).group(1))
box = json.loads(re.search(r"SWIAT_BOX = (\[[^\]]*\])", open(os.path.join(ROOT, "js", "plugins", "MapaWyspy_Data.js"), "rb").read().decode("utf-8")).group(1))
PPT = 4
W, H = box[2] * PPT, box[3] * PPT
im = Image.new("RGB", (W, H), (76, 142, 147))
sea = os.path.join(src, "morze.png") if os.path.exists(os.path.join(src, "morze.png")) else os.path.join(ROOT, "img", "mapa_wyspy", "morze.png")
if os.path.exists(sea):
    s = Image.open(sea).convert("RGB")
    for y in range(-((-box[1] * PPT) % s.height), H, s.height):
        for x in range(-((-box[0] * PPT) % s.width), W, s.width): im.paste(s, (x, y))
for mid, (x0, y0, w, h) in maps.items():
    p = os.path.join(src, mid + ".png")
    if not os.path.exists(p): print("brak", p); continue
    pic = Image.open(p).convert("RGB")
    if pic.size != (w * PPT, h * PPT): pic = pic.resize((w * PPT, h * PPT), Image.LANCZOS)
    im.paste(pic, ((x0 - box[0]) * PPT, (y0 - box[1]) * PPT))
if scale != 1.0: im = im.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
im.save(out); print(out, im.size)
