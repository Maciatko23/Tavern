# -*- coding: utf-8 -*-
"""Przejścia świata po przebudowie murów Kruczogrodu: z js/plugins/Swiat_Data.js bierzemy wszystkie odcinki NIE dotyczące mapy 8, a cztery szwy
mapy 8 (24 N, 111 W, 4 E, 3 S) liczymy od nowa z map w staging (kratka graniczna i pierwsza kratka sąsiada przechodnie - jak tools/plansza/swiat.py).
Zapisuje tools/miasto3/staging/js/plugins/Swiat_Data.js (js/plugins nietknięte).   python tools/miasto3/swiat.py"""
import os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mlib import *   # noqa: F401,F403
N = 120
TS = load(STAGING + "data/Tilesets.json")
POS = {24: (120, 0), 8: (120, 120), 111: (0, 120), 4: (240, 120), 3: (120, 240)}
_m = {}


def mp(i):
    if i not in _m:
        p = STAGING + "data/Map%03d.json" % i
        if not os.path.exists(p): p = ROOT + "data/Map%03d.json" % i
        _m[i] = load(p)
    return _m[i]


def passable(m, x, y):
    t, n = m["data"], N * N
    fl = TS[m["tilesetId"]]["flags"]
    i = y * N + x
    if 2048 <= t[i] < 2816: return False
    if t[5 * n + i] == 2: return False
    for e in m["events"]:
        if e and e["x"] == x and e["y"] == y and e["pages"][0].get("priorityType", 0) == 1 and not e["pages"][0].get("through") and e["pages"][0]["image"]["characterName"]: return False
    for z in (3, 2, 1, 0):
        v = t[z * n + i]
        if not v: continue
        f = fl[v] if v < len(fl) else 0
        if f & 0x10: continue
        if (f & 0x0f) == 0x0f: return False
        if (f & 0x0f) == 0: return True
    return True


def seam(a, b, side):
    """a ... side ... b: bieg kratek obu przechodnich"""
    runs, run = [], []
    for k in range(N):
        if side == "E": ok = passable(mp(a), N - 1, k) and passable(mp(b), 0, k); w = POS[a][1] + k
        else: ok = passable(mp(a), k, N - 1) and passable(mp(b), k, 0); w = POS[a][0] + k
        if ok: run.append(w)
        elif run: runs.append((run[0], run[-1])); run = []
    if run: runs.append((run[0], run[-1]))
    return [r for r in runs if r[1] - r[0] >= 1]


def main():
    src = open(ROOT + "js/plugins/Swiat_Data.js", "rb").read().decode("utf-8")
    lines = src.split("\n")
    out, news = [], []
    for ln in lines:
        m = re.match(r'\s*\{"a": (\d+), "side": "(\w)", "from": (\d+), "to": (\d+), "b": (\d+)\},?\s*$', ln)
        if m and (int(m.group(1)) == 8 or int(m.group(5)) == 8): continue
        out.append(ln)
    for a, b, side, ob in ((24, 8, "S", "N"), (111, 8, "E", "W"), (8, 4, "E", "W"), (8, 3, "S", "N")):
        for lo, hi in seam(a, b, side):
            news.append({"a": a, "side": side, "from": lo, "to": hi, "b": b})
            news.append({"a": b, "side": ob, "from": lo, "to": hi, "b": a})
    # wstaw nowe przed zamknięciem tablicy links
    k = next(i for i, ln in enumerate(out) if ln.strip() == "]" and i > 20)
    body = [l for l in out[k - 1:k]]
    if body and not body[0].rstrip().endswith(","): out[k - 1] = out[k - 1].rstrip() + ","
    out[k:k] = [("            " + json.dumps(l, ensure_ascii=False) + ",") for l in news[:-1]] + ["            " + json.dumps(news[-1], ensure_ascii=False)]
    os.makedirs(STAGING + "js/plugins", exist_ok=True)
    open(STAGING + "js/plugins/Swiat_Data.js", "wb").write("\n".join(out).encode("utf-8"))
    for l in news:
        if l["a"] in (24, 111, 8) and l["side"] in "NSWE": print(l)


if __name__ == "__main__":
    main()
