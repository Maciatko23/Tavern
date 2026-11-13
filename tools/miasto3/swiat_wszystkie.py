# -*- coding: utf-8 -*-
"""Przejścia świata (js/plugins/Swiat_Data.js) przeliczone dla WSZYSTKICH 12 szwów planszy 3x3 z map gry (data/), po murze Kruczogrodu
dostawionym przy krawędziach sąsiadów (2026-11-08: stare odcinki między sąsiadami prowadziły w nowy mur). Odcinek = bieg kratek, gdzie
kratka graniczna po obu stronach jest przechodnia (jak tools/plansza/swiat.py). Kopia pliku do ../Tawerna_archiwum_2026-11-08/.
  python tools/miasto3/swiat_wszystkie.py [--wykonaj]"""
import datetime, json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import swiat as S   # (its passable() - the same rule as the town's seams)
ROOT = S.ROOT
N = 120
GRID = {162: (0, 0), 24: (1, 0), 13: (2, 0), 111: (0, 1), 8: (1, 1), 4: (2, 1), 125: (0, 2), 3: (1, 2), 20: (2, 2)}
DO = "--wykonaj" in sys.argv
S.TS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
S.STAGING = os.path.join(ROOT, "_brak_") + "/"   # (only the game's data/)
S._m.clear()
at = {v: k for k, v in GRID.items()}


def seam(a, b, side):
    ca, ra = GRID[a]
    runs, run = [], []
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
p = os.path.join(ROOT, "js", "plugins", "Swiat_Data.js")
src = open(p, "rb").read().decode("utf-8")
i0 = src.index("links: [") + len("links: [")
i1 = src.index("\n        ]", i0)
old = len(re.findall(r'\{"a": \d+', src[i0:i1]))
body = "\n" + ",\n".join("            " + json.dumps(l, ensure_ascii=False) for l in links)
new = src[:i0] + body + src[i1:]
pairs = {}
for l in links:
    if l["side"] in "ES": pairs["%d-%d" % (l["a"], l["b"])] = pairs.get("%d-%d" % (l["a"], l["b"]), 0) + 1
print("odcinków: było %d, teraz %d; szwy: %s" % (old, len(links), ", ".join("%s:%d" % kv for kv in sorted(pairs.items()))))
if not DO: print("(próba)"); raise SystemExit(0)
bak = os.path.join(os.path.dirname(ROOT.rstrip("/\\")), "Tawerna_archiwum_2026-11-08", "swiat_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
os.makedirs(bak, exist_ok=True); shutil.copy2(p, bak)
open(p, "wb").write(new.encode("utf-8"))
print("zapisane (kopia: %s)" % bak)
