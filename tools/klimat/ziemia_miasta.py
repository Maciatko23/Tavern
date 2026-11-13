# -*- coding: utf-8 -*-
"""Klimat podłoża i murów Kruczogrodu (gracz 2026-11-09: „wszystko co się da i doda klimatu”) - gotowe obrazki, wypalane z kafli mapy:
  1. zużycie bruku: wydeptany, ciemniejszy środek ulic (całe kamienie), jaśniejsze kamienie przy brzegach, mech w fugach przy
     krawężnikach i u stóp murów, błoto przy bramach, w podwórzu stajni i przy zagrodach targu zwierząt;
  2. cień kontaktowy: miękki ciemny pas u stóp ścian, płotów, beczek, skrzyń i stałych rzeczy-zdarzeń (wozy, ławy, kosze, lampy);
  3. koleiny i odciski kopyt na drogach od bram, na podwórzu stajni, przy zagrodach i postoju wozu (37,108);
  4. słoma i siano w podwórzu stajni, przy stodole i spichlerzu; jesienią liście pod drzewami, wiosną płatki w sadzie;
  8. zacieki, wilgoć i mech u dołu ścian (więcej na murze miejskim), sadza wokół kominów (mocniej nad kuźniami), pęknięcia muru;
  9. bluszcz (kawałki Winlu z arkusza B) na kilku ścianach i na murze; jesienią przebarwiony.
Kawałki 12 x 12 kratek: img/klimat/Map008/z_<cx>_<cy>.png (cały rok) i z_<cx>_<cy>_p<0..3>.png (pora roku: płatki / bluszcz / liście),
tylko niepuste; spis kawałków wpisany w js/plugins/Klimat_Ziemia.js (między znacznikami). Wszystko z kafli i zdarzeń mapy - po zmianach
mapy w edytorze wystarczy uruchomić znowu.
  python tools/klimat/ziemia_miasta.py                 (wypala kawałki + spis)
  python tools/klimat/ziemia_miasta.py --podglad x0,y0,x1,y1 plik.png [--pora 2]   (mapa z nakładką, 1:1, bez zapisu kawałków)"""
import json, math, os, re, sys
import numpy as np
import cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); import mapylib
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
MID = 8; T = 48; CH = 12; MARGIN = 3
OUT = os.path.join(ROOT, "img", "klimat", "Map%03d" % MID)
mp = mapylib.Mapa(MID); Z = mp.zest; W, H = mp.W, mp.H; n = W * H
D = mp.data
kind = lambda v: (v - 2048) // 48 if v >= 2048 else (-2 if v >= 1536 else -1)
# ---- the cell classes (Winlu on tileset 11: A3 48-71 roofs, A3 72-79 + A4 walls - read from where the windows / doors / chimneys stand)
STREET, KERB, PLAZA, EARTH, GRASS, WALL, ROOF, OTHER = range(8)
def cls_of(k):
    if k == 40: return STREET
    if k == 43: return KERB
    if k in (33, 34, 35, 19, 42): return PLAZA
    if k in (17, 24): return EARTH
    if k in (16, 27, 20, 21): return GRASS
    if 48 <= k <= 71: return ROOF
    if k >= 72: return WALL
    return OTHER
