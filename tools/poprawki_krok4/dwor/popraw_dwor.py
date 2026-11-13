# -*- coding: utf-8 -*-
"""Krok 4 planu poprawek map: Map024 Posiadlosc Lorda. TYLKO staging (tools/poprawki_krok4/dwor/staging/data/Map024.json).
  python tools/poprawki_krok4/dwor/popraw_dwor.py          (zapisuje staging + raport)
Poprawki (numery jak w docs/audyt_map/RAPORT.md): 4 luzne plytki bruku (zdjete), 5 droga o stalej szerokosci, 6 podworko ze studnia,
7 plat trawy (nakladka warstwy 1 zaokraglona), 8 ruina, 9 gaje (osobno sosny i sad), 10 kwiaty w kilku zagonach."""
import json, os, sys
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
for p in ("tools/rozszerzenia", "tools/mapy", "tools/wzgorza_popraw"): sys.path.insert(0, os.path.join(ROOT, p))
import wspolne as W
import mapylib as L
import popraw as P
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging", "data")
MID = 24
raw = open(os.path.join(ROOT, "data", "Map024.json"), "rb").read()
m = json.loads(raw.decode("utf-8"))
if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map024 nie jest w ukladzie edytora")
Wd, Hd, d = m["width"], m["height"], m["data"]
n = Wd * Hd
at = lambda z, x, y: d[z * n + y * Wd + x]
def put(z, x, y, v): d[z * n + y * Wd + x] = v
kind = lambda t: (t - 2048) // 48 if t >= 2048 else None
ev = {e["id"]: e for e in m["events"] if e}
before = L.Mapa(MID, raw=json.loads(raw.decode("utf-8")))
reach0 = before.flood(before.starty())
rep = []
c0, c1 = set(), set()          # changed cells to reshape (layer 0 / layer 1)
boxes = []                      # changed boxes (for the reachability check)
moved = {}
def move(eid, x, y):
    e = ev[eid]; moved[eid] = ((e["x"], e["y"]), (x, y)); e["x"], e["y"] = x, y
GR = 2048 + 16 * 48

# ---------------------------------------------------------------- 4. loose cobble slabs (kind 43 on layer 0 west of the road) -> grass
for y in range(88, 116):
    for x in range(19, 25):
        if kind(at(0, x, y)) == 43:
            put(0, x, y, GR); c0.add((x, y))
for y in (113, 114, 115):
    for x in range(19, 25):
        if y <= 114 and kind(at(0, x, y)) == 27: put(0, x, y, GR); c0.add((x, y))
boxes.append((19, 88, 25, 115))
rep.append("4: zdjete plytki bruku (20-23, 90/98/102/113) i ciemna plamka (20-22,114): %d kratek" % len(c0))

# ---------------------------------------------------------------- 5. the road: x 26-28 constant, two 1-cell steps to 24-26 (was a waist at y101 and a 2-cell jog)
RD = 2048 + 17 * 48
def road(y, xs):
    for x in range(23, 31):
        want = x in xs
        if kind(at(0, x, y)) == 17 and not want: put(0, x, y, GR); c0.add((x, y))
        if want and kind(at(0, x, y)) != 17: put(0, x, y, RD); c0.add((x, y))
for y in range(89, 107): road(y, (26, 27, 28))
for y in (107, 108): road(y, (25, 26, 27))
for y in range(109, 115): road(y, (24, 25, 26))
boxes.append((22, 88, 31, 115))
rep.append("5: droga stale 3 kratki (26-28 do y106, 25-27 y107-108, 24-26 od y109)")

# ---------------------------------------------------------------- 6. the well yard
# fence: close the gap (55,77) with a gate posts-look, remove the fence stub south of the shed, trees off the shed and the yard
put(2, 55, 77, 224); put(3, 55, 77, 225); put(5, 55, 77, 3)   # the gate: two posts, a one-cell opening to the north lawn
for y in (86, 87, 88):
    if at(3, 51, y) == 224: put(3, 51, y, 0)
