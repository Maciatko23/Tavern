# -*- coding: utf-8 -*-
"""Część A: przywrócenie przejść w Map001 (61 kratek podłogi zamienionych w ścianę między 1c27fc6 a 0a9682c).
  python tools/tavern/przejscia/build.py   -> staging/Map001.json (kopia OBECNEJ data/Map001.json z przywróconymi kratkami),
                                              overlay/data/Map001.json (dla GAME_OVERLAY), staging/baza.json (skrót wejścia)
Kratki dostają kafle z 1c27fc6 (wszystkie warstwy); sąsiednie kratki warstwy 0 (8 sąsiadów), których kafel różni się od
starego tylko kształtem autokafla (ta sama tekstura), dostają stary kształt - przejście wygląda jak w 1c27fc6, bez szwów.
Zdarzeń, tekstur ścian ani niczego poza przejściami nie rusza."""
import hashlib, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "przytulna"))
from lib_mapa import *
from cells import CELLS
OUT = os.path.join(HERE, "staging"); OVL = os.path.join(HERE, "overlay", "data")
SRC = os.path.join(ROOT, "data", "Map001.json")
SKROT_WEJSCIA = "df79a85fe339586b00408c449b8af3d954515d2c2e9e81411d1d9e1e5351f033"

def stara():
    return json.loads(subprocess.check_output(["git", "show", "1c27fc6:data/Map001.json"], cwd=ROOT).decode("utf-8"))

def zapis(m):
    j = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    NL = chr(10); out = "{" + NL; prev = None
    for n, (k, v) in enumerate(m.items()):
        txt = '"events":[' + NL + ("," + NL).join(j(e) for e in v) + NL + "]" if k == "events" else j(k) + ":" + j(v)
        if n: out += ("," + NL if (isinstance(v, list) and v) or (isinstance(prev, list) and prev) else ",")
        out += txt; prev = v
    return out + NL + "}"

def zbuduj(n, o):
    m = json.loads(json.dumps(n)); zm = []
    S = set(CELLS)
    for (x, y) in CELLS:
        for l in range(6):
            if tile(o, l, x, y) != tile(m, l, x, y): setT(m, l, x, y, tile(o, l, x, y)); zm.append((l, x, y))
    for (x, y) in CELLS:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                a, b = x + dx, y + dy
                if (a, b) in S or not (0 <= a < m["width"] and 0 <= b < m["height"]): continue
                to, tn = tile(o, 0, a, b), tile(m, 0, a, b)
                if to != tn and isAuto(to) and isAuto(tn) and base(to) == base(tn):
                    setT(m, 0, a, b, to); zm.append((0, a, b))
    # tekstura podłogi: gdy sąsiednia podłoga (poza przejściem) w nowej mapie ma INNĄ teksturę niż w 1c27fc6 (gracz przemalował pokój),
    # kratka przejścia dostaje nową teksturę (ze starym kształtem)
    ze = set()
    for _ in range(6):
        for (x, y) in CELLS:
            t0 = tile(o, 0, x, y)
            if not isAuto(t0) or (x, y) in ze: continue
            for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
                a, b = x + dx, y + dy
                if (a, b) in S and (a, b) not in ze: continue
                tn, to = tile(m, 0, a, b), tile(o, 0, a, b)
                if isAuto(tn) and isAuto(to) and passable4(m, a, b) and base(to) == base(t0) and base(tn) != base(t0):
                    setT(m, 0, x, y, base(tn) + shape(t0)); ze.add((x, y)); zm.append((0, x, y)); break
    # BAR: gracz zamknął zaplecze Borgara z obu stron szafkami (44 i 56) i ladą na całej szerokości (wiersz 30) - na zaplecze
    # (a stąd drzwiami 50,26 na korytarz i dalej do całej tylnej części) nie było jak wejść z sali. Przejście za szafkami: kratki
    # 45 i 55 w wierszach 29-30 stają się wolną podłogą, a sąsiednia lada dostaje zakończenie (kafle 768/776 z lewej, 770/778 z prawej).
    for (x, kx, cap) in ((45, 46, (768, 776)), (55, 54, (770, 778))):
        for (l, xx, yy, v) in ((3, x, 29, 0), (3, x, 30, 0), (3, kx, 29, cap[0]), (3, kx, 30, cap[1])):
            if tile(m, l, xx, yy) != v: setT(m, l, xx, yy, v); zm.append((l, xx, yy))
    # BORGAR stoi dziś w (50,28) dokładnie przed drzwiami na zaplecze (50,26-27): drzwi są za jego plecami, nie da się ich dojść.
    # Wraca na swoje miejsce z 1c27fc6 (52,28); id, strony i rozmowa bez zmian.
    e = m["events"][1]
    if (e["x"], e["y"]) == (50, 28): e["x"] = 52; zm.append(("zdarzenie 1 (Borgar)", 52, 28))
    return m, zm

def main():
    raw = open(SRC, "rb").read(); n = json.loads(raw.decode("utf-8"))
    assert zapis(n).encode("utf-8") == raw
    m, zm = zbuduj(n, stara())
    os.makedirs(OUT, exist_ok=True); os.makedirs(OVL, exist_ok=True)
    txt = zapis(m).encode("utf-8")
    for p in (os.path.join(OUT, "Map001.json"), os.path.join(OVL, "Map001.json")): open(p, "wb").write(txt)
    json.dump({"sha256": hashlib.sha256(raw).hexdigest(), "zmienione_kafle": len(zm)}, open(os.path.join(OUT, "baza.json"), "w"), indent=1)
    print("kafli zmienionych:", len(zm), "(kratek przejść:", len(CELLS), ")")

if __name__ == "__main__":
    main()
