# -*- coding: utf-8 -*-
"""Pory roku widoczne na mapach zewnętrznych (gracz 2026-11-09: „jesień nie ma różnic?”). Gotowe obrazki, nic nie liczone w grze:
  - arkusze kafli (img/tilesets/<to samo>_wiosna / _jesien / _zima.png): trawa A2 (wybrane rodzaje), zielone kafle A4 / A5 (trawa na
    krawędziach, ściana z koron drzew), krzaki, bluszcz i drzewa z kafli B / D (komórki, w których zieleń to >= 30% pikseli; sosna z
    kafli D zostaje zielona, zimą z czapami śniegu);
  - postacie-drzewa (img/characters/<nazwa>_wiosna / _jesien1-3 / _zima.png): liściaste - wiosną świeższe (drzewa owocowe w kwiatach),
    jesienią złote / pomarańczowe / rdzawe (trzy arkusze: las mieszany), zimą ciemne i matowe ze śniegiem na górnych liściach;
    iglaste (sosny, świerczki, sosna z !$Big_Trees) zielone cały rok, zimą ze śniegiem;
  - img/system/PoryRoku_Liscie.png - spadające liście (4 kolory x 4 klatki, 12 x 12 px);
  - spis tego, co jest, w js/plugins/PoryRoku.js między // <PORY_DANE> a // </PORY_DANE>.
Kolor zieleni zmieniany czystą funkcją koloru (kafle zostają bez szwów; tools/klimat/pory_lib.py). Lato = oryginał.
  python tools/klimat/pory_roku.py            (wszystko)        python tools/klimat/pory_roku.py --podglad <plik.png>   (arkusz porównań)"""
import json, os, re, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import pory_lib as P
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
TS = os.path.join(ROOT, "img", "tilesets"); CH = os.path.join(ROOT, "img", "characters"); SYS = os.path.join(ROOT, "img", "system")
SUF = {0: "_wiosna", 2: "_jesien", 3: "_zima"}
W = "Styl_B/Winlu Fantasy Tileset - Exterior/Fantasy_Tileset_Green_Edition_upgrade/tilesets/"
# ---- tileset sheets: (name, mode, options)
SHEETS = [
    (W + "Fantasy_Outside_A2_green", "a2", {"grass": [16, 17, 18, 19, 21, 25, 27, 31], "foliage": [20]}),
    (W + "Fantasy_Outside_A2_2_green", "a2", {"grass": [16, 17, 18, 19, 21, 25, 27, 31, 34, 35, 46], "foliage": [20]}),
    (W + "Fantasy_Outside_A5_green", "cells", {"as": "grass"}),
    (W + "Fantasy_Outside_A4_green", "cells", {"as": "foliage"}),
    (W + "Fantasy_Outside_B_green", "cells", {"as": "foliage"}),
    (W + "Fantasy_Outside_D_green", "cells", {"as": "foliage", "conifer": [(5, 8, 7, 15)]}),   # (cols 5-7, rows 8-15: the tile pine)
]
# ---- character sheets: frame grid (rows top-down = directions 2,4,6,8; columns = patterns): L leafy, P conifer, K keep (already
# coloured by the author: the orange and pink trees) - kept in spring and autumn, winter like a leafy one; F leafy fruit tree
BIG = ["LLP", "LPL", "KKK", "PKK"]
CHARS = {
    "!$Big_Trees_scinane": BIG, "!$Big_Trees_green": BIG,
    "!$Tree_Apple": ["FFF"] * 4, "!$Tree_Pear": ["FFF"] * 4, "!$Tree_FruitBare": ["FFF"] * 4,
    "!$Tree_Small": ["PPP"] * 4, "!$Pine_A": ["PPP"] * 4, "!$Pine_B": ["PPP"] * 4, "!$Pine_C": ["PPP"] * 4,
    "!$Bush_Flower_Blue": ["LLL"] * 4, "!$Bush_Clover": ["LLL"] * 4,
}
SNOW, SNOW2 = np.array([236, 241, 246]), np.array([206, 215, 226])

def load(p): return np.asarray(Image.open(p).convert("RGBA")).copy()
def save(a, p): Image.fromarray(a.astype(np.uint8), "RGBA").save(p, optimize=True)

