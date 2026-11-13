# -*- coding: utf-8 -*-
"""Potrawy karczmy jako gotowe obrazki w skosie top-down Winlu (gracz 2026-11-12: „czy ten posiłek może wyglądać ładniej,
profesjonalniej, ostrzej... i skos top-down odpowiedni”). Naczynia wyciete z Winlu Fantasy_Inside_Shops (okragle stoly z jedzeniem),
bez stolu; z nich 7 potraw x 4 stany (pelne, 1/3 zjedzone, 2/3, puste) -> img/system/Tav_Talerze.png (klatki 32x32, naczynie
na dole klatki, srodek w poziomie). Kolejnosc wierszy: ROWS.
  python tools/talerze/zbuduj.py              (do tools/talerze/staging/img/system)
  python tools/talerze/zbuduj.py --do <folder>"""
import os, sys, random, colorsys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SHEET = np.array(Image.open(os.path.join(ROOT, "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/tilesets/Fantasy_Inside_Shops.png")).convert("RGBA")).astype(int)
F = 32
ROWS = ["pieczen", "placek", "chleb", "gulasz", "kapusniak", "piwo", "miod"]
def L(p): return (int(p[0]) + int(p[1]) + int(p[2])) / 3
def cool(p): return p[2] >= p[0] - 4

def ellipse_cut(x0, x1, y0, y1, pad=0.6):
    """the dish inside its outline ring (the ring's bbox in sheet px)"""
    cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + pad, (y1 - y0) / 2 + pad
    out = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), int)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0: out[y - y0, x - x0] = SHEET[y, x]
    return clean_outside(out)

def clean_outside(a):
    """the table's bits left between the ellipse and the dish's outline: warm, darkish, reachable from outside"""
    a = a.copy(); H, W = a.shape[:2]; seen = np.zeros((H, W), bool)
    st = [(y, x) for y in range(H) for x in range(W) if a[y, x][3] == 0]
    while st:
        y, x = st.pop()
        if not (0 <= y < H and 0 <= x < W) or seen[y, x]: continue
        p = a[y, x]
        if p[3] and not ((p[0] - p[2] > 14) and L(p) < 160): continue
        seen[y, x] = True; a[y, x] = 0
        st += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    return a

def mug_cut():
    x0, y0, x1, y1 = 357, 477, 372, 499
    t = SHEET[y0:y1 + 1, x0:x1 + 1].copy(); H, W = t.shape[:2]
    keep = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            p = t[y, x]
            if not p[3]: continue
            if (p[0] - p[2] > 14) and L(p) < 130: continue                 # the table's wood and the mug's shadow
            if (x + x0) >= 366 and (y + y0) <= 479 and cool(p): continue   # the mug standing above it
            keep[y, x] = True
    comp = np.zeros((H, W), bool); st = [(14, 5)]
    while st:
        y, x = st.pop()
        if not (0 <= y < H and 0 <= x < W) or comp[y, x] or not keep[y, x]: continue
        comp[y, x] = True; st += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    t[~comp] = 0
    ys, xs = np.where(comp)
    return t[ys.min():ys.max() + 1, xs.min():xs.max() + 1], (x0 + xs.min(), y0 + ys.min())

def is_food(p):
    """not the pewter plate: warm or saturated"""
    if not p[3]: return False
    h, s, v = colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)
    return s > 0.28 and not (0.5 < h < 0.75)

def plate_fill(a):
    """the plate's inner colour (a light common grey inside)"""
    greys = [tuple(int(c) for c in a[y, x][:3]) for y in range(a.shape[0]) for x in range(a.shape[1])
             if a[y, x][3] and not is_food(a[y, x]) and L(a[y, x]) > 120]
    greys.sort(key=lambda c: -sum(c))
    return greys[len(greys) // 3] if greys else (170, 170, 170)

def eat(a, frac, seed, crumbs=0, base=None):
    """a share of the food taken away: the bites from the front right (where the hand is) inwards, a ragged edge.
    base: the empty dish - the food is whatever differs from it (else: warm or saturated pixels)"""
    a = a.copy(); H, W = a.shape[:2]; rnd = random.Random(seed)
    fill = plate_fill(base if base is not None else a)
    if base is not None: food = [(y, x) for y in range(H) for x in range(W) if a[y, x][3] and tuple(a[y, x][:3]) != tuple(base[y, x][:3])]
    else: food = [(y, x) for y in range(H) for x in range(W) if is_food(a[y, x])]
    score = {pt: (W - pt[1]) * 0.6 + (H - pt[0]) * 0.4 + rnd.random() * 5 for pt in food}
    food.sort(key=lambda pt: score[pt])
    gone = food[:int(len(food) * frac)]
    for (y, x) in gone: a[y, x][:3] = base[y, x][:3] if base is not None else fill
    for (y, x) in rnd.sample(gone, min(crumbs, len(gone))):
        a[y, x][:3] = rnd.choice([(150, 105, 60), (120, 80, 45), (175, 130, 80)])
    return a

def recolour(a, fn):
    a = a.copy()
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            if is_food(a[y, x]): a[y, x][:3] = fn(a[y, x])
    return a

def hsv_map(dh=0.0, ds=1.0, dv=1.0, h_to=None, s_to=None):
    def f(p):
        h, s, v = colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)
        if h_to is not None: h = h_to + (h - 0.07) * 0.3
        h = (h + dh) % 1; s = min(1, (s_to if s_to is not None else s) * ds); v = min(1, v * dv)
        return tuple(int(round(c * 255)) for c in colorsys.hsv_to_rgb(h, s, v))
    return f

