# -*- coding: utf-8 -*-
"""Mapa wyspy: wszystkie mapy świata na schemacie (gracz 2026-11-07: „czy wszystkie mapy gry są widoczne na mapie całej wyspy?” ->
„ok” na poprawkę). Do js/plugins/MapaWyspy_Data.js:
  - ramka (pudełko wyspy) powiększona tak, żeby mieściły się w całości wszystkie prostokąty map świata (964 Zachodni Brzeg wystawał
    z lewej, 931 Grań nad szczytem u góry); wszystkie współrzędne (MIEJSCA, PODZIEMIA, BRZEG, BRZEGI, KORYTO, LAS) przeliczone na nią
    - kontur się nie zmienia (ląd tych map i tak był w masce, poza ramką było samo morze),
  - 14 map brzegowych bez nazwy dostaje swoje miejsce ({ ..., maly: true }: mniejszy punkt i napis, widać je dopiero po odkryciu,
    bez „?”): punkt w najgłębszym miejscu lądu swojej mapy, strona napisu tam, gdzie najmniej zasłania,
  - drogi do nich: każde przejście (styk krawędzi, zdarzenie przejścia) między nową mapą a sąsiednim miejscem; dwie dawne drogi,
    które szły przez nie (4-168 przez 900, 18-155 przez 963 i 950), dostają trzecie pole [przez...] - widać je, dopóki te mapy
    nie są odkryte. Wóz (Woz.js) i podróżni (Podroznicy.js) liczą jak dotąd: bez małych miejsc.
  python tools/mapy/mapa_wyspy_brzegowe.py              (kopia w tools/mapy/staging_mapa/js/plugins)
  python tools/mapy/mapa_wyspy_brzegowe.py --wykonaj    (do js/plugins; kopia: tools/mapy/kopie_zapasowe/<czas>_brzegowe)"""
import datetime, json, os, re, shutil, sys
import numpy as np
import cv2
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import swiat_mapa_wyspy as S
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging_mapa", "js", "plugins")
NOWE = [900, 901, 910, 912, 914, 931, 933, 934, 950, 960, 961, 962, 963, 964]
PRZEZ = {(4, 168): [900], (18, 155): [963, 950]}   # (the old roads through them: shown while these are not known)
MARGIN = 3   # world cells round the outermost map

path = os.path.join(PLUG, "MapaWyspy_Data.js")
raw = open(path, "rb").read()
if b"\r\n" in raw: raise SystemExit("CRLF")
src = raw.decode("utf-8")
if "maly: true" in src: raise SystemExit("już zrobione: MapaWyspy_Data.js ma małe miejsca")

# the old box: exactly as swiat_mapa_wyspy.py made it (the mask with the islands' land, PAD round it)
uk = S.uklad(); M = S.maska(); ys, xs = np.where(M); wl = S.wyspy_lad(uk); M = M.copy()
for m, (cells, _) in wl.items():
    for (x, y) in cells:
        if 0 <= y < M.shape[0] and 0 <= x < M.shape[1]: M[y, x] = True
ox0, oy0, ox1, oy1 = xs.min() - S.PAD, ys.min() - S.PAD, xs.max() + S.PAD, ys.max() + S.PAD
# the new box: every map's rectangle in it
nx0 = min(ox0, min(r["x0"] for r in uk.values()) - MARGIN); ny0 = min(oy0, min(r["y0"] for r in uk.values()) - MARGIN)
nx1 = max(ox1, max(r["x0"] + r["szer"] for r in uk.values()) + MARGIN); ny1 = max(oy1, max(r["y0"] + r["wys"] for r in uk.values()) + MARGIN)
OW, OH, NW, NH = ox1 - ox0, oy1 - oy0, nx1 - nx0, ny1 - ny0
print("ramka: stara (%d,%d) %dx%d -> nowa (%d,%d) %dx%d" % (ox0, oy0, OW, OH, nx0, ny0, NW, NH))
tx = lambda v: (v * OW + ox0 - nx0) / NW
ty = lambda v: (v * OH + oy0 - ny0) / NH

# 1. the shapes: every [x, y] pair of BRZEG, BRZEGI, KORYTO, LAS (3 decimals, as written)
def block(name):
    a = src.index("    const %s = [" % name); b = src.index("\n    ];", a) + len("\n    ];")
    return a, b
for name in ("BRZEG", "BRZEGI", "KORYTO", "LAS"):
    a, b = block(name)
    part = re.sub(r"\[(-?\d+\.\d+), (-?\d+\.\d+)\]", lambda m: "[%.3f, %.3f]" % (tx(float(m.group(1))), ty(float(m.group(2)))), src[a:b])
    src = src[:a] + part + src[b:]
