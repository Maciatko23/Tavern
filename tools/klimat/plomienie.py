# -*- coding: utf-8 -*-
"""Wysokość płomienia nad stopą (px) dla grafik zdarzeń ze światłem <Light> na wszystkich mapach (gracz 2026-11-09: „źródło światła
nie powinno pochodzić z lampy?” - blask latarni był przy jej stopie). Mierzy ciepłe, jasne piksele w klatce (płomień, szybka lampy) i
wypisuje tabelę FLAME_UP do js/plugins/Farming_Render.js: "nazwa|indeks|kierunek|wzór": px nad dolną krawędzią klatki.
  python tools/klimat/plomienie.py            (wypisuje)        python tools/klimat/plomienie.py --wpisz   (podmienia tabelę w pliku)"""
import glob, json, os, re, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
combos = set()
for f in glob.glob(os.path.join(ROOT, "data", "Map[0-9][0-9][0-9].json")):
    m = json.load(open(f, encoding="utf-8"))
    for e in m["events"] or []:
        if not e or not re.search(r"<Light(:|>)", e["note"] or "") or re.search(r"<LightSoft>", e["note"] or ""): continue
        im = e["pages"][0]["image"]
        if im["characterName"]: combos.add((im["characterName"], im["characterIndex"], im["direction"], im["pattern"]))
out = {}
for name, idx, d, pat in sorted(combos):
    p = os.path.join(ROOT, "img", "characters", name + ".png")
    if not os.path.exists(p): continue
    a = np.asarray(Image.open(p).convert("RGBA")).astype(int); H, W = a.shape[:2]
    big = "$" in name[:2]
    fw, fh = (W // 3, H // 4) if big else (W // 12, H // 8)
    ox, oy = (0, 0) if big else ((idx % 4) * 3 * fw, (idx // 4) * 4 * fh)
    row = {2: 0, 4: 1, 6: 2, 8: 3}.get(d, 0)
    fr = a[oy + row * fh:oy + (row + 1) * fh, ox + pat * fw:ox + (pat + 1) * fw]
    warm = (fr[..., 3] > 150) & (fr[..., 0] > 200) & (fr[..., 1] > 140) & (fr[..., 0] >= fr[..., 2] + 40)
    ys = np.where(warm.sum(1) >= 2)[0]
    if not len(ys): continue
    up = int(fh - 1 - (ys.min() + ys.max()) / 2)
    out["%s|%d|%d|%d" % (name, idx, d, pat)] = up
line = "    const FLAME_UP = " + json.dumps(out, ensure_ascii=False, separators=(", ", ": ")) + ";"
print(len(out), "grafik"); print(line[:300] + "...")
if "--wpisz" in sys.argv:
    p = os.path.join(ROOT, "js", "plugins", "Farming_Render.js"); b = open(p, "rb").read().decode("utf-8")
    i = b.index("    const FLAME_UP = "); j = b.index("\n", i)
    open(p, "wb").write((b[:i] + line + b[j:]).encode("utf-8")); print("wpisane")