def frame(a):
    """into a 32x32 frame: centred, its foot on the frame's bottom row, a soft shadow under it"""
    out = Image.new("RGBA", (F, F), (0, 0, 0, 0)); H, W = a.shape[:2]
    x0 = (F - W) // 2; y0 = F - 1 - H
    sh = Image.new("RGBA", (F, F), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.ellipse([x0 + 1, F - 5, x0 + W - 2, F - 1], fill=(20, 12, 8, 70))
    out.alpha_composite(sh)
    out.alpha_composite(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), (x0, y0))
    return out

# ---- the dishes
pieczen0 = ellipse_cut(107, 129, 573, 592, 0.9)
def kasza(p):
    """the salad leaves -> buckwheat (brown-ochre grains), the tomatoes -> beetroot"""
    h, s, v = colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)
    if 0.2 < h < 0.5: return tuple(int(c * 255) for c in colorsys.hsv_to_rgb(0.08, 0.45, min(1, v * 1.15)))
    if h < 0.03 or h > 0.92: return tuple(int(c * 255) for c in colorsys.hsv_to_rgb(0.95, min(1, s * 1.05), v * 0.8))
    return tuple(int(c) for c in p[:3])
pieczen = pieczen0   # (2026-11-12: Winlu's own plate - recoloured to buckwheat it read as mud)
chleb = ellipse_cut(202, 224, 468, 490, 0.9)
empty_plate = eat(chleb, 1.0, 1)

def placek_make():
    """placek z serem: a round yeast cake on the plate - golden crust, white curd on top, a thread of honey"""
    a = empty_plate.copy(); H, W = a.shape[:2]; cx, cy = W / 2 - 0.5, H / 2 - 1.5
    for y in range(H):
        for x in range(W):
            e = ((x - cx) / 7.6) ** 2 + ((y - cy) / 5.2) ** 2
            e2 = ((x - cx) / 7.6) ** 2 + ((y - cy - 1.6) / 5.2) ** 2
            if e2 <= 1 and e > 1: a[y, x][:3] = (150, 92, 38)                      # the crust's side, seen at the front
            if e <= 1:
                a[y, x][:3] = (214, 158, 74) if e > 0.62 else (238, 230, 205)        # crust ring, curd top
                if e <= 0.62 and (x + y) % 5 == 0: a[y, x][:3] = (226, 216, 188)
            if 0.86 < e <= 1 and y < cy: a[y, x][:3] = (240, 196, 110)             # light on the far crust
    for i in range(7): a[int(cy) - 1 + (i % 3 == 0), int(cx) - 3 + i][:3] = (226, 160, 40)   # honey
    a[int(cy) - 2, int(cx) - 2][:3] = (250, 214, 120)
    return a
placek = placek_make()
miska = ellipse_cut(302, 324, 575, 600, 0.25)
miska_pusta = ellipse_cut(200, 222, 560, 584, 0.25)

def soup_level(full, low, k):
    """k=0 full, 1 a third down (the far rows of soup show the wall), 2 the nearly empty bowl, 3 empty"""
    if k == 0: return full
    if k == 1:
        a = full.copy(); ys = [y for y in range(a.shape[0]) for x in range(a.shape[1]) if is_food(a[y, x])]
        top = min(ys); wall = plate_fill(low)
        for y in range(a.shape[0]):
            for x in range(a.shape[1]):
                if is_food(a[y, x]) and y < top + 4: a[y, x][:3] = tuple(int(c * 0.92) for c in wall)
        return a
    if k == 2: return low
    # empty: the last of the soup gone - the bowl's own dark inside where it lay (the commonest grey round its middle), a few drops
    a = low.copy(); H, W = a.shape[:2]; cy, cx = H // 2, W // 2
    from collections import Counter
    inner = Counter(tuple(int(c) for c in a[y, x][:3]) for y in range(cy - 6, cy + 7) for x in range(cx - 6, cx + 7)
                    if a[y, x][3] and not is_food(a[y, x]) and L(a[y, x]) < 140).most_common(1)[0][0]
    rnd = random.Random(3); drops = 0
    for y in range(H):
        for x in range(W):
            if is_food(a[y, x]):
                a[y, x][:3] = inner
                if drops < 3 and rnd.random() < 0.08: a[y, x][:3] = tuple(int(c) for c in low[y, x][:3]); drops += 1
    return a
