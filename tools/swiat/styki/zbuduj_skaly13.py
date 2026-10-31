# -*- coding: utf-8 -*-
"""PROPOZYCJA (osobna, wyłączalna): lita ściana skalna u podnóża gór na północnej krawędzi Map013 (87 wolnych kratek przy Orlej Grani:
dziś niewidzialna ściana na mapie gracza). Ściana z TYCH SAMYCH kafli A5, z których Map013 ma skalną ścianę niżej (y 3-7, z wejściem do kopalni):
górna krawędź (1653/1654/1655), lico (1608-1610), podstawa (1661/1662/1663); wysokość 2-3 kratek, segmenty o różnej szerokości i wysokości
(nieregularna linia dolna, zakończenia lewy/prawy w każdym segmencie). Miejsce wspinaczki orła (Orzel WAY_UP: (53,6),(54,6), stanie (53,7),(54,7))
i dojście do niego zostają nietknięte (ściana tylko w wierszach y 0-2).
Wynik: tools/swiat/styki/staging/skaly13/Map013.json (cała mapa = staging/data/Map013.json + ściana). install.py: domyślnie instaluje tę wersję,
--bez-skal-13 instaluje wersję bez ściany.
   python tools/swiat/styki/zbuduj_skaly13.py"""
import os, sys, json, copy, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
for p in (os.path.join(ROOT, "tools", "mapy"), os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "swiat", "etap1")): sys.path.insert(0, p)
sys.argv = sys.argv[:1] + ["--staging", os.path.join(HERE, "staging")]
import wspolne as W, zbuduj as Z, mapylib as L, swiat_styki as S
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging")
src = os.path.join(STG, "data", "Map013.json")
raw = json.loads(open(src, "rb").read().decode("utf-8"))
M = L.Mapa(13, raw=raw)
sw = S.Swiat(); sw.links = []
xs = sorted(c["x"] for c in sw.krawedz(13, "N") if c["wolna"] and c["glowny"] and c["b"] == 175)
print("wolnych kratek N krawędzi 13 przy 175:", len(xs))
rnd = random.Random(1313)
LIP = (1653, 1654, 1655); LICO = (1608, 1609, 1610); LICO2 = (1616, 1617, 1618); BAZA = (1661, 1662, 1663)
CHRON = {(53, 6), (54, 6), (53, 7), (54, 7)}
# kolumny do pokrycia: wolne kratki krawędzi i ich sąsiedzi; kolumny z niebędącymi przyrodą zdarzeniami w wierszach 0-3 odpadają
def zd_obce(x):
    for y in range(0, 4):
        for e in M.zd:
            if (e.x, e.y) == (x, y) and not (e.natura and e.id < 458): return True
    return False
need = sorted({x2 for x in xs for x2 in (x - 1, x, x + 1) if 0 <= x2 < M.W and not zd_obce(x2)})
runs = []
for x in need:
    if runs and x == runs[-1][-1] + 1: runs[-1].append(x)
    else: runs.append([x])
runs = [r for r in runs if len(r) >= 3] + [r for r in runs if len(r) < 3 and any(x in xs for x in r)]
segs = []
for r in runs:
    i = 0
    while i < len(r):
        w = rnd.randint(4, 9)
        if len(r) - (i + w) < 3: w = len(r) - i        # nie zostawiamy ogonka węższego niż 3
        seg = r[i:i + w]
        if len(seg) < 2: seg = r[max(0, i - 2):i + w]
        segs.append(seg); i += w
usun = set()
for seg in segs:
    h = rnd.choice((2, 3, 3))
    for x in seg:
        if 1536 <= M.t(0, x, 2) < 2048: h = 2           # pod spodem istniejąca skalna ściana (y 2-3): nie nachodzimy na nią
    for k, x in enumerate(seg):
        kol = 0 if k == 0 else 2 if k == len(seg) - 1 else 1
        tiles = [LIP[kol]] + ([rnd.choice(LICO)] if h == 3 else []) + [BAZA[kol]]
        for y, t in enumerate(tiles):
            if (x, y) in CHRON: continue
            W.put(raw, 0, x, y, t)
            for z in (1, 2, 3, 5): W.put(raw, z, x, y, 0)
            for e in M.zd:
                if (x, y) in e.komorki() and e.natura: usun.add(e.id)
for i in usun: raw["events"][i] = None
os.makedirs(os.path.join(STG, "skaly13"), exist_ok=True)
open(os.path.join(STG, "skaly13", "Map013.json"), "wb").write(W.json_text(raw, "map"))
M2 = L.Mapa(13, raw=raw)
nw = sum(1 for x in xs if M2.stoi(x, 0))
print("segmentów %d, usunięto %d zdarzeń przyrody; wolnych kratek w wierszu y=0 po zmianie: %d; stanie WAY_UP (53,7),(54,7) wolne: %s" % (len(segs), len(usun), nw, [M2.stoi(*p) for p in ((53, 7), (54, 7))]))