CLS = np.array([[cls_of(kind(D[y * W + x])) for x in range(W)] for y in range(H)], np.int8)
GROUNDC = (STREET, KERB, PLAZA, EARTH, GRASS)
isground = lambda c: c in GROUNDC
GROUND_OVERLAY = {21, 31, 39, 46, 47, 36, 37, 28, 29}      # A2 kinds on layer 1 that are ground (tufts, path edges, flowers)
STAR = lambda t: bool(Z.flag(t) & 0x10)
OUTER = lambda x, y: x <= 1 or x >= W - 2 or y <= 4 or y >= H - 14       # (the town wall on the map's edge)
# ---- noise (global, so the chunks meet)
def h2(ix, iy, seed):
    v = (ix.astype(np.int64) * 374761393 + iy.astype(np.int64) * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    v = ((v ^ (v >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((v ^ (v >> 16)) & 0xFFFFFF) / float(0xFFFFFF)
def vnoise(X, Y, sc, seed):
    fx, fy = X / sc, Y / sc; ix, iy = np.floor(fx).astype(np.int64), np.floor(fy).astype(np.int64); tx, ty = fx - ix, fy - iy
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    a, b, c, d = h2(ix, iy, seed), h2(ix + 1, iy, seed), h2(ix, iy + 1, seed), h2(ix + 1, iy + 1, seed)
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
def fbm(X, Y, sc, seed): return 0.6 * vnoise(X, Y, sc, seed) + 0.3 * vnoise(X, Y, sc / 2.3, seed + 7) + 0.1 * vnoise(X, Y, sc / 5.1, seed + 13)
RNG = np.random.default_rng(2026_11_09)
# ---- tiles as arrays
_tc = {}
def tile(t):
    if t not in _tc: _tc[t] = np.asarray(Z.tile(t).convert("RGBA")).astype(np.float32)
    return _tc[t]
def interior(k):   # the A2 kind's plain interior tile
    return tile(2048 + k * 48)
def pal(arr, q):   # colour at a luminance percentile of the opaque pixels
    a = arr[arr[..., 3] > 200][:, :3]; L = a @ [0.3, 0.59, 0.11]; i = np.argsort(L)[int(q * (len(L) - 1))]; return a[i]
STONE = interior(40); GRASST = interior(16); EARTHT = interior(24)
C_MORTAR = pal(STONE, 0.06); C_LIGHT = pal(STONE, 0.95); C_MOSS1 = pal(GRASST, 0.12) * 0.85; C_MOSS2 = pal(GRASST, 0.45)
C_MUD = np.array([66, 50, 36], np.float32); C_MUD2 = np.array([104, 82, 58], np.float32); C_SHADE = np.array([14, 12, 22], np.float32)
HAY = [np.array(c, np.float32) for c in ((206, 178, 112), (178, 146, 86), (138, 110, 66))]
LEAF = [np.array(c, np.float32) for c in ((204, 112, 40), (178, 72, 34), (218, 166, 60), (142, 84, 38), (190, 140, 46))]
PETAL = [np.array(c, np.float32) for c in ((252, 240, 242), (246, 200, 216), (238, 176, 200))]
DAMP = np.array([46, 52, 38], np.float32)
print("barwy: fuga", C_MORTAR.astype(int), "jasny kamień", C_LIGHT.astype(int), "mech", C_MOSS1.astype(int), "błoto", C_MUD.astype(int))

# ---- places read from the map
evs = [e for e in mp.raw["events"] if e]
def img0(e): return e["pages"][0]["image"]
DOORS = {(e["x"], e["y"]) for e in evs if e["name"].startswith("Drzwi") or re.match(r"!Fantasy_door|!\$Drzwi", img0(e)["characterName"])}
def leafy(e):   # a broad-leaved crown (round), not a conifer (a triangle): the crown's width high up against its width low down
    im = img0(e); f = mapylib.frame(im["characterName"], im["characterIndex"], im["direction"], im["pattern"])
    if f is None: return False
    a = np.asarray(f.convert("RGBA"))[..., 3] > 100; rows = np.where(a.any(1))[0]
    if len(rows) < 10: return False
    top, bot = rows.min(), rows.max(); hgt = bot - top
    wid = lambda q: int(a[int(top + q * hgt)].sum())
    return wid(0.22) > 0.62 * max(1, wid(0.55))
TREES = [(e["x"], e["y"], img0(e)["characterName"]) for e in evs if re.search(r"Tree|Big_Trees", img0(e)["characterName"]) and leafy(e)]
FRUIT = [(x, y) for x, y, nm in TREES if re.search(r"Apple|Pear", nm)]
CHIMNEYS = [(i % W, i // W) for i in range(n) if D[3 * n + i] in (82, 83, 84, 85, 86, 87)]
FORGE_BOX = [(1, 52, 17, 63), (84, 24, 98, 33)]
# the gates' passages (inside the town) - the open cells of the outer wall's edge rows / columns
def passages():   # cells of the gates: a walkable run from the map's edge into the town
    vk = lambda x, y: mp.check_passage(x, y, 0x01, with_events=False) and mp.check_passage(x, y, 0x08, with_events=False)
    hk = lambda x, y: mp.check_passage(x, y, 0x02, with_events=False) and mp.check_passage(x, y, 0x04, with_events=False)
    out = []
    for x in range(W):
        if all(vk(x, y) for y in range(0, 6)): out.append((x, 5))
        if all(vk(x, y) for y in range(H - 12, H)): out.append((x, H - 12))
    for y in range(H):
        if all(hk(x, y) for x in range(0, 3)): out.append((2, y))
        if all(hk(x, y) for x in range(W - 3, W)): out.append((W - 3, y))
    return out
GATES = passages()
MUD_SPOTS = [(x + 0.5, y + 0.5, 4.2) for (x, y) in GATES] + [(100.5, 14, 4), (37.5, 108.5, 3.5), (108.5, 30, 4.5), (114.5, 30, 4.5),
             (91, 14, 7), (108.5, 89, 3), (108.5, 74, 2.5)]
STABLE_YARD = (83, 5, 99, 23)
STRAW_BOXES = [(83, 5, 99, 23, 1.1), (104, 77, 113, 91, 0.8), (104, 66, 113, 75, 0.5)]
STRAW_HOT = [(92.5, 11, 3.5), (97.5, 23.5, 3), (85, 12.5, 2.5), (110.5, 88, 3), (108.5, 74, 2.5)]   # (the stable door, the hay wagon, the tie rail, the barn, the granary)
HORSE_BOXES = [(83, 5, 99, 23, 0.32), (105, 26, 117, 33, 0.45)]
print("bramy:", len(GATES), "kominy:", len(CHIMNEYS), "drzewa:", len(TREES), "owocowe:", len(FRUIT))

# ---- the cart roads: from every gate into the town along the street cells (BFS), and the cart stop's turn
def road_paths():
    walk = lambda x, y: 0 <= x < W and 0 <= y < H and CLS[y, x] in (STREET, KERB, PLAZA, EARTH)
    paths, seen_g = [], set()
    groups = {}
    for (x, y) in GATES:
        key = (x // 4, y // 4)
        groups.setdefault(key, []).append((x, y))
    for g in groups.values():
        sx = sum(p[0] for p in g) / len(g); sy = sum(p[1] for p in g) / len(g); s = (int(round(sx)), int(round(sy)))
        if not walk(*s): continue
        prev = {s: None}; q = [s]; far = s
        target = (52, 50)
        while q:
            c = q.pop(0)
            if abs(c[0] - target[0]) + abs(c[1] - target[1]) < abs(far[0] - target[0]) + abs(far[1] - target[1]): far = c
            if len(prev) > 4000: break
            for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nb = (c[0] + d[0], c[1] + d[1])
                if nb not in prev and walk(*nb) and CLS[nb[1], nb[0]] in (STREET, EARTH, PLAZA): prev[nb] = c; q.append(nb)
        # the path to the cell nearest the market, its first 26 cells from the gate
        p = [far]
        while prev[p[-1]] is not None: p.append(prev[p[-1]])
        p = p[::-1][:26]
        if len(p) > 4: paths.append([(c[0] * T + 24.0, c[1] * T + 24.0) for c in p])
    return paths
def smooth(pts, k=4):
    a = np.array(pts, np.float32); out = a.copy()
    for i in range(len(a)):
        lo, hi = max(0, i - k), min(len(a), i + k + 1); out[i] = a[lo:hi].mean(0)
    out[0], out[-1] = a[0], a[-1]; return out
PATHS = [smooth(p) for p in road_paths()]
print("drogi z bram:", len(PATHS))

# ---- decals laid once over the whole map (pixel coords), drawn per chunk
DEC = {"base": [], "season": {0: [], 1: [], 2: [], 3: []}}
def add(season, kind_, **kw): (DEC["base"] if season is None else DEC["season"][season]).append(dict(k=kind_, **kw))
def ground_at(px, py):
    cx, cy = int(px // T), int(py // T); return 0 <= cx < W and 0 <= cy < H and CLS[cy, cx] in GROUNDC
# ruts (two grooves, gaps) and hoof prints along the gate roads
for P in PATHS:
    d = np.diff(P, axis=0); L = np.hypot(d[:, 0], d[:, 1]) + 1e-6; nrm = np.stack([-d[:, 1] / L, d[:, 0] / L], 1)
    for side in (-13, 13):
        pts = [(P[i, 0] + nrm[min(i, len(nrm) - 1), 0] * side, P[i, 1] + nrm[min(i, len(nrm) - 1), 1] * side) for i in range(len(P))]
        add(None, "rut", pts=pts, seed=int(RNG.integers(1 << 30)))
    for i in range(0, len(P) - 1):
        for t in np.linspace(0, 1, 3, endpoint=False):
            x, y = P[i] * (1 - t) + P[i + 1] * t
            if RNG.random() < 0.55: add(None, "hoof", x=float(x + RNG.normal(0, 4)), y=float(y + RNG.normal(0, 4)), a=float(math.atan2(*(P[i + 1] - P[i])[::-1])))
for (x0, y0, x1, y1, dens) in HORSE_BOXES:
    for _ in range(int((x1 - x0 + 1) * (y1 - y0 + 1) * dens)):
        x, y = RNG.uniform(x0 * T, (x1 + 1) * T), RNG.uniform(y0 * T, (y1 + 1) * T)
        if ground_at(x, y): add(None, "hoof", x=float(x), y=float(y), a=float(RNG.uniform(-math.pi, math.pi)))
# the cart stop: a curved pair of ruts where the cart turns
cs = [(37 * T + 24 + 60 * math.cos(a), 108 * T + 24 + 30 * math.sin(a)) for a in np.linspace(-2.6, 0.4, 14)]
for r in (-13, 13): add(None, "rut", pts=[(x, y + r) for x, y in cs], seed=int(RNG.integers(1 << 30)))
# straw
for (x0, y0, x1, y1, dens) in STRAW_BOXES:
    for _ in range(int((x1 - x0 + 1) * (y1 - y0 + 1) * dens)):
        x, y = RNG.uniform(x0 * T, (x1 + 1) * T), RNG.uniform(y0 * T, (y1 + 1) * T)
        if ground_at(x, y): add(None, "straw", x=float(x), y=float(y), a=float(RNG.uniform(0, math.pi)), l=float(RNG.uniform(3, 6)), c=int(RNG.integers(3)))
for (hx, hy, r) in STRAW_HOT:     # more round the places where hay is carried
    for _ in range(int(r * r * 9)):
        rr = r * T * math.sqrt(RNG.random()); a = RNG.uniform(0, 2 * math.pi); x, y = hx * T + rr * math.cos(a), hy * T + rr * 0.8 * math.sin(a)
        if ground_at(x, y): add(None, "straw", x=float(x), y=float(y), a=float(RNG.uniform(0, math.pi)), l=float(RNG.uniform(3, 7)), c=int(RNG.integers(3)))
# leaves (autumn) under the leafy trees, petals (spring) in the orchard and under the fruit trees
for (tx, ty, nm) in TREES:
    fx, fy = tx * T + 24, ty * T + 40; R = 2.1 * T if "Big" in nm else 1.5 * T
    for _ in range(110 if "Big" in nm else 64):
        r = R * RNG.random() ** 1.15; a = RNG.uniform(0, 2 * math.pi)
        x, y = fx + r * math.cos(a), fy + r * 0.7 * math.sin(a)
        if ground_at(x, y): add(2, "leaf", x=float(x), y=float(y), c=int(RNG.integers(len(LEAF))), s=int(RNG.integers(3)))
for (tx, ty) in FRUIT:
    fx, fy = tx * T + 24, ty * T + 40
    for _ in range(34):
        r = 1.6 * T * math.sqrt(RNG.random()); a = RNG.uniform(0, 2 * math.pi)
        x, y = fx + r * math.cos(a), fy + r * 0.7 * math.sin(a)
        if ground_at(x, y): add(0, "petal", x=float(x), y=float(y), c=int(RNG.integers(len(PETAL))))
# soot round the chimneys (stronger over the forges)
for (x, y) in CHIMNEYS:
    forge = any(b[0] <= x <= b[2] and b[1] <= y <= b[3] for b in FORGE_BOX)
    add(None, "soot", x=x * T + 24.0, y=y * T + 18.0, r=40.0 if forge else 26.0, a=0.55 if forge else 0.34, seed=x * 131 + y)
# cracks in the outer wall
for y in range(H):
    for x in range(W):
        if CLS[y, x] == WALL and OUTER(x, y) and h2(np.array([x]), np.array([y]), 77)[0] < 0.035 and not any(D[z * n + y * W + x] for z in (2, 3)):
            add(None, "crack", x=x * T + float(RNG.uniform(8, 40)), y=y * T + float(RNG.uniform(10, 30)), seed=x * 977 + y)
# ivy: a few wall columns free of windows and doors, standing on the ground; pieces from the B sheet (top, bottom)
IVY = [((98, 106),), ((99, 107),), ((101, 109), (102, 110)), ((97, 105),)]
def plain(t):
    a = tile(t); op = a[..., 3] > 200; L = a[..., :3] @ [0.3, 0.59, 0.11]
    return op.mean() > 0.97 and (L[op] < 45).mean() < 0.06
_plain = {}
def clean_wall(x, y):
    if not (0 <= x < W and 0 <= y < H) or CLS[y, x] != WALL or (x, y) in DOORS or (x, y + 1) in DOORS: return False
    if any(D[z * n + yy * W + xx] for z in (1, 2, 3) for xx in (x - 1, x, x + 1) for yy in (y,) if 0 <= xx < W): return False
    t = D[y * W + x]
    if t not in _plain: _plain[t] = plain(t)
    return _plain[t]
ivy_spots = []
cands = [(x, y) for y in range(1, H - 1) for x in range(W) if clean_wall(x, y) and clean_wall(x, y - 1) and CLS[y + 1, x] in GROUNDC]
cands.sort(key=lambda c: h2(np.array([c[0]]), np.array([c[1]]), 31)[0])
for (x, y) in cands:
    if len(ivy_spots) >= 22: break
    if any(abs(x - a) + abs(y - b) < 7 for a, b in ivy_spots): continue
    piece = IVY[int(h2(np.array([x]), np.array([y]), 41)[0] * len(IVY))]
    if len(piece) == 2 and not (clean_wall(x + 1, y) and clean_wall(x + 1, y - 1) and CLS[y + 1, x + 1] in GROUNDC): piece = IVY[0]
    ivy_spots.append((x, y))
    for s in range(4): add(s, "ivy", x=x, y=y, piece=piece, autumn=(s == 2))
print("bluszcz:", len(ivy_spots), "pęknięcia:", sum(1 for d_ in DEC["base"] if d_["k"] == "crack"), "nalepki:", len(DEC["base"]))

# ---- static things with a picture standing on the ground: a soft contact shade under their foot
SKIP_EV = re.compile(r"Fantasy_door|Roof_Windows|Signs|Flags|Tree|Pine|Big_Trees|Nature|Gate|Drzwi|^\$|^$")
def ev_feet():
    out = []
    for e in evs:
        im = img0(e); nm = im["characterName"]
        if len(e["pages"]) > 1 and any(p["image"] != im for p in e["pages"]): continue
        c = e["pages"][0]["conditions"]
        if c["switch1Valid"] or c["switch2Valid"] or c["variableValid"] or c["selfSwitchValid"] or c["itemValid"] or c["actorValid"]: continue
        if im["tileId"]:
            a = tile(im["tileId"])[..., 3]
        elif nm and not SKIP_EV.search(nm) and nm.startswith("!"):
            f = mapylib.frame(nm, im["characterIndex"], im["direction"], im["pattern"])
            if f is None: continue
            a = np.asarray(f.convert("RGBA"))[..., 3].astype(np.float32)
        else: continue
        rows = np.where(a.max(1) > 100)[0]
        if not len(rows): continue
        b = rows.max(); cols = np.where(a[max(0, b - 6):b + 1].max(0) > 100)[0]
        if not len(cols): continue
        w = cols.max() - cols.min() + 1; cxp = (cols.min() + cols.max()) / 2 - a.shape[1] / 2
        if w < 8: continue
        foot_y = (e["y"] + 1) * T - (a.shape[0] - 1 - b)
        out.append((e["x"] * T + 24 + cxp, foot_y - 2, w * 0.62, 7.0))
    return out
FEET = ev_feet()
print("cienie pod rzeczami-zdarzeniami:", len(FEET))

# ---- one chunk
def render_chunk(cx, cy):
    gx0, gy0 = cx * CH - MARGIN, cy * CH - MARGIN; cw = CH + 2 * MARGIN; P = cw * T
    G = np.zeros((P, P, 4), np.float32); OBJ = np.zeros((P, P), np.float32); STARA = np.zeros((P, P), np.float32); FOOT = np.zeros((P, P), np.float32)
    cls = np.full((P, P), OTHER, np.int8); outer = np.zeros((P, P), bool)
    for j in range(cw):
        for i in range(cw):
            x, y = gx0 + i, gy0 + j
            if not (0 <= x < W and 0 <= y < H): continue
            sl = (slice(j * T, (j + 1) * T), slice(i * T, (i + 1) * T))
            cls[sl] = CLS[y, x]; outer[sl] = OUTER(x, y)
            for z in range(4):
                t = D[z * n + y * W + x]
                if not t: continue
                tl = tile(t); a = tl[..., 3:4] / 255.0
                thing = (t < 512) or (2048 <= t < 4352 and kind(t) in (22, 38))     # B / C things, the log fences
                if thing and z >= 1 and CLS[y, x] in GROUNDC and not (y > 0 and CLS[y - 1, x] in (WALL, ROOF) and t >= 2048):
                    FOOT[sl] = np.maximum(FOOT[sl], tl[..., 3])
                if STAR(t):
                    STARA[sl] = np.maximum(STARA[sl], tl[..., 3]); continue
                G[sl][..., :3] = tl[..., :3] * a + G[sl][..., :3] * (1 - a); G[sl][..., 3] = np.maximum(G[sl][..., 3], tl[..., 3])
                if z >= 1 and not (2048 <= t < 4352 and kind(t) in GROUND_OVERLAY): OBJ[sl] = np.maximum(OBJ[sl], tl[..., 3])
    Y, X = np.mgrid[0:P, 0:P].astype(np.float32); X += gx0 * T; Y += gy0 * T
    L = G[..., :3] @ np.array([0.3, 0.59, 0.11], np.float32)
    ov = np.zeros((P, P, 4), np.float32)          # premultiplied-free: colour + alpha, painted by priority (later wins)
    def paint(mask, col, alpha):
        if not mask.any(): return
        a = alpha if np.ndim(alpha) else np.full(mask.shape, alpha, np.float32)
        ov[mask, :3] = col if np.ndim(col) == 1 else col[mask]; ov[mask, 3] = a[mask] if np.ndim(a) else a
    ground = np.isin(cls, GROUNDC); free = (OBJ < 20) & (STARA < 250)
    street = (cls == STREET) | (cls == PLAZA) | (cls == KERB)
    # mortar vs stone on the cobbles (local darkness), stones as components
    Lb = cv2.blur(L, (9, 9)); mortar = street & (L < Lb - 9)
    stones_m = (street & ~mortar & free).astype(np.uint8)
    nlab, lab, stats, cent = cv2.connectedComponentsWithStats(stones_m, connectivity=4)
    # distance from the street's edge (px) for the trodden middle
    dist = cv2.distanceTransform(((cls == STREET) | (cls == PLAZA)).astype(np.uint8), cv2.DIST_L2, 5)
    gcx = cent[:, 0] + gx0 * T; gcy = cent[:, 1] + gy0 * T
    sdist = np.zeros(nlab, np.float32)
    ok = (cent[:, 0] >= 0) & (cent[:, 0] < P) & (cent[:, 1] >= 0) & (cent[:, 1] < P)
    ci, cj = np.clip(cent[:, 0].astype(int), 0, P - 1), np.clip(cent[:, 1].astype(int), 0, P - 1)
    sdist = dist[cj, ci]; scls = cls[cj, ci]
    nz = fbm(gcx, gcy, 150, 3); jit = h2(np.round(gcx).astype(np.int64), np.round(gcy).astype(np.int64), 5)
    tread = np.clip((sdist - 26) / 50, 0, 1) * np.where(scls == STREET, 1.0, np.where(scls == PLAZA, 0.8, 0.0))
    # the trodden middle: the stones polished a shade lighter, their joints worn deeper (more contrast, not a veil); the edges: dirt
    polS = (tread * (0.55 + 0.6 * nz) > 0.6)
    dirtS = (sdist < 20) & (scls == STREET) & (nz > 0.45) & (jit > 0.5)
    darkS = (jit < 0.04); lightS = (jit > 0.97)
    mud = np.zeros((P, P), np.float32)
    for (mx, my, r) in MUD_SPOTS:
        dd = np.hypot(X - mx * T, (Y - my * T) * 1.25) / (r * T)
        mud = np.maximum(mud, np.clip(1 - dd, 0, 1))
    mud_f = mud * (0.45 + 0.75 * fbm(X, Y, 70, 9))
    mudS = mud_f[cj, ci]
    def sel(v): s_ = np.zeros(nlab, bool); s_[1:] = v[1:] & ok[1:]; return s_
    sm = stones_m.astype(bool)
    paint(sel(polS)[lab] & sm, C_LIGHT, 0.11)
    paint(sel(dirtS & ~polS)[lab] & sm, C_MUD2, 0.16)
    paint(sel(darkS)[lab] & sm, C_MORTAR, 0.18)
    paint(sel(lightS & ~darkS)[lab] & sm, C_LIGHT, 0.14)
    tm = mortar & free & ((cls == STREET) | (cls == PLAZA)) & (dist > 26) & (np.clip((dist - 26) / 50, 0, 1) * (0.55 + 0.6 * fbm(X, Y, 150, 3)) > 0.45)
    paint(tm & (fbm(X, Y, 90, 41) > 0.5), np.array([30, 28, 34], np.float32), 0.2)
    paint(sel((mudS > 0.7) & ((scls == STREET) | (scls == PLAZA)))[lab] & sm, C_MUD2, 0.26)   # (not on the kerb's light band: square patches)
    paint(mortar & free & (mud_f > 0.6) & (cls != KERB), C_MUD, 0.8)
    # wet earth patches (the yard, the pens, round the gates)
    earth = (cls == EARTH) & free
    bay = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) + 0.5) / 16
    B4 = bay[(Y.astype(np.int64) % 4), (X.astype(np.int64) % 4)]
    em = earth & (np.clip((mud_f - 0.5) / 0.25, 0, 1) > B4)
    paint(em, C_MUD, 0.24)
    # moss in the joints by the kerbs, grass and wall feet
    near = np.zeros((P, P), np.uint8); near[(cls == GRASS) | (cls == WALL)] = 1
    dn = cv2.distanceTransform((1 - near).astype(np.uint8), cv2.DIST_L2, 5)
    mossp = np.clip(1 - dn / 34, 0, 1) * (0.5 + 0.8 * fbm(X, Y, 60, 11)) + 0.25 * (cls == KERB)
    mossm = mortar & free & (mossp > 0.72) & (h2(X.astype(np.int64), Y.astype(np.int64), 23) < 0.8)
    paint(mossm, C_MOSS2, 0.55); paint(mossm & (h2(X.astype(np.int64), Y.astype(np.int64), 29) < 0.45), C_MOSS1, 0.7)
    # damp streaks, green stain and moss at the bottom of the walls standing on the ground
    wallb = np.zeros((P, P), np.float32)   # px above the wall's foot (inf where not a wall over ground)
    wallb[:] = 1e9
    for j in range(cw - 1):
        for i in range(cw):
            x, y = gx0 + i, gy0 + j
            if not (0 <= x < W and 0 <= y + 1 < H): continue
            if CLS[y, x] == WALL and CLS[y + 1, x] in GROUNDC and (x, y + 1) not in DOORS and (x, y) not in DOORS:
                for k in range(3):   # this cell and up to two above it
                    yy = j - k
                    if yy < 0 or not (0 <= y - k < H) or CLS[y - k, x] != WALL: break
                    sl = (slice(yy * T, (yy + 1) * T), slice(i * T, (i + 1) * T))
                    wallb[sl] = np.minimum(wallb[sl], (j + 1) * T - Y[sl] + gy0 * T)
    wall_ok = (cls == WALL) & free & (wallb < 1e8)
    sw = 1 + (h2((X // 3).astype(np.int64), np.full(X.shape, 7, np.int64), 57) * 2.2).astype(np.int64)   # (1-3 px wide)
    col_n = h2((X // sw).astype(np.int64), sw, 51)
    strength = np.where(outer, 1.0, 0.5)
    hgt = (8 + 46 * h2((X // sw).astype(np.int64), sw + 9, 53) ** 1.6) * strength
    streak = wall_ok & (col_n < 0.07 * strength + 0.02) & (wallb < hgt)
    fade = np.clip(1 - wallb / np.maximum(hgt, 1), 0, 1)
    paint(streak & (fade * 1.2 > B4), DAMP, (0.10 + 0.14 * fade).astype(np.float32))
    stain = wall_ok & (wallb < 7 + 9 * fbm(X, Y, 30, 61) * strength * 1.6)
    paint(stain & (h2(X.astype(np.int64), Y.astype(np.int64), 63) < 0.7), C_MOSS1, 0.35)
    wm = wall_ok & (wallb < 4 + 6 * fbm(X, Y, 18, 67)) & (fbm(X, Y, 24, 69) > 0.55)
    paint(wm, C_MOSS2, 0.6)
    # contact shade: under the walls (top of the ground cell below), under fences and objects on the ground, under events' feet
    sh = np.zeros((P, P), np.float32)
    for j in range(1, cw):
        for i in range(cw):
            x, y = gx0 + i, gy0 + j
            if not (0 <= x < W and 1 <= y < H): continue
            if CLS[y, x] in GROUNDC and CLS[y - 1, x] in (WALL,) and (x, y - 1) not in DOORS:
                py = np.arange(T, dtype=np.float32)
                sh[j * T:(j + 1) * T, i * T:(i + 1) * T] = np.maximum(sh[j * T:(j + 1) * T, i * T:(i + 1) * T], (np.clip(1 - py / 18, 0, 1) ** 1.5)[:, None] * 0.42)
    objfoot = (FOOT > 120) & ground
    if objfoot.any():
        fm = objfoot.astype(np.float32)
        down = np.zeros_like(fm); down[3:] = fm[:-3]
        blur = cv2.GaussianBlur(np.maximum(fm, down), (0, 0), 3.2)
        sh = np.maximum(sh, np.clip(blur * 0.5, 0, 0.36) * ground)
    for (fx, fy, rw, rh) in FEET:
        lx, ly = fx - gx0 * T, fy - gy0 * T
        if -60 < lx < P + 60 and -30 < ly < P + 30:
            dd = ((X - fx) / max(rw, 6)) ** 2 + ((Y - fy) / rh) ** 2
            sh = np.maximum(sh, np.clip(1 - dd, 0, 1) ** 1.4 * 0.4)
    shm = (sh > 0.01) & free & ground
    ov_a = ov[..., 3].copy()
    a = np.where(shm, sh + ov_a * (1 - sh), ov_a)
    colr = np.where(shm[..., None], (C_SHADE * sh[..., None] + ov[..., :3] * ov_a[..., None] * (1 - sh[..., None])) / np.maximum(a[..., None], 1e-4), ov[..., :3])
    ov[..., :3] = colr; ov[..., 3] = a
    # the decals (base)
    def decals(lst, out):
        for d_ in lst:
            k = d_["k"]
            if k == "rut":
                pts = np.array(d_["pts"], np.float32) - [gx0 * T, gy0 * T]
                if (pts[:, 0].max() < -10 or pts[:, 0].min() > P + 10 or pts[:, 1].max() < -10 or pts[:, 1].min() > P + 10): continue
                m = np.zeros((P, P), np.uint8); cv2.polylines(m, [np.round(pts).astype(np.int32)], False, 1, 3)
                gap = fbm(X, Y, 40, d_["seed"] % 997) > 0.36
                rm = (m > 0) & gap & free & ground
                out_paint(out, rm & (cls == EARTH), C_MUD, 0.55)
                # on the cobbles: the stones the wheels pass are worn darker
                ids = np.unique(lab[rm & stones_m.astype(bool)])
                ids = ids[ids > 0]
                if len(ids): out_paint(out, np.isin(lab, ids) & stones_m.astype(bool), C_MORTAR, 0.2)
            elif k == "hoof":
                lx, ly = d_["x"] - gx0 * T, d_["y"] - gy0 * T
                if not (-6 < lx < P + 6 and -6 < ly < P + 6): continue
                ix, iy = int(lx), int(ly)
                if not (0 <= ix < P and 0 <= iy < P) or not ground[iy, ix] or cls[iy, ix] in (STREET, KERB, PLAZA) and mud_f[iy, ix] < 0.5: continue
                u = np.array([[1, 0, 0, 1, 0], [1, 0, 0, 1, 0], [0, 1, 1, 0, 0], [0, 0, 0, 0, 0]], np.uint8)
                u = cv2.warpAffine(u * 255, cv2.getRotationMatrix2D((2, 2), math.degrees(d_["a"]) - 90, 1), (5, 5), flags=cv2.INTER_NEAREST) > 0
                for (yy, xx) in zip(*np.where(u)):
                    px_, py_ = ix + xx - 2, iy + yy - 2
                    if 0 <= px_ < P and 0 <= py_ < P and free[py_, px_]: out[py_, px_] = list(C_MUD) + [0.34]
            elif k == "straw":
                lx, ly = d_["x"] - gx0 * T, d_["y"] - gy0 * T
                if not (-12 < lx < P + 12 and -12 < ly < P + 12): continue
                dx, dy = math.cos(d_["a"]) * d_["l"] / 2, math.sin(d_["a"]) * d_["l"] / 2
                m = np.zeros((P, P), np.uint8); cv2.line(m, (int(lx - dx), int(ly - dy)), (int(lx + dx), int(ly + dy)), 1, 1)
                mm = (m > 0) & free & ground
                out[mm] = list(HAY[d_["c"]]) + [0.8]
            elif k == "soot":
                lx, ly = d_["x"] - gx0 * T, d_["y"] - gy0 * T
                if not (-60 < lx < P + 60 and -60 < ly < P + 60): continue
                dd = np.hypot((X - d_["x"]) / d_["r"], (Y - d_["y"]) / (d_["r"] * 0.8))
                f = np.clip(1 - dd, 0, 1) * (0.6 + 0.6 * fbm(X, Y, 14, d_["seed"] % 991))
                sm = (f > 0.35) & (cls == ROOF) & free
                out_paint(out, sm, np.array([22, 18, 18], np.float32), (d_["a"] * np.clip(f, 0, 1)).astype(np.float32))
            elif k == "crack":
                lx, ly = d_["x"] - gx0 * T, d_["y"] - gy0 * T
                if not (-30 < lx < P + 30 and -30 < ly < P + 30): continue
                r = np.random.default_rng(d_["seed"]); x_, y_ = lx, ly; pts = [(x_, y_)]
                for _ in range(int(r.integers(4, 8))):
                    x_ += r.uniform(-3, 3); y_ += r.uniform(2, 5); pts.append((x_, y_))
                m = np.zeros((P, P), np.uint8); cv2.polylines(m, [np.round(np.array(pts)).astype(np.int32)], False, 1, 1)
                hl = np.zeros_like(m); hl[1:, 1:] = m[:-1, :-1]
                cm = (m > 0) & (cls == WALL) & free; hm = (hl > 0) & ~(m > 0) & (cls == WALL) & free
                out[cm] = list(C_MORTAR * 0.6) + [0.75]; out[hm] = list(C_LIGHT) + [0.35]
            elif k == "leaf":
                lx, ly = int(d_["x"] - gx0 * T), int(d_["y"] - gy0 * T)
                if not (1 <= lx < P - 2 and 1 <= ly < P - 2) or not free[ly, lx] or not ground[ly, lx]: continue
                c = LEAF[d_["c"]]; shp = [[(0, 0), (1, 0), (0, 1), (1, 1)], [(0, 0), (1, 0), (2, 0), (1, 1)], [(0, 0), (1, 1), (0, 1)]][d_["s"]]
                for (xx, yy) in shp: out[ly + yy, lx + xx] = list(c) + [1.0]
                out[ly + 1, lx] = list(c * 0.72) + [1.0]
            elif k == "petal":
                lx, ly = int(d_["x"] - gx0 * T), int(d_["y"] - gy0 * T)
                if not (0 <= lx < P - 1 and 0 <= ly < P) or not free[ly, lx] or not ground[ly, lx]: continue
                c = PETAL[d_["c"]]; out[ly, lx] = list(c) + [1.0]
                if d_["c"] == 0: out[ly, lx + 1] = list(c * 0.9) + [0.9]
            elif k == "ivy":
                i, j = d_["x"] - gx0, d_["y"] - gy0
                for col, (top, bot) in enumerate(d_["piece"]):
                    for (tid, dy) in ((top, -1), (bot, 0)):
                        ii, jj = i + col, j + dy
                        if not (0 <= ii < cw and 0 <= jj < cw): continue
                        tl = tile(tid).copy()
                        if d_["autumn"]: tl = autumn(tl)
                        sl = (slice(jj * T, (jj + 1) * T), slice(ii * T, (ii + 1) * T))
                        am = tl[..., 3] > 30
                        sub = out[sl]; sub[am, :3] = tl[am, :3]; sub[am, 3] = tl[am, 3] / 255.0
    decals(DEC["base"], ov)
    crop = (slice(MARGIN * T, (MARGIN + CH) * T), slice(MARGIN * T, (MARGIN + CH) * T))
    base = ov[crop]
    seas = {}
    for s in range(4):
        o2 = np.zeros((P, P, 4), np.float32); decals(DEC["season"][s], o2); seas[s] = o2[crop]
    return base, seas, G[crop]
def out_paint(out, mask, col, alpha):
    if not mask.any(): return
    out[mask, :3] = col; out[mask, 3] = alpha[mask] if np.ndim(alpha) else alpha
def autumn(tl):
    rgb = tl[..., :3]; Lm = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
    ramp = np.array([[52, 34, 22], [104, 54, 30], [150, 82, 36], [184, 128, 58]], np.float32)
    t = np.clip((Lm - 30) / 150, 0, 0.999) * 3; i = t.astype(int); f = (t - i)[..., None]
    out = tl.copy(); out[..., :3] = (ramp[i] * (1 - f) + ramp[np.minimum(i + 1, 3)] * f) * 0.7 + rgb * 0.3; return out
def to_img(a):
    o = np.zeros(a.shape, np.uint8); o[..., :3] = np.clip(a[..., :3], 0, 255); o[..., 3] = np.clip(a[..., 3] * 255, 0, 255); return Image.fromarray(o, "RGBA")
def composite(G, ov):
    g = G.copy(); a = ov[..., 3:4]; g[..., :3] = ov[..., :3] * a + g[..., :3] * (1 - a); return g

def preview(region, pora, ov_on):
    x0, y0, x1, y1 = region; w, h = (x1 - x0 + 1) * T, (y1 - y0 + 1) * T
    lower = Image.new("RGBA", (w, h), (20, 18, 30, 255)); upper = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            for z in range(4):
                t = mp.t(z, x, y)
                if t: (upper if mp.nad_postacia(t, x, y) else lower).alpha_composite(Z.tile(t), ((x - x0) * T, (y - y0) * T))
    if ov_on:
        for cy in range(y0 // CH, y1 // CH + 1):
            for cx in range(x0 // CH, x1 // CH + 1):
                base, seas, _ = render_chunk(cx, cy)
                ov = base.copy(); s = seas[pora]; m = s[..., 3] > 0; ov[m] = s[m]
                lower.alpha_composite(to_img(ov), ((cx * CH - x0) * T, (cy * CH - y0) * T))
    sprites = sorted([({0: 1, 1: 3, 2: 5}.get(e.prio, 3), e.y, e.id, e) for e in mp.zd if e.page and e.widoczne and x0 - 4 <= e.x <= x1 + 4 and y0 - 2 <= e.y <= y1 + 8], key=lambda s: s[:3])
    out = lower; done = False
    for zz, _, _, e in sprites:
        if zz > 4 and not done: out.alpha_composite(upper); done = True
        sp = e.sprite(Z)
        if sp: mapylib._paste(out, sp[0], sp[1] - x0 * T, sp[2] - y0 * T)
    if not done: out.alpha_composite(upper)
    return out
if "--podglad" in sys.argv:
    i = sys.argv.index("--podglad"); reg = tuple(map(int, sys.argv[i + 1].split(","))); dst = sys.argv[i + 2]
    pora = int(sys.argv[sys.argv.index("--pora") + 1]) if "--pora" in sys.argv else 1
    a, b2 = preview(reg, pora, False), preview(reg, pora, True)
    o = Image.new("RGB", (a.width * 2 + 8, a.height), (255, 0, 0)); o.paste(a, (0, 0)); o.paste(b2, (a.width + 8, 0)); o.save(dst)
    print("podgląd:", dst); raise SystemExit(0)

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith(".png"): os.remove(os.path.join(OUT, f))
spis = {"base": [], "season": {0: [], 1: [], 2: [], 3: []}}
total = 0
for cy in range(H // CH):
    for cx in range(W // CH):
        base, seas, _ = render_chunk(cx, cy)
        if (base[..., 3] > 0.004).any():
            p = os.path.join(OUT, "z_%d_%d.png" % (cx, cy)); to_img(base).save(p, optimize=True); spis["base"].append(cy * 100 + cx); total += os.path.getsize(p)
        for s in range(4):
            if (seas[s][..., 3] > 0.004).any():
                p = os.path.join(OUT, "z_%d_%d_p%d.png" % (cx, cy, s)); to_img(seas[s]).save(p, optimize=True); spis["season"][s].append(cy * 100 + cx); total += os.path.getsize(p)
    print("rząd", cy, "gotowy")
line = "    const CHUNKS = { %d: { size: %d, base: %s, season: %s } };" % (MID, CH, json.dumps(spis["base"]), json.dumps({str(k): v for k, v in spis["season"].items()}))
pp = os.path.join(ROOT, "js", "plugins", "Klimat_Ziemia.js")
if os.path.exists(pp):
    b = open(pp, "rb").read().decode("utf-8"); i = b.index("    const CHUNKS = "); j = b.index("\n", i)
    open(pp, "wb").write((b[:i] + line + b[j:]).encode("utf-8"))
print("kawałki: %d całoroczne, pory %s; %.1f MB" % (len(spis["base"]), {k: len(v) for k, v in spis["season"].items()}, total / 1e6))
