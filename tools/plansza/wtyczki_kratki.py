# -*- coding: utf-8 -*-
"""Krok 1c planszy: kratki przesuniętych map we wtyczkach i testach (BOARD dx, dy). Wejście: spis z drzewa składni (scratch
spis_kratek.js -> decyzje.json: obiekty z map: <id> i ich x/y, [x, y], [x, y, kier.]; klucze map {111: ...}; [id, x, y]; go(id, x, y);
SPOTS_BY_MAP[MAP] = ...; PLACES.manor <-> MAP.manor; łachy {from, cells, to, land}) + RECZNE (miejsca, których drzewo nie wiąże z mapą).
Pisze kopie: wtyczki -> tools/plansza/staging/js/plugins/<plik>, testy -> tools/plansza/staging/testy/<plik> (do instalacji razem).
  python tools/plansza/wtyczki_kratki.py <decyzje.json>"""
import json, os, re, sys
from plansza import ROOT, BOARD, STG
SHIFT = {m: (dx, dy) for m, (c, r, dx, dy) in BOARD.items() if dx or dy}
DEC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "decyzje.json")
ALL = json.load(open(DEC, encoding="utf-8"))
dec = [o for o in ALL if o["map"] in SHIFT]   # (a map with no shift: nothing to change)
# (file, the line's text fragment, map) - [x, y(, dir)] literals on that line all belong to the map
RECZNE = [
    ("js/plugins/Lowy_Data.js", "gaj_1: [13, 40, 2]", 24),          # (the gamekeeper's spots on the estate: [x, y, dir])
    ("js/plugins/Garnizon.js", "|| [36, 12, 2]", 162),               # (the garrison's fallback spots)
    ("js/plugins/Garnizon.js", "|| [30, 22, 8]", 162),
]
edits = {}   # file -> [(start, end, new)]
def add(f, s, e, v): edits.setdefault(f, []).append((s, e, str(v)))
for o in dec:
    f = o["file"].replace("\\", "/")
    dx, dy = SHIFT[o["map"]]
    add(f, o["xs"][0], o["xs"][1], o["value"][0] + dx)
    add(f, o["ys"][0], o["ys"][1], o["value"][1] + dy)
for f, frag, m in RECZNE:
    if m not in SHIFT: continue
    src = open(os.path.join(ROOT, f), encoding="utf-8").read()
    i = src.index(frag); ls = src.rfind("\n", 0, i) + 1; le = src.index("\n", i)
    dx, dy = SHIFT[m]
    for mm in re.finditer(r"\[\s*(\d+)\s*,\s*(\d+)(\s*,\s*[02468])?\s*\]", src[ls:le]):
        add(f, ls + mm.start(1), ls + mm.end(1), int(mm.group(1)) + dx)
        add(f, ls + mm.start(2), ls + mm.end(2), int(mm.group(2)) + dy)
report = []
for f, lst in sorted(edits.items()):
    src = open(os.path.join(ROOT, f), "rb").read().decode("utf-8")
    # (the census gives offsets in characters of the source as JS reads it: the same string)
    seen, out = set(), src
    for (s, e, v) in sorted(set(lst), key=lambda t: -t[0]):
        if (s, e) in seen: continue
        seen.add((s, e))
        out = out[:s] + v + out[e:]
    dst = os.path.join(STG, "js", "plugins", os.path.basename(f)) if f.startswith("js/") else os.path.join(STG, "testy", os.path.basename(f))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "wb").write(out.encode("utf-8"))
    report.append("%-40s %d liczb" % (f, len(seen)))
print("\n".join(report)); print("plików:", len(edits))
# the plugins' places in the new cells: wyspa.py keeps land round them
pts = set()
for o in ALL:
    if not o["file"].startswith("js") or o["map"] not in BOARD: continue
    c, r, dx, dy = BOARD[o["map"]]
    x, y = o["value"][0] + dx, o["value"][1] + dy
    if 0 <= x < 120 and 0 <= y < 120: pts.add((o["map"], x, y))
json.dump(sorted(pts), open(os.path.join(STG, "miejsca.json"), "w"))
print("miejsc wtyczek:", len(pts))