def winter_snow(a, m, top_only=True, orig=None):
    """snow on the upper side: the crown's silhouette top (nothing opaque above) 2 px deep, and the brightest leaves (highlights of the
    ORIGINAL picture) in the crown's upper part dusted; the rest stays the dark winter crown"""
    out = a.astype(np.float32)
    opq = a[..., 3] > 0
    up = np.zeros_like(opq); up[1:] = opq[:-1]
    top = m & ~up
    below = np.zeros_like(m); below[1:] = top[:-1]; below &= m
    src = orig if orig is not None else a
    lum = (src[..., 0] * 0.3 + src[..., 1] * 0.59 + src[..., 2] * 0.11)
    if m.any():
        ys = np.where(m.any(1))[0]; y0, y1 = ys.min(), ys.max()
        yy = np.arange(m.shape[0])[:, None]
        upper = yy <= y0 + (y1 - y0) * 0.62
        q = np.percentile(lum[m], 88)
        frost = m & (lum >= q) & upper & ~top & ~below
        out[frost, :3] = out[frost, :3] * 0.3 + SNOW2 * 0.7
    if top_only:
        out[top, :3] = SNOW
        out[below, :3] = out[below, :3] * 0.25 + SNOW2 * 0.75
    return np.clip(out, 0, 255).astype(np.uint8)

