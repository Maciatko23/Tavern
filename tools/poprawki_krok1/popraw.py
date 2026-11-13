# -*- coding: utf-8 -*-
"""Poprawki po zamianie prostokatow (2026-11-09): Map003 (Kruczy Jar), Map020 (Dom dziadka), Map024 (niewidzialne sciany).
Czyta data/, zapisuje tylko tools/poprawki_krok1/staging/data/MapNNN.json.   python tools/poprawki_krok1/popraw.py"""
import copy, json, math, os, sys
import numpy as np
import cv2
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import wspolne as WS
import mapylib
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OUT = os.path.join(HERE, "staging", "data"); os.makedirs(OUT, exist_ok=True)
A2 = lambda k: 2048 + k * 48
kind = lambda v: (v - 2048) // 48 if v >= 2048 else None
L = lambda m: (m["width"], m["height"])


def load(n): return json.load(open("data/Map%03d.json" % n, encoding="utf-8"))
def save(m, n):
    m.pop("id", None)
    open(os.path.join(OUT, "Map%03d.json" % n), "wb").write(WS.map_text(m).encode("utf-8"))
def get(m, z, x, y): return m["data"][(z * m["height"] + y) * m["width"] + x]
def put(m, z, x, y, v): m["data"][(z * m["height"] + y) * m["width"] + x] = v
def ev(m, i):
    e = m["events"][i]; assert e and e["id"] == i; return e
def move(m, i, x, y): e = ev(m, i); e["x"], e["y"] = x, y
def clone(m, src, x, y, name=None):
    e = copy.deepcopy(ev(m, src)); e["id"] = len(m["events"]); e["x"], e["y"] = x, y
    if name: e["name"] = name
    m["events"].append(e); return e["id"]
def blocked_cells(m):
    mp = mapylib.Mapa(m["id"] if "id" in m else 3, raw=m)
    s = set()
    for e in m["events"]:
        if e and (e["pages"][0]["image"]["characterName"] or e["pages"][0]["image"]["tileId"] or e["note"]):
            s |= set(mapylib.Zdarzenie(e, mp).komorki())
        elif e: s.add((e["x"], e["y"]))
    return s


# ------------------------------------------------------------------ invisible walls (A5 'grass' + region 2, nothing above)
def invisible_walls(m, mid):
    W, H = L(m); d = m["data"]; n = W * H
    taken = {(e["x"], e["y"]) for e in m["events"] if e}
    mp = mapylib.Mapa(mid, raw=m)
    for e in m["events"]:
        if e: taken |= set(mapylib.Zdarzenie(e, mp).komorki())
    cells = []
    for y in range(H):
        for x in range(W):
            i = y * W + x
            if not (d[i] == 1633 and d[5 * n + i] in (2, 3) and not d[n + i] and not d[2 * n + i] and not d[3 * n + i]): continue
            if x <= 1 or y <= 1 or x >= W - 2 or y >= H - 2: continue          # the world's outer edge stays
            if (x, y) in taken: continue
            cells.append((x, y))
    cs = set(cells)
    for (x, y) in cells:
        votes = {}
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < W and 0 <= yy < H) or (xx, yy) in cs: continue
                v = d[yy * W + xx]; k = kind(v)
                if k is not None and 16 <= k < 48 and not d[n + yy * W + xx]:
                    votes[k] = votes.get(k, 0) + 1.0 / (1 + dx * dx + dy * dy)
        k = max(votes, key=votes.get) if votes else 16
        d[y * W + x] = A2(k); d[5 * n + y * W + x] = 0
    WS.reshape(m, 0, WS.ring(cs, 2))
    print("   Map%03d: niewidzialne sciany usuniete: %d kratek" % (mid, len(cells)))
    return cells