move(97, 61, 84)       # the big green tree in the yard's floor -> east lawn
move(106, 61, 72)      # the spruces on the fence's north-east corner -> the lawn east of it
move(104, 62, 79)
move(99, 54, 93)       # the red tree under the shed roof -> south lawn
move(168, 45, 93)      # the dark spruce at the shed's west end
move(107, 59, 91)      # the small tree at the shed's east end
boxes.append((47, 74, 60, 95))

# ---------------------------------------------------------------- 8. the ruin: the old wall/platform is gone (ground back to grass), a small ruin of event pictures on flat ground
orig = json.loads(raw.decode("utf-8"))["data"]
for y in range(59, 67):
    for x in range(18, 28):
        o0 = orig[y * Wd + x]
        put(0, x, y, GR if P.a5_of(o0) is not None else o0)
        if y <= 65:
            for z in (2, 3):
                if at(z, x, y): put(z, x, y, 0)
        c0.add((x, y)); c1.add((x, y))
tmpl = json.loads(json.dumps(ev[6]))
def new_event(eid, name, char, x, y):
    assert m["events"][eid] is None
    e = json.loads(json.dumps(tmpl)); e["id"] = eid; e["name"] = name; e["x"] = x; e["y"] = y
    e["pages"][0]["image"]["characterName"] = char
    m["events"][eid] = e; ev[eid] = e
new_event(176, "Złamana kolumna", "!$Rock_Column", 21, 61)
new_event(183, "Kikut kolumny", "!$Rock_Spire", 25, 61)
new_event(202, "Splot gałęzi", "!$Bush_Bare_Wide", 23, 61)
new_event(204, "Powalona płyta", "!$Rock_Slab", 23, 63)
if kind(at(0, 27, 63)) == 27: put(0, 27, 63, GR)      # a lone dark cell left of the old dark patch
move(62, 28, 58)
boxes.append((17, 58, 28, 68))
rep.append("8: platforma zdjeta (trawa); ruina z obrazkow zdarzen na rownym gruncie: kolumna (21,61), kikut (25,61), krzak (23,61), powalona plyta (23,63) - nowe zdarzenia 176 183 202 204 (bez notatek, ozdoba); sosna 62 -> (28,58)")

# leftovers: the grey frame (layer 1 kind 46) where slabs were, the single dirt cells under the old log places
for y in range(88, 117):
    for x in range(19, 26):
        if kind(at(1, x, y)) == 46: put(1, x, y, 0); c1.add((x, y))
for (x, y) in ((4, 36), (16, 41)):
    if kind(at(0, x, y)) in (17, 24, 25, 26): put(0, x, y, GR); c0.add((x, y))

# ---------------------------------------------------------------- 9. the copses: pines west, an orchard (apples + pears, regular 4-cell grid) east
PINES = {5: (8, 33), 45: (4, 33), 49: (12, 33), 56: (6, 37), 57: (10, 37), 59: (4, 41), 92: (8, 41)}
for eid, (x, y) in PINES.items(): move(eid, x, y)
FRUIT = [46, 50, 51, 61, 116, 117, 123, 130]       # apples
PEARS = [48, 67]
slots = [(x, y) for y in (40, 44) for x in (13, 17, 21, 25, 29)]
pear_slots = [(21, 40), (21, 44)]
for eid, s in zip(PEARS, pear_slots): move(eid, *s)
apple_slots = [s for s in slots if s not in pear_slots]
for eid, s in zip(FRUIT, apple_slots): move(eid, *s)
move(47, 2, 37); move(66, 11, 43)
boxes.append((2, 31, 31, 46))
rep.append("9: 7 sosen w luznym gaju (4-12, 33-41, odstep 4), 10 drzew owocowych w siatce 4 kratki (13-29 x 40/44), klody przy nich")

# the dirt spur beside the road (x29-30, y90-95) left a thin grass sliver between it and the road: its first part merges into the road
for y in (90, 91, 92):
    for x in (29, 30):
        if kind(at(1, x, y)) == 17: put(1, x, y, 0); c1.add((x, y))
