# -*- coding: utf-8 -*-
"""Wrak, poprawki gracza do zrzutu (2026-11-07: „to źle wygląda i trzeba prosto w otwór wejść, żeby wejść do statku, i statek musi
blokować z przodu ruch”; zaznaczone: beczka i skrzynie w szczelinie, otwór, złamany maszt z monetami):
  - kadłub blokuje cały: rzędy 12-16 od x 5 do 34 (dziób, szczelina, rufa) - same niewidoczne blokady (zdarzenia bez obrazu blokują
    całą kratkę; obrazy połówek są „przez”, ich pusty dół wpuszczał stopy w przedni rząd kadłuba); bez <Occupy> na połówkach
  - otwór: obie kratki pod dziurą (26 i 27, rząd 16) prowadzą pod pokład - wchodzi się prosto w otwór
  - beczka i skrzynie ze szczeliny, złamany maszt z blokadą i zdarzenie „Skrzynie z ładunku” usunięte
Czyta data/Map165.json (po zmien.py), zapis tylko z --wykonaj przy zamkniętym edytorze (kopie: kopie_zapasowe/<czas>_popraw2).
  python tools/wrak_duzy/popraw2.py [--wykonaj]"""
import copy, datetime, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

path = os.path.join(ROOT, "data", "Map165.json")
raw = open(path, "rb").read()
m = json.loads(raw.decode("utf-8"))
if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map165 nie w układzie edytora")
ev = m["events"]
assert ev[1]["name"].startswith("Wrak: dzi") and ev[2]["name"].startswith("Wrak: rufa") and ev[40]["name"].startswith("Dziura w burcie")
blank = copy.deepcopy(ev[3]["pages"][0])   # (a blocker's page: no picture, same as characters, nothing to do)
for i in (1, 2): ev[i]["note"] = re.sub(r"<Occupy:[^>]*>", "", ev[i]["note"] or "")
def blocker(i, x, y, spec, name):
    e = {"id": i, "name": name, "note": "<Occupy:" + spec + ">", "pages": [copy.deepcopy(blank)], "x": x, "y": y}
    while len(ev) <= i: ev.append(None)
    ev[i] = e
blocker(3, 5, 16, "right=14,up=4", "Blokada: kadłub dziobu i szczelina")
blocker(4, 20, 16, "right=5,up=4", "Blokada: kadłub rufy (przed dziurą)")
n0 = len(ev)
blocker(n0, 26, 15, "right=1,up=3", "Blokada: kadłub nad dziurą")
blocker(n0 + 1, 28, 16, "right=6,up=4", "Blokada: kadłub rufy (za dziurą)")
hole = copy.deepcopy(ev[40]); hole["id"] = n0 + 2; hole["x"], hole["y"] = 27, 16
ev.append(hole)
for i in (42, 43, 44): ev[i] = None          # (the cargo's popup, the broken mast and its blocker)
# the barrel and the crates in the gap (B-E tiles, layers 2-3)
Wd, Hd, d = m["width"], m["height"], m["data"]; n = Wd * Hd
for y in range(13, 17):
    for x in (18, 19):
        for z in (2, 3): d[z * n + y * Wd + x] = 0
out = W.map_text(m).encode("utf-8")
print("blokady: 3, 4, %d, %d; drugi otwór %d w (27,16); usunięte 42, 43, 44 i beczka ze skrzyniami" % (n0, n0 + 1, n0 + 2))
if "--wykonaj" in sys.argv:
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_popraw2")
    os.makedirs(kop, exist_ok=True)
    open(os.path.join(kop, "Map165.json"), "wb").write(raw)
    open(path, "wb").write(out)
    print("zapisane; kopia:", kop)
else:
    os.makedirs(STG, exist_ok=True)
    open(os.path.join(STG, "Map165.json"), "wb").write(out)
    print("kopia w", STG)
