# -*- coding: utf-8 -*-
"""przejscia (zdarzenia 201) w srodku mapy swiata (nie na krawedzi): staging etapu 3 (+ data/). python tools/swiat/etap3/srodek.py"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
u = json.load(open(os.path.join(ROOT, "docs/mapy/swiat_uklad.json"), encoding="utf-8"))["mapy"]; outd = set(int(k) for k in u); n = 0
for mid in sorted(outd):
    p = os.path.join(HERE, "staging", "data", "Map%03d.json" % mid)
    if not os.path.exists(p): p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    if not os.path.exists(p): continue
    d = json.load(open(p, encoding="utf-8")); W, H = d["width"], d["height"]
    for e in d["events"]:
        if not e: continue
        for pg in e["pages"]:
            for c in pg["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in outd and not (e["x"] in (0, W - 1) or e["y"] in (0, H - 1)): print(mid, e["id"], (e["x"], e["y"]), c["parameters"][1:4]); n += 1
print("przejscia w srodku mapy:", n)

# przejscia wstawiane w czasie gry (Wyspa, Homes, Orzel...): czytane z gry po zaladowaniu kazdej mapy swiata (CDP, port 9382):
#   python tools/swiat/etap3/srodek.py --gra [katalog_stagingu]     (bez katalogu: zainstalowane dane)
import subprocess, sys as _sys
if "--gra" in _sys.argv:
    i = _sys.argv.index("--gra"); env = dict(os.environ, CDP_PORT=os.environ.get("CDP_PORT", "9382"))
    if len(_sys.argv) > i + 1: env.update(GAME_OVERLAY=_sys.argv[i + 1], GAME_OVERLAY_JS="1")
    r = subprocess.run(["node", os.path.join(ROOT, "tests", "swiat_przejscia_test.js")], cwd=ROOT, env=env, capture_output=True, text=True)
    print("\n".join(l for l in r.stdout.splitlines() if l.startswith(("FAIL", "ERR")) or "passed" in l))