for y in (93, 94, 95):
    for x in (29, 30, 31, 32):
        if kind(at(1, x, y)) == 17: put(1, x, y, 0); put(0, x, y, RD); c0.add((x, y)); c1.add((x, y))
for x in (55, 56, 57):                      # the stray dirt strip under the shed's east end
    if kind(at(1, x, 86)) == 17: put(1, x, 86, 0); c1.add((x, 86))
# the lone dirt cell on the lawn (76,56)
if kind(at(0, 76, 56)) in (24, 25, 26): put(0, 76, 56, GR); c0.add((76, 56))

# ---------------------------------------------------------------- 10. flowers (layer 1 kinds 28 29 31) -> a few compact beds
FL = {28, 29, 31}
BOX = (58, 56, 96, 88)
rem = set()
for y in range(BOX[1], BOX[3] + 1):
    for x in range(BOX[0], BOX[2] + 1):
        if kind(at(1, x, y)) in FL: put(1, x, y, 0); rem.add((x, y)); c1.add((x, y))
rep.append("10: zdjete kwiaty (kratek: %d)" % len(rem))

# ---------------------------------------------------------------- 7. the grass-shade overlay (layer 1 kind 21): round the sharp-sided patches
OV = (44, 50, 84, 87)
KEEPFIX = (49, 74, 58, 90)           # the well yard keeps its own grass under the shed
def inbox(x, y, b): return b[0] <= x <= b[2] and b[1] <= y <= b[3]
x0, y0, x1, y1 = OV
w, h = x1 - x0 + 1, y1 - y0 + 1
M = np.zeros((h, w), np.float32); allow = np.zeros((h, w), bool)
for y in range(y0, y1 + 1):
    for x in range(x0, x1 + 1):
        t1 = at(1, x, y); k0 = kind(at(0, x, y))
        if kind(t1) == 21: M[y - y0, x - x0] = 1
        free = (t1 == 0 or kind(t1) == 21) and k0 in (16, 27) and not inbox(x, y, KEEPFIX)
        allow[y - y0, x - x0] = free
for (x, y) in rem:
    if inbox(x, y, OV) and allow[y - y0, x - x0]: M[y - y0, x - x0] = 1
