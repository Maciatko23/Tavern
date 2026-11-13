# -*- coding: utf-8 -*-
"""python tools/potwory/art/arkusze.py [klucz ...]
Buduje arkusze potworów z morza z klatek PixelLab (pobierz.py -> tools/potwory/art/klatki/<klucz>/) do tools/potwory/nowe/img/characters/:
  anim8/Cr_<Wyglad>_Walk8.png  8 wierszy (S, SW, W, NW, N, NE, E, SE) x (stoi + klatki chodu), komórka 96, stopy w wierszu 93 (układ Hunting.js LOOK8)
  anim8/Cr_<Wyglad>_Atk8.png   klatki ciosu (raise - zamach, hit - klatka trafienia); anim8/Cr_<Wyglad>_Die8.png  upadek, ostatnia klatka leży
  $Cr_<Wyglad>.png / _Atk / _Die   stary arkusz 4-kierunkowy (3 x 4 komórki: dół, lewo, prawo, góra) - rysowany tylko przy wyłączonych 8 kierunkach
Strona zachodnia = odbicie wschodniej; brakujący kierunek bierze sąsiedni (FALL). Podgląd: tools/potwory/art/podglad_<klucz>.png."""
import os, sys, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "tools", "potwory", "nowe", "img", "characters")
DIRS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"]
MIRROR = {"west": "east", "south-west": "south-east", "north-west": "north-east"}
FALL = {"south-east": ["east", "south"], "north-east": ["east", "north"], "north": ["south"], "east": ["south"], "south": ["east"], "south-west": [], "north-west": [], "west": []}
CELL, FEET = 96, 93
CFG = {
    "topielec": {"look": "SeaDrowned", "walk": "topielec_walk", "atk": "topielec_atk", "die": "topielec_die"},
    "krab": {"look": "SeaCrab", "walk": "krab_walk", "atk": "krab_atk", "die": "krab_die"},
    "rybolak": {"look": "SeaFolk", "walk": "rybolak_walk", "atk": "rybolak_atk", "die": "rybolak_die"},
    "mglak": {"look": "SeaFog", "walk": "mglak_walk", "atk": "mglak_atk", "die": False},
    "wiedzma": {"look": "SeaWitch", "walk": "wiedzma_walk", "atk": "wiedzma_atk", "die": "wiedzma_die"},
}
def clean(im):
    im = im.convert("RGBA"); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and a < 128: px[x, y] = (0, 0, 0, 0)
            elif a < 255 and a: px[x, y] = (r, g, b, 255)
    return im
FRONT_ONLY = {"krab"}   # (a crab walks sideways: its front view for every direction but the northern ones)
CUR = {"key": ""}
def cands(d):
    if CUR["key"] in FRONT_ONLY:
        return [("north", False), ("south", False)] if d.startswith("north") else [("south", False)]
    """(direction of the pictures, mirrored): the west side is the east's mirror; a missing one takes the FALL directions' pictures"""
    flip = d in MIRROR; base = MIRROR.get(d, d)
    return [(base, flip)] + [(f, flip) for f in FALL.get(base, [])]
def frames(key, anim, d):
    base = os.path.join(HERE, "klatki", key, "anim", anim)
    for s, fl in cands(d):
        p = os.path.join(base, s)
        if os.path.isdir(p):
            fs = sorted(os.listdir(p), key=lambda f: int(f.split(".")[0]))
            return [Image.open(os.path.join(p, f)) for f in fs], fl
    return None, False
def rot(key, d):
    base = os.path.join(HERE, "klatki", key, "rot")
    for s, fl in cands(d):
        p = os.path.join(base, s + ".png")
        if os.path.exists(p): return Image.open(p), fl
    return None, False
def place(im, flip, dy):
    im = clean(im)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    c = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    c.alpha_composite(im, ((CELL - im.width) // 2, dy))
    return c
def feet_dy(rimg):
    bb = clean(rimg).getchannel("A").getbbox()
    return FEET + 1 - bb[3] if bb else 0   # (the lowest pixel row on FEET)
FWD = {"south": (0, 1), "south-west": (-1, 1), "west": (-1, 0), "north-west": (-1, -1), "north": (0, -1), "north-east": (1, -1), "east": (1, 0), "south-east": (1, 1)}
ATK_N, DIE_N = 8, 7
def proc_atk(stand, d, n=ATK_N):
    """a blow made from the standing figure (when PixelLab gave no frames): leans back (squashed), winds up, lunges at `hit`, recovers"""
    fx, fy = FWD[d]; L = (fx * 0.7071 if fx and fy else fx), (fy * 0.7071 if fx and fy else fy)
    # (offset along the facing in px, squash y, lean)
    prog = [(0, 1.0), (-2, 0.97), (-4, 0.94), (-5, 0.93), (-3, 0.96), (7, 1.03), (4, 1.0), (1, 1.0)][:n]
    out = []
    for off, sq in prog:
        base = stand
        if sq != 1.0:
            h = int(CELL * sq); sc = base.resize((CELL, h), Image.NEAREST); base = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)); base.alpha_composite(sc, (0, FEET + 3 - h))
        c = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)); c.alpha_composite(base, (int(round(L[0] * off)), int(round(L[1] * off * 0.6))))
        out.append(c)
    return out
