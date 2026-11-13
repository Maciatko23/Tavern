# -*- coding: utf-8 -*-
"""python tools/potwory/art/pobierz.py <klucz> <id postaci PixelLab> [--list]
Pobiera zip postaci i rozpakowuje do tools/potwory/art/klatki/<klucz>/: rot/<kierunek>.png i anim/<nazwa animacji>/<kierunek>/<i>.png."""
import os, re, sys, io, zipfile, urllib.request, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
key, cid = sys.argv[1:3]
req = urllib.request.Request("https://api.pixellab.ai/mcp/characters/%s/download" % cid, headers={"User-Agent": "curl/8.0"})
z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(req, timeout=180).read()))
names = z.namelist()
if "--list" in sys.argv:
    print("\n".join(names)); sys.exit()
out = os.path.join(HERE, "klatki", key)
if os.path.isdir(out): shutil.rmtree(out)
for n in names:
    p = n.split("/")
    if not n.endswith(".png"): continue
    if "rotations" in p:
        dst = os.path.join(out, "rot", p[-1])
    elif "animations" in p:
        i = p.index("animations"); anim, d, f = p[i + 1], p[i + 2], p[i + 3]
        dst = os.path.join(out, "anim", anim, d, re.sub(r"\D", "", f).lstrip("0").zfill(1) + ".png")
    else: continue
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "wb").write(z.read(n))
print("ok", out)
for dp, dn, fn in os.walk(os.path.join(out, "anim")):
    if fn: print(os.path.relpath(dp, out), len(fn))
