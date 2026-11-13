# -*- coding: utf-8 -*-
"""Arkusz mieszkanca $Npc_<Klucz>.png (192x256: 3 wzorce x 4 kierunki, komorka 64x64) z postaci PixelLab (pro, styl bohatera) i jej animacji
„walking-8-frames” - TYLKO z kierunkow S, E, N (zachod = odbicie wschodu): tak jak tools/npc/build_npc.py (te same funkcje: czyszczenie, komorka,
stopy na wierszach bohatera, dwa kroki o najszerszym rozkroku), bez ukosow (arkusz Walk8 jest potrzebny tylko walczacym).
   python tools/listonosz/arkusz.py --key Gawron --zip <plik.zip> [--dx N] [--steps A,B] [--mirror-south]
Zapis: tools/listonosz/art/$Npc_<Klucz>.png + docs/zadania_nowe/kruczy_listonosz_gra/postac_<klucz>.png (z bohaterem, x3).
Nic w tools/npc/npcs.json (wspolny plik)."""
import argparse, io, os, sys, zipfile
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "npc"))
import build_npc as B
C = B.C
ap = argparse.ArgumentParser()
ap.add_argument("--key", required=True); ap.add_argument("--zip", required=True)
ap.add_argument("--dx", type=int, default=0); ap.add_argument("--steps"); ap.add_argument("--anim")
a = ap.parse_args()
z = zipfile.ZipFile(a.zip)
rots, anims, prompt = B.index_zip(z, None)
name = a.anim or next(k for k, v in anims.items() if "walk" in k.lower() and all(len(v.get(d, [])) == 8 for d in ("south", "east", "north")))
read = lambda p: B.to_cell(B.clean(Image.open(io.BytesIO(z.read(p))).convert("RGBA"), where=p))
rot = {d: read(rots[d]) for d in ("south", "east", "north")}
walk = {d: [read(p) for p in sorted(anims[name][d])] for d in ("south", "east", "north")}
flip = lambda im: im.transpose(Image.FLIP_LEFT_RIGHT)
rot["west"] = flip(rot["east"]); walk["west"] = [flip(f) for f in walk["east"]]
base, hero = B.hero_baselines()
for d in rot:
    dy = base[d] - B.bottom(rot[d])
    rot[d] = B.shift(rot[d], a.dx, dy); walk[d] = [B.shift(f, a.dx, dy) for f in walk[d]]
if a.steps: sa, sb = [int(x) for x in a.steps.split(",")]
else:
    score = [B.stride(walk["east"][f]) + B.stride(walk["west"][f]) + B.stride(walk["east"][(f + 4) % 8]) + B.stride(walk["west"][(f + 4) % 8]) for f in range(4)]
    sa = max(range(4), key=lambda f: score[f]); sb = sa + 4
mz = Image.new("RGBA", (C * 3, C * 4), (0, 0, 0, 0))
for r, d in enumerate(B.MZ_ROWS):
    mz.alpha_composite(walk[d][sa], (0, r * C)); mz.alpha_composite(rot[d], (C, r * C)); mz.alpha_composite(walk[d][sb], (2 * C, r * C))
out = os.path.join(HERE, "art", "$Npc_%s.png" % a.key); os.makedirs(os.path.dirname(out), exist_ok=True); mz.save(out)
# picture: the hero's standing frames and the new person's, x3
S, GREY, GAP = 3, (128, 128, 128, 255), 20
herorow = {d: r for r, d in enumerate(B.DIRS)}
pic = Image.new("RGBA", (C * 8 * S + GAP * 5, C * S * 2 + GAP * 3), GREY)
for i, d in enumerate(B.MZ_ROWS):
    h = hero.crop((0, herorow[d] * C, C, (herorow[d] + 1) * C)); x = GAP + i * (C * 2 * S + GAP)
    pic.alpha_composite(h.resize((C * S, C * S), Image.NEAREST), (x, GAP)); pic.alpha_composite(rot[d].resize((C * S, C * S), Image.NEAREST), (x + C * S - 8 * S, GAP))
    pic.alpha_composite(walk[d][sa].resize((C * S, C * S), Image.NEAREST), (x, GAP * 2 + C * S)); pic.alpha_composite(walk[d][sb].resize((C * S, C * S), Image.NEAREST), (x + C * S - 8 * S, GAP * 2 + C * S))
dst = os.path.join(ROOT, "docs", "zadania_nowe", "kruczy_listonosz_gra"); os.makedirs(dst, exist_ok=True)
pic.convert("RGB").save(os.path.join(dst, "postac_%s.png" % a.key.lower()))
print("ok", out, "anim", name, "steps", sa, sb)