def proc_die(stand, d, key, n=DIE_N):
    """a fall made from the standing figure: tips over (a crab turns on its back), ends lying"""
    out = []
    for i in range(n):
        k = i / (n - 1); e = k * k * (3 - 2 * k)
        if key == "krab":
            h = max(8, int(CELL * (1 - 0.35 * e))); f = stand.transpose(Image.FLIP_TOP_BOTTOM) if e > 0.5 else stand
            sc = stand.resize((CELL, h), Image.NEAREST)
            if e > 0.5: sc = sc.transpose(Image.FLIP_TOP_BOTTOM)
            c = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)); c.alpha_composite(sc, (0, FEET + 3 - h if e <= 0.5 else FEET + 3 - h + 6))
        else:
            ang = -90 * e if d not in ("west", "north-west", "south-west") else 90 * e
            r = stand.rotate(ang, resample=Image.NEAREST, center=(CELL // 2, 62), expand=False)
            bb = r.getchannel("A").getbbox()
            c = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
            if bb:   # (the lowest pixel on the feet line, the body kept in the cell)
                dx = max(-bb[0], min(0, CELL - bb[2])) if (bb[2] - bb[0]) < CELL else 0
                c.alpha_composite(r, (dx, FEET + 1 - bb[3]))
        out.append(clean(c))
    return out
def build(key):
    CUR["key"] = key
    cfg = CFG[key]; look = cfg["look"]
    dys = {}
    for d in DIRS:
        r, fl = rot(key, d)
        dys[d] = feet_dy(r) if r is not None else 0
    info = {}
    for part, anim, standing in (("Walk8", cfg["walk"], True), ("Atk8", cfg["atk"], False), ("Die8", cfg["die"], False)):
        if not anim and not (part == "Die8" and cfg["die"] is False): anim = anim or ("_proc_" + part)
        if not anim: continue
        rows = []
        for d in DIRS:
            fr, fl = frames(key, anim, d)
            r, rfl = rot(key, d)
            if fr is None and part == "Atk8" and not standing: cells = proc_atk(place(r, rfl, dys[d]), d)
            elif fr is None and part == "Die8": cells = proc_die(place(r, rfl, dys[d]), d, key)
            elif fr is None: rows = None; break
            else: cells = [place(f, fl, dys[d]) for f in fr]
            if standing: cells = [place(r, rfl, dys[d])] + cells
            rows.append(cells)
        if rows is None: print("brak klatek:", key, anim); continue
        n = max(len(r) for r in rows)
        sheet = Image.new("RGBA", (CELL * n, CELL * 8), (0, 0, 0, 0))
        for i, cells in enumerate(rows):
            for j, c in enumerate(cells): sheet.alpha_composite(c, (j * CELL, i * CELL))
        p = os.path.join(OUT, "anim8", "Cr_%s_%s.png" % (look, part)); os.makedirs(os.path.dirname(p), exist_ok=True); sheet.save(p)
        info[part] = n
        # the old 4-way sheet: rows down, left, right, up = S, W, E, N; columns: 3 patterns (walk step, standing, walk step) / (stand, raise, hit) / (first, middle, last)
        order = [DIRS.index(x) for x in ("south", "west", "east", "north")]
        pick = [1, 0, 5] if standing else [0, max(1, n // 3), n - 1] if part == "Atk8" else [0, n // 2, n - 1]
        if standing: pick = [1, 0, min(5, n - 1)]
        old = Image.new("RGBA", (CELL * 3, CELL * 4), (0, 0, 0, 0))
        for ri, di in enumerate(order):
            for ci, cj in enumerate(pick): old.alpha_composite(sheet.crop((cj * CELL, di * CELL, cj * CELL + CELL, di * CELL + CELL)), (ci * CELL, ri * CELL))
        suf = "" if part == "Walk8" else "_" + part[:-1]
        old.save(os.path.join(OUT, "$Cr_%s%s.png" % (look, suf)))
        # the preview: the south and east rows x2 on grey
        prev = Image.new("RGBA", (CELL * n * 2, CELL * 2 * 2), (70, 80, 70, 255))
        for k, di in enumerate((DIRS.index("south"), DIRS.index("east"))):
            prev.alpha_composite(sheet.crop((0, di * CELL, CELL * n, di * CELL + CELL)).resize((CELL * n * 2, CELL * 2), Image.NEAREST), (0, k * CELL * 2))
        prev.save(os.path.join(HERE, "podglad_%s_%s.png" % (key, part)))
    print(key, info)
    return info
if __name__ == "__main__":
    res = {k: build(k) for k in (sys.argv[1:] or CFG) if os.path.isdir(os.path.join(HERE, "klatki", k))}
    json.dump(res, open(os.path.join(HERE, "arkusze.json"), "w"), indent=1)
