# -*- coding: utf-8 -*-
"""Gotowe obrazki nazw map: bezstratne dociśnięcie PNG (te same piksele, ~25% mniej). Woła je tools/nazwa_mapy/obrazki.js.
  python tools/nazwa_mapy/kompresuj.py [plik.png ...]     bez plików: wszystkie w img/nazwy_map"""
import glob, io, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

files = sys.argv[1:] or glob.glob(os.path.join(ROOT, "img", "nazwy_map", "*.png"))
before = after = 0
for f in files:
    raw = open(f, "rb").read()
    im = Image.open(io.BytesIO(raw))
    im.load()
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    new = buf.getvalue()
    # (the same pixels or nothing)
    if len(new) < len(raw) and Image.open(io.BytesIO(new)).convert("RGBA").tobytes() == im.convert("RGBA").tobytes():
        open(f, "wb").write(new)
    else:
        new = raw
    before += len(raw)
    after += len(new)
print("plików %d: %.1f MB -> %.1f MB" % (len(files), before / 1048576, after / 1048576))