# ------------------------------------------------------------------ rounding of a dark-grass overlay patch
def round_patch(m, z, k_over, win, fence, seed, base=16, bite=2.0, fall=4.2, ell=None):
    """re-draw the cells of overlay kind k_over inside win=(x0,y0,x1,y1) with a rounded, wavy outline that keeps `bite` cells from the fence"""
    W, H = L(m); x0, y0, x1, y1 = win
    a = np.array(m["data"], dtype=np.int64).reshape(6, H, W)
    k = np.where(a[z] >= 2048, (a[z] - 2048) // 48, -1)
    M = (k == k_over).astype(np.float32)
    rng = np.random.default_rng(seed)
    noise = cv2.resize(rng.random((H // 4 + 2, W // 4 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    soft = cv2.GaussianBlur(M, (0, 0), 2.8) + (noise - 0.5) * 0.55
    fm = np.ones((H, W), np.uint8)
    for (x, y) in fence: fm[y, x] = 0
    dist = cv2.distanceTransform(fm, cv2.DIST_L2, 3)
    dist2 = dist + (cv2.resize(rng.random((H // 3 + 2, W // 3 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC) - 0.5) * 3.0
    score = soft - 0.9 * np.clip((fall - dist2) / (fall - bite), 0, 1)
    ok = (score > 0.5) & (dist > bite)
    if ell:
        cx, cy, rx, ry = ell; yy, xx = np.mgrid[0:H, 0:W]
        ok &= (np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) + (noise - 0.5) * 0.35) < 1.0
    want = ok.astype(np.uint8)
    want = cv2.morphologyEx(want, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))).astype(bool)
    ev_cells = {(e["x"], e["y"]) for e in m["events"] if e and e["pages"][0]["image"]["characterName"]}
    ch = set()
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            cur = k[y, x] == k_over
            if want[y, x] and not cur and a[z, y, x] == 0 and not a[3, y, x] and kind_ok(a, x, y, base): a[z, y, x] = A2(k_over); ch.add((x, y))
            elif not want[y, x] and cur: a[z, y, x] = 0; ch.add((x, y))
    m["data"][:] = [int(v) for v in a.reshape(-1)]
    WS.reshape(m, z, WS.ring(ch, 2))
    return ch
def kind_ok(a, x, y, base): return (a[0, y, x] - 2048) // 48 in (16, 17, 27) if a[0, y, x] >= 2048 else False


def paint_road(m, cells, z=1, k=39):
    for (x, y) in cells: put(m, z, x, y, A2(k))
    WS.reshape(m, z, WS.ring(set(cells), 2))


def blob_rows(rows, k=0):
    """rows: {y: (xa, xb)} -> set of cells"""
    return {(x, y) for y, (a, b) in rows.items() for x in range(a, b + 1)}


# ------------------------------------------------------------------ fence helpers
def set_fence(m, x, y, t, z=3):
    put(m, z, x, y, t)


def fix_fence_ring(m, fx0, fy0, fx1, fy1, gates, vgate_posts=True):
    """corners as rails (west corners 208 = post left, east corners 209 = post right), posts at the ends of every gate"""
    W, H = L(m)
    for (x, y, t) in ((fx0, fy0, 208), (fx1, fy0, 209), (fx0, fy1, 208), (fx1, fy1, 209)): put(m, 3, x, y, t)
    # horizontal gate ends: the cell next to the gap must carry a post on the gap side
    for side, y in (("top", fy0), ("bottom", fy1)):
        g = gates.get(side)
        if not g: continue
        a, b = min(g), max(g)
        put(m, 3, a - 1, y, 209)       # post on its right edge
        put(m, 3, b + 1, y, 208)       # post on its left edge
    # vertical gate ends: a second post (layer 2) beside the run's own post makes a heavier gate post
    for side, x, own, extra in (("left", fx0, 216, 217), ("right", fx1, 217, 216)):
        g = gates.get(side)
        if not g or not vgate_posts: continue
        a, b = min(g), max(g)
        for y in (a - 1, b + 1):
            assert get(m, 3, x, y) == own, (side, y, get(m, 3, x, y))
            put(m, 2, x, y, extra)


def fence_cells(fx0, fy0, fx1, fy1):
    return ({(x, y) for x in range(fx0, fx1 + 1) for y in (fy0, fy1)} | {(x, y) for y in range(fy0, fy1 + 1) for x in (fx0, fx1)})


# ================================================================== MAP 003
def map003():
    m = load(3); m["id"] = 3; W, H = L(m)
    F = (42, 34, 77, 59); G = {"top": range(68, 72), "left": range(46, 49), "right": range(43, 47), "bottom": range(48, 52)}
    fix_fence_ring(m, *F, G)
    # 1: pines on the north fence line step out, north of the fence (trunks 2-3 cells off, crowns clear of the rails)
    for i, (x, y) in {27: (41, 32), 60: (48, 32), 61: (51, 32), 10: (54, 32), 23: (56, 31), 32: (61, 32), 7: (63, 32)}.items(): move(m, i, x, y)
    move(m, 362, 74, 31)       # the bush that stood on the north gate's road
    # 2: ragged forest edge: the dark ground bulges out in a round shape, young trees and a bush of the same kinds stand out on the glade
    for y, ext in {36: 61, 37: 62, 38: 63, 39: 64, 40: 65, 41: 66, 42: 66, 43: 66, 44: 65, 45: 65, 46: 64, 47: 63}.items():
        for x in range(60, ext + 1):
            if get(m, 1, x, y) == 0 and kind(get(m, 0, x, y)) == 16 and get(m, 3, x, y) == 0: put(m, 1, x, y, A2(21))
    # the old straight edge cells beyond the bulge's reach are trimmed (rows 39-45 end at x63 now rounded)
    cells = {(x, y) for y in range(34, 50) for x in range(56, 70)}
    WS.reshape(m, 1, cells)
    clone(m, 31, 65, 37); clone(m, 20, 66, 41); clone(m, 116, 65, 44); clone(m, 116, 67, 39); clone(m, 362, 64, 38 + 4)
    # 11, 12 + SE corner done in fix_fence_ring. roads through the east gate
    cs = {(x, y) for (x, y) in blob_rows({44: (75, 79), 45: (75, 80), 46: (75, 79)})}
    for (x, y) in list(cs):
        if get(m, 3, x, y) or get(m, 2, x, y): cs.discard((x, y))
    paint_road(m, cs)
    for (x, y) in cs: put(m, 5, x, y, get(m, 5, x, y))
    invisible_walls(m, 3)
    save(m, 3)
    return m


# ================================================================== MAP 020
def map020():
    m = load(20); m["id"] = 20; W, H = L(m)
    F = (36, 38, 56, 53); G = {"bottom": range(45, 48)}
    fix_fence_ring(m, *F, G)
    put(m, 3, 44, 53, 209)
    fence = fence_cells(*F)
    # 4, 5, 6: pines off the fences
    for i, (x, y) in {90: (33, 41), 116: (47, 34), 122: (50, 36), 36: (59, 48), 78: (39, 61)}.items(): move(m, i, x, y)
    # 1, 2, 3: dark-grass patches, rounded and away from the fence
    round_patch(m, 1, 20, (0, 40, 38, 58), fence, 201)
    round_patch(m, 1, 20, (55, 30, 78, 60), fence, 202, ell=(63.5, 43.5, 6.6, 11.8))
    # 9: the cottage path: 3-wide dirt road from the door through the gate to the outer road
    old = [(46, y) for y in range(46, 54)]
    for (x, y) in old: put(m, 0, x, y, A2(16))
    WS.reshape(m, 0, WS.ring(set(old), 2))
    rows = {47: (45, 47), 48: (45, 47), 49: (45, 47), 50: (45, 47), 51: (45, 47), 52: (45, 47), 53: (45, 47), 54: (45, 47)}
    for (x, y) in list(blob_rows(rows)):
        if get(m, 1, x, y) != 0: put(m, 1, x, y, 0)
    paint_road(m, blob_rows(rows))
    # 12: the stone strip at x15 becomes a normal road joining the two ends
    old = [(15, y) for y in range(15, 22)]
    for (x, y) in old: put(m, 0, x, y, A2(16))
    WS.reshape(m, 0, WS.ring(set(old), 2))
    rows = {y: (14, 16) for y in range(15, 22)}
    for (x, y) in blob_rows(rows): put(m, 1, x, y, 0)
    paint_road(m, blob_rows(rows) | {(14, 22), (15, 22), (16, 22), (15, 14), (14, 14)})
    # 11, 13, 14: loose clay patches that lead nowhere go
    for (a, b, c, d) in ((32, 10, 45, 22), (76, 8, 84, 12), (73, 60, 76, 66), (82, 61, 90, 68)):
        rm = set()
        for y in range(b, d + 1):
            for x in range(a, c + 1):
                ch = False
                if kind(get(m, 1, x, y)) in (17, 39): put(m, 1, x, y, 0); ch = True
                if kind(get(m, 0, x, y)) == 17: put(m, 0, x, y, A2(16)); ch = True
                if ch: rm.add((x, y))
        WS.reshape(m, 0, WS.ring(rm, 2)); WS.reshape(m, 1, WS.ring(rm, 2))
    save(m, 20)
    return m


def map024():
    m = load(24); m["id"] = 24
    invisible_walls(m, 24)
    save(m, 24)


if __name__ == "__main__":
    map003(); map020(); map024()
    print("ok")