def blossoms(a, m, seed=7):
    out = a.copy(); H, Wd = m.shape
    yy, xx = np.mgrid[0:H, 0:Wd]
    h = ((xx // 2) * 374761393 + (yy // 2) * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    r = (h & 0xFFFF) / 65535.0
    lum = a[..., 1].astype(np.float32)
    med = np.median(lum[m]) if m.any() else 0
    pick = m & (r < 0.06) & (lum >= med) & (xx % 2 == 0) & (yy % 2 == 0)
    pink = ((h >> 16) & 1).astype(bool)
    for dy, dx, k in ((0, 0, 1.0), (0, 1, 0.75), (1, 0, 0.6)):
        p = np.zeros_like(pick); p[dy:, dx:] = pick[:H - dy, :Wd - dx]
        p &= m
        col = np.where(pink[..., None], np.array([244, 176, 196]), np.array([250, 244, 238]))
        sh = np.zeros_like(col); sh[dy:, dx:] = col[:H - dy, :Wd - dx]
        out[p, :3] = np.clip(out[p, :3] * (1 - k) + sh[p] * k, 0, 255)
    return out

def tiles():
    made = {}
    for name, mode, opt in SHEETS:
        src = os.path.join(TS, name + ".png")
        if not os.path.exists(src): print("brak", name); continue
        a = load(src); Hh, Ww = a.shape[:2]
        jobs = []                                    # (y0, y1, x0, x1, kind, conifer)
        if mode == "a2":
            for k, kind in [(k, "grass") for k in opt["grass"]] + [(k, "foliage") for k in opt.get("foliage", [])]:
                x0, y0 = ((k - 16) % 8) * 96, ((k - 16) // 8) * 144
                jobs.append((y0, y0 + 144, x0, x0 + 96, kind, False))
        else:
            m, _, _, _ = P.veg_mask(a, 0.18)
            for cy in range(Hh // 48):
                for cx in range(Ww // 48):
                    c = a[cy * 48:cy * 48 + 48, cx * 48:cx * 48 + 48]; op = (c[..., 3] > 0).sum()
                    if op < 100 or m[cy * 48:cy * 48 + 48, cx * 48:cx * 48 + 48].sum() < 0.3 * op: continue
                    con = any(x0 <= cx <= x1 and y0 <= cy <= y1 for (x0, y0, x1, y1) in opt.get("conifer", []))
                    jobs.append((cy * 48, cy * 48 + 48, cx * 48, cx * 48 + 48, opt["as"], con))
        made[name] = []
        for s in (0, 2, 3):
            out = a.copy(); changed = 0
            for (y0, y1, x0, x1, kind, con) in jobs:
                blk = a[y0:y1, x0:x1]
                if con:
                    if s != 3: continue
                    m, _, _, _ = P.veg_mask(blk, 0.12)
                    new = P.recolour(blk, 3, "conifer"); new = winter_snow(new, m, top_only=False)
                else:
                    new = P.recolour(blk, s, kind)
                    if s == 3 and kind == "foliage":
                        m, _, _, _ = P.veg_mask(blk, 0.12); new = winter_snow(new, m, top_only=False)
                changed += int((new != blk).any(-1).sum()); out[y0:y1, x0:x1] = new
            if changed:
                save(out, os.path.join(TS, name + SUF[s] + ".png")); made[name].append(s)
        print("kafle %-48s %d bloków, pory %s" % (name.split("/")[-1], len(jobs), made[name]))
    return made

def chars():
    made = {}
    for name, grid in CHARS.items():
        src = os.path.join(CH, name + ".png")
        if not os.path.exists(src): print("brak", name); continue
        a = load(src); Hh, Ww = a.shape[:2]; fw, fh = Ww // 3, Hh // 4
        frames = [(r, c, grid[r][c]) for r in range(4) for c in range(3)]
        variants = {}
        leafy = any(t in "LF" for _, _, t in frames)
        plan = ([("wiosna", 0, 0), ("jesien1", 2, 0), ("jesien2", 2, 1), ("jesien3", 2, 2)] if leafy else []) + [("zima", 3, 0)]
        for suf, s, tone in plan:
            out = a.copy()
            for r, c, t in frames:
                y0, x0 = r * fh, c * fw; blk = a[y0:y0 + fh, x0:x0 + fw]
                m, _, _, _ = P.veg_mask(blk, 0.12)
                hh, ss, vv = P.hsv(blk)
                if t in "LF":                                         # (the dark green-grey trunk under the crown stays: only the leaves)
                    strict = m & ((ss >= 0.3) | (vv >= 0.5)); ys = np.where(strict.any(1))[0]
                    if len(ys): m &= (np.arange(m.shape[0])[:, None] <= np.percentile(np.where(strict)[0], 97))
                if t == "P":
                    if s != 3: continue
                    new = winter_snow(P.recolour(blk, 3, "conifer"), m, orig=blk)
                elif t == "K":
                    if s != 3: continue
                    hh, ss, vv = P.hsv(blk)
                    lm = (blk[..., 3] > 0) & (ss > 0.32) & (vv > 0.22)      # the coloured leaves (the trunks are grey / dark)
                    new = winter_snow(P.winterize(blk, lm), lm, orig=blk)
                else:
                    new = P.recolour(blk, s, "leaves", tone, mask=m)
                    if s == 0 and t == "F": new = blossoms(new, m)
                    if s == 3: new = winter_snow(new, m, orig=blk)
                out[y0:y0 + fh, x0:x0 + fw] = new
            save(out, os.path.join(CH, name + "_" + suf + ".png"))
            variants[suf] = 1
        # the crowns of the leafy frames for the falling leaves: [px above the frame's foot: lowest, highest, half width]
        crown = []
        for r, cc, t in frames:
            if t not in "LF" or fw < 96: crown.append(None); continue
            m, _, _, _ = P.veg_mask(a[r * fh:(r + 1) * fh, cc * fw:(cc + 1) * fw], 0.12)
            ys, xs = np.where(m)
            if len(ys) < 50: crown.append(None); continue
            crown.append([int(fh - np.percentile(ys, 85)), int(fh - np.percentile(ys, 8)), int((np.percentile(xs, 92) - np.percentile(xs, 8)) / 2)])
        made[name] = {"s0": 1 if leafy else 0, "s2": 3 if leafy else 0, "s3": 1, "crown": crown if any(crown) else None}
        print("drzewa %-24s %s" % (name, sorted(variants)))
    return made

def leaves():
    # 4 colours (gold, orange, rust, brown) x 4 frames (turning): 12 x 12 px cells
    cols = [((236, 190, 70), (190, 136, 40)), ((232, 140, 50), (176, 92, 32)), ((198, 86, 40), (140, 52, 28)), ((160, 112, 60), (110, 74, 40))]
    shapes = [["...##.", "..####", ".#####", "#####.", ".###..", "..#..."],
              ["..##..", ".####.", "######", ".####.", "..##..", "..#..."],
              [".##...", "####..", "#####.", ".#####", "..####", "...#.."],
              ["......", "......", ".####.", "######", "..##..", "......"]]
    img = np.zeros((4 * 12, 4 * 12, 4), np.uint8)
    for ci, (lt, dk) in enumerate(cols):
        for fi, sh in enumerate(shapes):
            for y, row in enumerate(sh):
                for x, ch in enumerate(row):
                    if ch != "#": continue
                    edge = y == 0 or x == 0 or sh[y - 1][x] != "#" or (x > 0 and row[x - 1] != "#")
                    c = lt if edge else dk
                    img[ci * 12 + 3 + y, fi * 12 + 3 + x] = list(c) + [255]
    save(img, os.path.join(SYS, "PoryRoku_Liscie.png"))

def write_manifest(tl, ch):
    p = os.path.join(ROOT, "js", "plugins", "PoryRoku.js")
    b = open(p, "rb").read().decode("utf-8")
    i = b.index("// <PORY_DANE>"); j = b.index("// </PORY_DANE>")
    body = "// <PORY_DANE> (tools/klimat/pory_roku.py)\n    const SHEETS = " + json.dumps(tl, ensure_ascii=False) + ";\n    const CHARS = " + json.dumps(ch, ensure_ascii=False) + ";\n    "
    open(p, "wb").write((b[:i] + body + b[j:]).encode("utf-8"))
    print("spis wpisany do", p)

if __name__ == "__main__":
    tl = tiles(); ch = chars(); leaves(); write_manifest(tl, ch)
