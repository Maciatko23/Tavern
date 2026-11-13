# -*- coding: utf-8 -*-
"""Przystań na planszy (gracz 2026-11-08: „wywal te dziwne rzeczy” - wrak okrętu na mieliźnie i proste linie na wodzie zatoki):
  - wrak okrętu (ozdoba, nic go nie używa) i skały mielizny pod nim (A1 na warstwie 1) - precz;
  - płycizna zatoki (A1 10, pas rzędów 31-39) cięta prostymi rzędami między głęboką wodą - cała zatoka jedną wodą (A1 6), kształty
    przeliczone: bez prostych linii na wodzie;
  python tools/plansza/przystan.py   (po wyspa.py)"""
import json, os
from plansza import N, STG, W
p = os.path.join(STG, "data", "Map125.json")
m = json.load(open(p, encoding="utf-8")); t, n = m["data"], N * N
gone = [e["name"] for e in m["events"] if e and e["pages"][0]["image"]["characterName"] == "!$Przystan_Okret_Wrak"]
m["events"] = [None if (e and e["pages"][0]["image"]["characterName"] == "!$Przystan_Okret_Wrak") else e for e in m["events"]]
BAY = [(x, y) for y in range(24, 46) for x in range(0, 20)]
cells = []
for (x, y) in BAY:
    i = y * N + x
    if 2048 <= t[i] < 2816:
        if W.kind_of(t[i]) == 10: t[i] = 2048 + 6 * 48; cells.append((x, y))
        v1 = t[n + i]
        if 2048 <= v1 < 2816: t[n + i] = 0; cells.append((x, y))
W.reshape(m, 0, W.ring(cells, 1)); W.reshape(m, 1, W.ring(cells, 1))
open(p, "wb").write(W.map_text(m).encode("utf-8"))
print("Przystań: zdjęte %s; płycizna i skały mielizny w zatoce -> woda: %d kratek" % (", ".join(gone) or "-", len(set(cells))))

# ---- (gracz 2026-11-08: „przystań ma pasować do Podgrodzia”) the fishermen's row: three yards cut from Podgrodzie (the staged map, its
# own houses, log fences, yards, barrels and wood - doors to the interiors left out), along a new street off the quay; the trees
# where they stand go
import re, sys
import numpy as np
from plansza import ROOT
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import pieczatki as P
podg = json.load(open(os.path.join(STG, "data", "Map111.json"), encoding="utf-8"))
ZAGRODY = [(20, 71, 33, 11)]          # (the window in the staged Podgrodzie: x0, y0, w, h - its row of three yards, shared fences and all)
MIEJSCA = [(46, 20)]                  # (where it goes in the harbour: its top-left corner)
ULICA = ([(x, y) for x in range(40, 90) for y in (32, 33)] + [(x, y) for x in (40, 41) for y in range(20, 32)])
NAT = re.compile(r"^!\$(Pine|Tree|Big_Trees|Bush|Rock|Boulder|Trunk|Stump|Log|Sapling)", re.I)
m = json.load(open(p, encoding="utf-8")); t = m["data"]
area = set(ULICA)
for (wx, wy, ww, wh), (px, py) in zip(ZAGRODY, MIEJSCA):
    area |= {(px + i, py + j) for i in range(ww) for j in range(wh)}
ring2 = W.ring(area, 1)
before = sum(1 for e in m["events"] if e)
m["events"] = [None if (e and (e["x"], e["y"]) in ring2 and NAT.match(e["pages"][0]["image"]["characterName"] or "")) else e for e in m["events"]]
cut_trees = before - sum(1 for e in m["events"] if e)
pl = P.Plotno(N, N, m["tilesetId"])
pl.a = np.array(t, dtype=np.int32).reshape(6, N, N)
for e in m["events"]:
    if e:
        for (dx, dy) in P.stopa(e): pl.zajete[(e["x"] + dx, e["y"] + dy)] = -1
for (wx, wy, ww, wh), (px, py) in zip(ZAGRODY, MIEJSCA):
    st = P.wytnij(podg, wx, wy, ww, wh, "zagroda", "zagroda z Podgrodzia", zdarzenia="wszystkie", pelny=True, kontrola=False)
    keep = []
    for z in st["zdarzenia"]:
        e = z["ev"]; pic = e["pages"][0]["image"]["characterName"] or ""
        if any(c["code"] == 201 for pg in e["pages"] for c in pg["list"]) and not pic.startswith("!Fantasy_door"): continue
        if pic.startswith("!Fantasy_door"):   # (the door: drawn, shut - these huts have no inside)
            pg = json.loads(json.dumps(e["pages"][0]))
            pg["list"] = [{"code": 355, "indent": 0, "parameters": ["Tawerna.popup('Zamknięte. Rybak wypłynął.')"]}, {"code": 0, "indent": 0, "parameters": []}]
            pg["trigger"] = 0
            for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid"): pg["conditions"][k] = False
            z["ev"] = {"name": "Drzwi chaty rybaka (zamknięte)", "note": "", "pages": [pg]}
            keep.append(z); continue
        if pic.startswith("$") or not pic or e["name"].startswith("Miejsce"): continue   # (hens, markers)
        if re.match(r"^!(Fantasy_chimney|Town_Props|House_Town)$|^!\$Latarnia_Slup$", pic) or P.zdarzenie_ozdobne(e): keep.append(z)
    st["zdarzenia"] = keep
    pl.wstaw(st, px, py, zdarzenia=True, nadpisz_zdarzenia=False)
for (x, y) in ULICA:
    pl.a[0, y, x] = 2048 + 17 * 48; pl.a[1, y, x] = 0   # (A2 17: earth with a grassy edge, as the roads)
pl.przelicz(set(ULICA))
used = {e["id"] for e in m["events"] if e}
free_ids = [i for i in range(1, 500) if i not in used]
added = 0
for e in sorted(pl.ev, key=lambda e: (e["y"], e["x"])):
    if not free_ids: break
    d = json.loads(json.dumps(e["ev"])); i = free_ids.pop(0)
    ne = {"id": i, "name": d.get("name", ""), "note": d.get("note", ""), "pages": d["pages"], "x": e["x"], "y": e["y"]}
    while len(m["events"]) <= i: m["events"].append(None)
    m["events"][i] = ne; added += 1
m["data"] = [int(v) for v in pl.a.reshape(-1)]
open(p, "wb").write(W.map_text(m).encode("utf-8"))
print("Przystań: rząd rybaków (%d wycinek: trzy zagrody z Podgrodzia), ulica %d kratek, drzew zdjętych %d, rzeczy z zagród %d" % (len(ZAGRODY), len(ULICA), cut_trees, added))