# 2. the places and the underground's point
def place_xy(m):
    return "x: %.3f, y: %.3f" % (tx(float(m.group(1))), ty(float(m.group(2))))
a = src.index("    const MIEJSCA = ["); b = src.index("    const DROGI = [")
src = src[:a] + re.sub(r"x: (-?\d+\.\d+), y: (-?\d+\.\d+)", place_xy, src[a:b]) + src[b:]

# 3. the new places: the deepest land of the map (its own tiles; sandbar = sea as for the islands), the name = its display name
def deepest(m):
    d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8"))
    W, H, t = d["width"], d["height"], d["data"]; n = W * H
    land = np.array([[0 if (2048 <= t[y * W + x] < 2816) or t[5 * n + y * W + x] == 61 else 1 for x in range(W)] for y in range(H)], np.uint8)
    dist = cv2.distanceTransform(np.pad(land, 1), cv2.DIST_L2, 5)[1:-1, 1:-1]
    yy, xx = np.unravel_index(np.argmax(dist), dist.shape)
    r = uk[m]
    return d["displayName"], ((r["x0"] + xx + 0.5 - nx0) / NW, (r["y0"] + yy + 0.5 - ny0) / NH)
# the badge's place: deep in the map's own land and off the other places' names and points (the menu's field ~640 px wide)
FW = 640.0; FH = FW / float(re.search(r"const ASPEKT = ([\d.]+);", src).group(1))
def lab_box(x, y, name, side, size=16, r=6):
    px, py, w, h = x * FW, y * FH, len(name) * size * 0.5, size * 1.4
    if side == "s": return (px - w / 2, py + r + 4, px + w / 2, py + r + 4 + h)
    if side == "n": return (px - w / 2, py - r - 4 - h, px + w / 2, py - r - 4)
    if side == "e": return (px + r + 7, py - h / 2, px + r + 7 + w, py + h / 2)
    return (px - r - 7 - w, py - h / 2, px - r - 7, py + h / 2)
def overlap(a, b): return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))
taken = []
for m_ in re.finditer(r'(?:\{ id: (\d+)|const PODZIEMIA = \{ id: "podziemia"), nazwa: "([^"]*)", x: ([\d.]+), y: ([\d.]+), lab: "(\w)"', src):
    x_, y_ = float(m_.group(3)), float(m_.group(4))
    taken += [lab_box(x_, y_, m_.group(2), m_.group(5)), (x_ * FW - 9, y_ * FH - 9, x_ * FW + 9, y_ * FH + 9)]
def badge_spot(m):
    d = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % m), encoding="utf-8"))
    W, H, t = d["width"], d["height"], d["data"]; n = W * H
    land = np.array([[0 if (2048 <= t[y * W + x] < 2816) or t[5 * n + y * W + x] == 61 else 1 for x in range(W)] for y in range(H)], np.uint8)
    dist = cv2.distanceTransform(np.pad(land, 1), cv2.DIST_L2, 5)[1:-1, 1:-1]
    r = uk[m]; best = None
    for yy in range(0, H, 2):
        for xx in range(0, W, 2):
            if dist[yy, xx] < max(3.0, 0.35 * dist.max()): continue
            x = (r["x0"] + xx + 0.5 - nx0) / NW; y = (r["y0"] + yy + 0.5 - ny0) / NH
            box = (x * FW - 10, y * FH - 10, x * FW + 10, y * FH + 10)   # (the badge and a little air)
            cost = sum(overlap(box, o) for o in taken) * 10 - dist[yy, xx]
            if best is None or cost < best[0]: best = (cost, (x, y))
    taken.append((best[1][0] * FW - 10, best[1][1] * FH - 10, best[1][0] * FW + 10, best[1][1] * FH + 10))
    return d["displayName"], best[1]
pos = {m: badge_spot(m) for m in NOWE}
existing = [int(m.group(1)) for m in re.finditer(r'\{ id: (\d+), nazwa: "', src)]
new_items = ['        { id: %d, nazwa: "%s", x: %.3f, y: %.3f, maly: true }' % (m, pos[m][0], pos[m][1][0], pos[m][1][1]) for m in NOWE]
a2 = src.index("    const MIEJSCA = ["); b2 = src.index("\n    ];", a2)
src = src[:b2] + ",\n        // (2026-11-07) the edge maps: small places (seen once visited, not the cart's ways - MapaWyspy.js: maly)\n" + ",\n".join(new_items) + src[b2:]
# 4. the roads: from each new map to every map it has a way to (the world's links, the transfers), among the places
old = set(existing)
d_new, g = S.drogi(old | set(NOWE))
add = sorted(p for p in d_new if p[0] in NOWE or p[1] in NOWE)
a = src.index("    const DROGI = ["); b = src.index("\n    ];", a)
part = src[a:b]
for (p, q), via in PRZEZ.items():
    pat = "[%d, %d]" % (p, q)
    if part.count(pat) != 1: raise SystemExit("droga %s nie raz" % pat)
    part = part.replace(pat, "[%d, %d, [%s]]" % (p, q, ", ".join(map(str, via))))
