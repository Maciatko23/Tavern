# -*- coding: utf-8 -*-
"""Mur raz na mapie wyspy (gracz 2026-11-07, wariant A: „w grze zostaje jak jest, na mapie wyspy mur rysuję raz”).
Łączenia z 2026-10-31 (tools/swiat/szwy) kopiowały mur / klif o 2 kratki na sąsiednią mapę - w grze widać go z obu stron i nie da się
obejść muru krawędzią mapy, ale na mapie wyspy (mapy obok siebie) mur jest podwójny: baszty jedna obok drugiej. To narzędzie znajduje
te kopie (2 kratki przy granicy równe 2 kratkom po drugiej stronie, przesunięte o 2 - [P0 P1 | P0 P1] - z murem, klifem, budynkiem)
i robi WERSJE map tylko do zdjęć mapy wyspy: na kratkach kopii grunt z kratki tuż za nią (kształty autokafli przeliczone), nic nad
nim, bez zdarzeń. Gra i data/ się nie zmieniają.
  Która strona to kopia: ta, po której mur nie idzie dalej niż 2 kratki; mapa 8 (miasto w murach) jest zawsze wzorem; przy równych
  - mapa nie gracza; dwie mapy gracza bez rozstrzygnięcia - pominięte (wypisane).
  python tools/mapy/kopie_murow.py [--dane-z <folder>]   -> tools/mapy/staging_bez_kopii/data/MapNNN.json + kopie_murow.json (spis)
Potem zdjęcia: GAME_OVERLAY=tools/mapy/staging_bez_kopii MAPY=... node tools/mapy/mapa_prawdziwa_zrzuty.js (tools/mapy/mapa_prawdziwa_obrazy.py)."""
import json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OUT = os.path.join(HERE, "staging_bez_kopii", "data")
USER = (1, 3, 4, 8, 13, 23, 24, 25, 26, 111)
TOWN = 8
DANE_Z = sys.argv[sys.argv.index("--dane-z") + 1] if "--dane-z" in sys.argv else None
uk = {int(k): v for k, v in json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"].items()}
maps = {}


def mapa(m):
    if m not in maps:
        p = os.path.join(DANE_Z, "Map%03d.json" % m) if DANE_Z and os.path.exists(os.path.join(DANE_Z, "Map%03d.json" % m)) else os.path.join(ROOT, "data", "Map%03d.json" % m)
        maps[m] = json.load(open(p, encoding="utf-8"))
    return maps[m]


def cell(m, x, y):
    d = mapa(m); w, h = d["width"], d["height"]
    if not (0 <= x < w and 0 <= y < h): return None
    v = [W.at(d, z, x, y) for z in range(4)]
    k = lambda a: ("A", (a - 2048) // 48) if a >= 2048 else ("T", a)
    return (k(v[0]), k(v[1]), v[2], v[3])


def struct(c):   # a wall / cliff / roof / building: an A3 / A4 tile on layer 0-1, or a B-E tile on layer 2-3
    if c is None: return False
    if any(kk[0] == "A" and kk[1] >= 48 for kk in c[:2]): return True
    return bool(c[2] or c[3])


copies = {}   # map -> {(x, y): (sx, sy)} - a copied cell and the cell whose ground it gets
skipped = []
ids = sorted(uk)
for a in ids:
    for b in ids:
        if a == b: continue
        ra, rb = uk[a], uk[b]
        if ra["y0"] + ra["wys"] == rb["y0"]:   # (a above b)
            lo, hi = max(ra["x0"], rb["x0"]), min(ra["x0"] + ra["szer"], rb["x0"] + rb["szer"])
            ca = lambda p, d: (p - ra["x0"], ra["wys"] - 1 - d); cb = lambda p, d: (p - rb["x0"], d)
        elif ra["x0"] + ra["szer"] == rb["x0"]:   # (a left of b)
            lo, hi = max(ra["y0"], rb["y0"]), min(ra["y0"] + ra["wys"], rb["y0"] + rb["wys"])
            ca = lambda p, d: (ra["szer"] - 1 - d, p - ra["y0"]); cb = lambda p, d: (d, p - rb["y0"])
        else:
            continue
        for p in range(lo, hi):
            A = [cell(a, *ca(p, d)) for d in range(3)]; B = [cell(b, *cb(p, d)) for d in range(3)]
            if None in A[:2] or None in B[:2]: continue
            if not (A[1] == B[0] and A[0] == B[1] and (struct(B[0]) or struct(B[1]))): continue
            if TOWN in (a, b): into = b if a == TOWN else a
            elif struct(B[2]) and not struct(A[2]): into = a
            elif struct(A[2]) and not struct(B[2]): into = b
            elif (a in USER) != (b in USER): into = b if a in USER else a
            else: skipped.append((a, b, p)); continue
            c = ca if into == a else cb
            for d in (0, 1): copies.setdefault(into, {})[c(p, d)] = c(p, 2)

shutil.rmtree(os.path.dirname(OUT), ignore_errors=True)
os.makedirs(OUT)
spis = {}
for m, cells in sorted(copies.items()):
    d = mapa(m)
    for (x, y), (sx, sy) in cells.items():
        if not struct(cell(m, x, y)): continue   # (a gate's passage, a road through the copy: stays - the bridge still reaches the gate)
        g0 = W.at(d, 0, sx, sy)
        W.put(d, 0, x, y, 2048 + W.kind_of(g0) * 48 if g0 >= 2048 else g0)   # (an autotile: its kind, the shape worked out below)
        W.put(d, 1, x, y, 0)   # (the ground alone: an overlay - stones, earth spots - drawn on would come out as a rectangle)
        W.put(d, 2, x, y, 0); W.put(d, 3, x, y, 0); W.put(d, 4, x, y, 0)
    near = W.ring(cells.keys(), 1)
    W.reshape(d, 0, near); W.reshape(d, 1, near)
    gone = [e["id"] for e in d["events"] if e and (e["x"], e["y"]) in cells]
    d["events"] = [None if (e and e["id"] in gone) else e for e in d["events"]]
    open(os.path.join(OUT, "Map%03d.json" % m), "wb").write(W.map_text(d).encode("utf-8"))
    spis[m] = {"kratki": len(cells), "zdarzenia": gone}
    print("mapa %3d: %3d kratek kopii muru -> grunt, %d zdarzeń na nich (tylko do zdjęć)" % (m, len(cells), len(gone)))
json.dump({str(k): v for k, v in spis.items()}, open(os.path.join(HERE, "staging_bez_kopii", "kopie_murow.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if skipped: print("pominięte (dwie mapy gracza, nie wiadomo, która to kopia):", skipped)
print("mapy do zdjęć:", ",".join(str(m) for m in sorted(copies)))
