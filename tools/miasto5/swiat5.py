# -*- coding: utf-8 -*-
"""Przejścia świata (Swiat_Data.js links) dla nowego Kruczogrodu: to samo co tools/miasto3/swiat_wszystkie.py, ale mapy czytane z
kopii roboczej tools/miasto5/staging (miasto + 4 sąsiadów), wynik do tools/miasto5/staging/js/plugins/Swiat_Data.js.
  python tools/miasto5/swiat5.py"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "miasto3"))
import swiat as S
S.STAGING = os.path.join(HERE, "staging") + "/"
S.TS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8")); S._m.clear()
N = 120
GRID = {162: (0, 0), 24: (1, 0), 13: (2, 0), 111: (0, 1), 8: (1, 1), 4: (2, 1), 125: (0, 2), 3: (1, 2), 20: (2, 2)}
at = {v: k for k, v in GRID.items()}
def seam(a, b, side):
    ca, ra = GRID[a]; runs, run = [], []
    for k in range(N):
        if side == "E": ok = S.passable(S.mp(a), N - 1, k) and S.passable(S.mp(b), 0, k); w = ra * N + k
        else: ok = S.passable(S.mp(a), k, N - 1) and S.passable(S.mp(b), k, 0); w = ca * N + k
        if ok: run.append(w)
        elif run: runs.append((run[0], run[-1])); run = []
    if run: runs.append((run[0], run[-1]))
    return [r for r in runs if r[1] - r[0] >= 1]
links = []
for (c, r), a in sorted(at.items(), key=lambda kv: (kv[0][1], kv[0][0])):
    for side, ob, (dc, dr) in (("E", "W", (1, 0)), ("S", "N", (0, 1))):
        b = at.get((c + dc, r + dr))
        if b is None: continue
        for lo, hi in seam(a, b, side):
            links.append({"a": a, "side": side, "from": lo, "to": hi, "b": b})
            links.append({"a": b, "side": ob, "from": lo, "to": hi, "b": a})
src = open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), "rb").read().decode("utf-8")
i0 = src.index("links: [") + len("links: ["); i1 = src.index("\n        ]", i0)
new = src[:i0] + "\n" + ",\n".join("            " + json.dumps(l, ensure_ascii=False) for l in links) + src[i1:]
for l in links:
    if 8 in (l["a"], l["b"]) and l["side"] in "ES" or (l["b"] == 8 and l["side"] in "ES"): pass
print("\n".join("%s %s %d..%d -> %s" % (l["a"], l["side"], l["from"], l["to"], l["b"]) for l in links if l["a"] == 8))
out = os.path.join(HERE, "staging", "js", "plugins"); os.makedirs(out, exist_ok=True)
open(os.path.join(out, "Swiat_Data.js"), "wb").write(new.encode("utf-8")); print("odcinków:", len(links))