rows = ["[%d, %d]" % r for r in add]
ln, txt = "        ", []
for r in rows:
    if len(ln) + len(r) > 150: txt.append(ln.rstrip()); ln = "        "
    ln += r + ", "
txt.append(ln.rstrip().rstrip(","))
part = part.rstrip() + ",\n        // (2026-11-07) the edge maps' ways (a third field [through...]: an old road seen until those maps are known)\n" + "\n".join(txt)
src = src[:a] + part + src[b:]
print("drogi: +%d do małych miejsc, %d dawne „przez”" % (len(add), len(PRZEZ)))

# 4b. the names as in an atlas: each place's name beside its point or out on the sea with a leader (mapa_wyspy_atlas.py)
import mapa_wyspy_atlas as ATL
a = src.index("    const DROGI = ["); b = src.index("\n    ];", a)
rd = [(x.strip('"'), y.strip('"')) for x, y in re.findall(r'\[("podziemia"|\d+), ("podziemia"|\d+)\]', src[a:b])]
src, n_names, n_lead, bad = ATL.place(src, rd)
print("napisy: %d miejsc, %d z kreską na morze%s" % (n_names, n_lead, "; ZACHODZĄ: %s" % bad if bad else ", nic nie zachodzi"))

# 5. the header
src = src.replace(" * @plugindesc Dane mapy wyspy: miejsca na zewnątrz i ich położenie na schemacie, drogi między nimi, wnętrza przypisane do miejsc. v2.0.0",
                  " * @plugindesc Dane mapy wyspy: miejsca na zewnątrz i ich położenie na schemacie, drogi między nimi, wnętrza przypisane do miejsc. v2.1.0")
src = src.replace("// the other places and roads as they were (a full regeneration now gives the edge seams' many roads - not on this sketch)\n",
                  "// the other places and roads as they were (a full regeneration now gives the edge seams' many roads - not on this sketch)\n"
                  "// (2026-11-07, tools/mapy/mapa_wyspy_brzegowe.py) every map of the world on the sketch: the box holds all their rectangles (the\n"
                  "// coordinates moved onto it), the 14 edge maps are small places (maly) with their ways; old roads through them [a, b, [through]]\n", 1)

# MapaWyspy.js: the atlas (every place named, leaders), the small places, the roads through (mapa_wyspy_atlas_js.py)
import mapa_wyspy_atlas_js as AJ
mw = AJ.patch(open(os.path.join(PLUG, "MapaWyspy.js"), "rb").read().decode("utf-8"))
def rep(s, old, new):
    if s.count(old) != 1: raise SystemExit("%r" % old[:60])
    return s.replace(old, new)
# Podroznicy.js: the places known counted as before (without the small ones)
po = open(os.path.join(PLUG, "Podroznicy.js"), "rb").read().decode("utf-8")
po = rep(po, """M.nodes().filter(n => n.state === "known").length""", """M.nodes().filter(n => n.state === "known" && !n.maly).length""")

# js/teksty/mapa_wyspy.txt: the list's heading
tp = os.path.join(ROOT, "js", "teksty", "mapa_wyspy.txt")
tt = open(tp, "rb").read().decode("utf-8")
nl = "\r\n" if "\r\n" in tt else "\n"

out = PLUG if "--wykonaj" in sys.argv else STG
os.makedirs(out, exist_ok=True)
tdir = os.path.join(os.path.dirname(out), "teksty"); os.makedirs(tdir, exist_ok=True)
if out == PLUG:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_brzegowe"); os.makedirs(kop, exist_ok=True)
    for f in ("MapaWyspy_Data.js", "MapaWyspy.js", "Podroznicy.js"): shutil.copy(os.path.join(PLUG, f), kop)
    shutil.copy(tp, kop)
    print("kopie:", kop)
open(os.path.join(tdir, "mapa_wyspy.txt"), "wb").write(tt.encode("utf-8"))
for f, s in (("MapaWyspy_Data.js", src), ("MapaWyspy.js", mw), ("Podroznicy.js", po)): open(os.path.join(out, f), "wb").write(s.encode("utf-8"))
print("zapisane w", out)