gul = hsv_map(dh=-0.02, dv=0.85, ds=1.1)
kap = hsv_map(h_to=0.15, s_to=0.42, dv=1.08)
kufel, KO = mug_cut()

def drink(k, liquid=None):
    """the tankard (sheet px: body x358-367, rows 483-498, handle x368-370): state 0 of beer = Winlu's foaming one; else the foam
    taken off and the opening drawn - the liquid's surface in the rim, lower and darker as it goes, the empty mug dark inside"""
    if liquid is None and k == 0: return kufel
    a = kufel.copy(); H, W = a.shape[:2]
    at = lambda sx, sy: (sy - KO[1], sx - KO[0])
    def put(sx, sy, c):
        y, x = at(sx, sy)
        if 0 <= y < H and 0 <= x < W: a[y, x] = list(c) + [255]
    def get(sx, sy):
        y, x = at(sx, sy); return a[y, x] if 0 <= y < H and 0 <= x < W else None
    # the foam crown and its drips away: above the rim nothing, on the body its glass (the colour of the same column lower down)
    for sy in range(477, 501):
        for sx in range(357, 373):
            p = get(sx, sy)
            if p is None or not p[3]: continue
            cream = (p[0] - p[2] > 25) and L(p) > 140
            if (sy < 481 and sx <= 367) or (sy >= 497 and cream): a[at(sx, sy)] = 0   # (the crown; the spill at its foot)
            elif cream: put(sx, sy, get(sx, 493)[:3] if get(sx, 493) is not None and get(sx, 493)[3] else (87, 111, 114))
    RIM_D, RIM_L, LIP = (43, 62, 57), (61, 81, 82), (134, 159, 162)
    for sx in range(359, 367): put(sx, 481, RIM_L)                    # the far rim
    for sy in (482, 483): put(358, sy, RIM_D); put(367, sy, RIM_D)    # the sides of the rim
    for sx in range(359, 367): put(sx, 484, LIP)                      # the near lip, catching the light
    if liquid is None: liquid = (196, 136, 44)
    lv = {0: (1.0, 1.0), 1: (0.9, 0.95), 2: (0.7, 0.8)}
    if k < 3:
        dark, hi = lv.get(k, (1, 1))
        base = tuple(int(c * dark) for c in liquid)
        for sy in (482, 483):
            for sx in range(359, 367): put(sx, sy, base)
        for sx in range(360, 364): put(sx, 482, tuple(min(255, int(c * 1.3 * hi)) for c in liquid))   # light on the surface
        if k == 0 and liquid == (196, 136, 44): pass
    else:
        for sx in range(359, 367): put(sx, 482, (40, 34, 31)); put(sx, 483, (58, 48, 42))
    return a
MIOD = (214, 150, 40)
DISH = {
    "pieczen": [pieczen, eat(pieczen, 0.35, 11), eat(pieczen, 0.72, 11, 2), eat(pieczen, 1.0, 11, 4)],
    "placek": [placek, eat(placek, 0.35, 12, base=empty_plate), eat(placek, 0.72, 12, 2, base=empty_plate), eat(placek, 1.0, 12, 4, base=empty_plate)],
    "chleb": [chleb, eat(chleb, 0.35, 13), eat(chleb, 0.72, 13, 2), eat(chleb, 1.0, 13, 5)],
    "gulasz": [soup_level(recolour(miska, gul), recolour(miska_pusta, gul), k) for k in range(4)],
    "kapusniak": [soup_level(recolour(miska, kap), recolour(miska_pusta, kap), k) for k in range(4)],
    "piwo": [drink(0), drink(1, (232, 216, 180)), drink(2), drink(3)],   # (foaming, the foam settled, the beer half down, empty)
    "miod": [drink(k, MIOD) for k in range(4)],
}
out_root = sys.argv[sys.argv.index("--do") + 1] if "--do" in sys.argv else os.path.join(HERE, "staging")
sheet = Image.new("RGBA", (F * 4, F * len(ROWS)), (0, 0, 0, 0))
for r, name in enumerate(ROWS):
    for k, a in enumerate(DISH[name]): sheet.alpha_composite(frame(a), (k * F, r * F))
dst = os.path.join(out_root, "img", "system", "Tav_Talerze.png"); os.makedirs(os.path.dirname(dst), exist_ok=True)
sheet.save(dst); print("zapisane", dst, sheet.size)
pv = Image.new("RGBA", sheet.size, (88, 62, 42, 255)); pv.alpha_composite(sheet)
pv.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(os.path.join(HERE, "podglad_talerze.png"))