rng = np.random.RandomState(7)
def vnoise(shape, scale, seed):
    r = np.random.RandomState(seed); g = r.rand(shape[0] // scale + 3, shape[1] // scale + 3).astype(np.float32)
    return cv2.resize(g, (shape[1] // scale * scale + 3 * scale, shape[0] // scale * scale + 3 * scale), interpolation=cv2.INTER_CUBIC)[:shape[0], :shape[1]]
Gs = cv2.GaussianBlur(M, (0, 0), 2.2, borderType=cv2.BORDER_REFLECT)
Mn = (Gs + (vnoise(M.shape, 7, 3) - 0.5) * 0.55 + (vnoise(M.shape, 3, 5) - 0.5) * 0.28 > 0.5)
# protect the cells of old overlay not allowed (keep as they were) and drop specks / fill pin holes
Mn = np.where(allow, Mn, M > 0.5).astype(np.uint8)
nl, lab, st, _ = cv2.connectedComponentsWithStats(Mn, connectivity=4)
for i in range(1, nl):
    if st[i][4] < 9: Mn[lab == i] = 0
inv = (1 - Mn).astype(np.uint8)
nl, lab, st, _ = cv2.connectedComponentsWithStats(inv, connectivity=4)
for i in range(1, nl):
    if st[i][4] < 5 and st[i][0] > 0 and st[i][1] > 0: Mn[lab == i] = 1
chg = 0
for y in range(y0, y1 + 1):
    for x in range(x0, x1 + 1):
        if not allow[y - y0, x - x0]: continue
        t1 = at(1, x, y); want = bool(Mn[y - y0, x - x0])
        if want and t1 == 0: put(1, x, y, 2048 + 21 * 48); c1.add((x, y)); chg += 1
        if not want and kind(t1) == 21: put(1, x, y, 0); c1.add((x, y)); chg += 1
rep.append("7: nakladka cienia trawy (warstwa 1, rodzaj 21) zaokraglona w ramce %s: %d kratek zmienionych" % (OV, chg))

# ---------------------------------------------------------------- 10b. the beds
occ = {(e["x"], e["y"]) for e in m["events"] if e}
avoid = [(79, 62, 83, 64), (79, 82, 80, 82)]            # the gamekeeper's lodge, the feeder
spots = [(81, 65), (91, 80), (86, 72), (66, 98), (27, 89), (28, 89)]
placed = set()
def bed_ok(bx, by, bw, bh):
    for y in range(by - 2, by + bh + 2):
        for x in range(bx - 2, bx + bw + 2):
            if not (0 <= x < Wd and 0 <= y < Hd): return False
            core = bx <= x < bx + bw and by <= y < by + bh
            if (x, y) in placed: return False
            if (x, y) in occ and (core or True) and bx - 1 <= x < bx + bw + 1 and by - 1 <= y < by + bh + 1: return False
            if core:
                if kind(at(0, x, y)) not in (16, 27): return False
                t1 = at(1, x, y)
                if t1 and kind(t1) not in (21,): return False
                if any(inbox(x, y, (a - 1, b - 1, c + 1, e + 1)) for (a, b, c, e) in avoid): return False
                if any(abs(x - sx) <= 2 and abs(y - sy) <= 2 for (sx, sy) in spots): return False
                if any(at(z, x, y) for z in (2, 3)): return False
    return True
BEDS = [("A", 70, 67, 6, 4), ("B", 85, 67, 5, 4), ("C", 68, 77, 5, 3), ("D", 86, 77, 6, 4), ("E", 76, 72, 4, 4)]
FLW = 2048 + 28 * 48
for (nm, cx, cy, bw, bh) in BEDS:
    done = False
    for r in range(0, 8):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r or done: continue
                bx, by = cx - bw // 2 + dx, cy - bh // 2 + dy
                if bed_ok(bx, by, bw, bh):
                    for j in range(bh):
                        for i in range(bw):
                            if ((i + 0.5 - bw / 2) / (bw / 2)) ** 2 + ((j + 0.5 - bh / 2) / (bh / 2)) ** 2 > 1.0: continue     # rounded (oval) bed
                            put(1, bx + i, by + j, FLW); c1.add((bx + i, by + j))
                    placed |= {(bx + i, by + j) for j in range(bh) for i in range(bw)}
                    rep.append("   zagon %s: %dx%d na (%d,%d)" % (nm, bw, bh, bx, by)); done = True
    if not done: rep.append("   UWAGA: zagon %s bez miejsca" % nm)
boxes.append((58, 56, 96, 88))
boxes.append((44, 50, 84, 87))

# ---------------------------------------------------------------- autotiles round everything that changed
W.reshape(m, 0, W.ring(c0, 1))
W.reshape(m, 1, W.ring(c1 | c0, 1))

# ---------------------------------------------------------------- checks
after = L.Mapa(MID, raw=m)
reach1 = after.flood(after.starty())
inb = lambda c: any(b[0] - 1 <= c[0] <= b[2] + 1 and b[1] - 1 <= c[1] <= b[3] + 1 for b in boxes)
lost = sorted(c for c in reach0 - reach1 if not inb(c))
rep.append("osiagalne: przed %d, po %d, utracone poza zmienionymi ramkami: %d %s" % (len(reach0), len(reach1), len(lost), lost[:10]))
rep.append("przesuniete zdarzenia: " + ", ".join("%d %s->%s" % (k, v[0], v[1]) for k, v in sorted(moved.items())))
# events: index == id
assert all((e is None) or m["events"][i]["id"] == i for i, e in enumerate(m["events"]))
if __name__ == "__main__":
    for r in rep: print(r)
    out = W.map_text(m).encode("utf-8")
    assert json.loads(out.decode("utf-8")) == m
    assert b"\r" not in out
    os.makedirs(STG, exist_ok=True)
    open(os.path.join(STG, "Map024.json"), "wb").write(out)
    print("zapisano", len(out), "bajtow")
