"""Soft-edged MZ A2 overlay autotile (Winlu-like: semi-transparent fade, slightly darker rim) from a
seamless 48x48 texture, plus the plain ground block and the test sheet.

Geometry = the 'half' dual grid of tools/tiles/wang_to_a2_a.py / organic_a2.py: every quarter of a cell
has 4 corner points (cell vertex, two edge midpoints, cell centre); a point is the terrain when all the
cells touching it are. Per pixel
    F = bilinear(corners as +1/-1) + bias + amp * Nwarp(X, Y) + fine * Nfine(X, Y)
with both noises periodic over the 48 px cell (X, Y = place in the cell). F is continuous across every
quarter edge inside the terrain (both quarters see the same two points), so ANY MZ arrangement joins
without seams; only at a cell border towards a non-terrain cell does the other side draw nothing, and
there F <= -1 + bias + amp + fine, which is kept below the fade's start, so alpha is 0 on that border.
    alpha  = smoothstep(-w_out, w_in, F) * body_alpha
    colour = texture * (1 - rim_k * (1 - smoothstep(0, rim_w, F)))     (darker, wetter rim)
    ragged = sparse texture pixels (e.g. needles) allowed a little further out, like Winlu's k46 fluff

usage:
  python a2_soft.py --tex mud.png --out k39.png [--bias .. --amp .. ...]     overlay block
  python a2_soft.py --plain mud.png --out k24.png                            plain L0 block
  python a2_soft.py --sheet OUT.png --k39 a.png --k46 b.png --k24 c.png      test sheet (Winlu A2 copy)
  python a2_soft.py --test DIR --tex mud.png [...]                           MZ-table self-test
"""
import argparse, json, os, random, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", ".."))
import softlib as S
import wang_to_a2_a as W
from refs import A2

Q = 24
PRESETS = {
    # wet mud: fairly tight soft edge (like Winlu's k39 dirt, ~6-10 px), dark wet rim
    "mud": dict(bias=0.08, amp=0.40, cells=3, warp=5.0, seed=11, fine=0.08, fine_cells=10, gamma=0.6,
                w_out=0.40, w_in=0.18, rim_k=0.22, rim_w=0.45, body_alpha=1.0, rag=0.0),
    # forest floor: wide airy fade like Winlu's k46, a slightly dark rim, stray needles past the edge
    "forest": dict(bias=0.0, amp=0.34, cells=3, warp=6.0, seed=5, fine=0.10, fine_cells=12, gamma=0.7,
                   w_out=0.40, w_in=0.40, rim_k=0.10, rim_w=0.5, body_alpha=0.97, rag=0.14),
}


class SoftField:
    def __init__(self, p):
        self.p = p
        self.N = S.warped_noise(48, p["cells"], p["seed"], p["warp"], octaves=3)
        self.Nf = S.value_noise(48, p["fine_cells"], p["seed"] + 7, octaves=2)
        lim = -1 + p["bias"] + p["amp"] + p["fine"]
        assert lim <= -p["w_out"] + 1e-9, "alpha would not reach 0 on a cell border (%.2f > %.2f)" % (lim, -p["w_out"])
        assert lim <= -p["w_out"] - p.get("rag", 0) + 1e-9, "stray bits would reach a cell border"

    def quarter(self, corners, qi):
        s = [1.0 if c else -1.0 for c in corners]
        u = (np.arange(Q) + 0.5) / Q
        fu, fv = np.meshgrid(u, u)
        b = s[0] * (1 - fu) * (1 - fv) + s[1] * fu * (1 - fv) + s[2] * (1 - fu) * fv + s[3] * fu * fv
        p = self.p
        # gamma < 1 pushes the edge out towards the cell border (Winlu's patches nearly fill their cells)
        b = 2 * ((b + 1) / 2) ** p.get("gamma", 1.0) - 1
        ox, oy = (qi % 2) * Q, (qi // 2) * Q
        return b + p["bias"] + p["amp"] * self.N[oy:oy + Q, ox:ox + Q] + p["fine"] * self.Nf[oy:oy + Q, ox:ox + Q]


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def draw_quarter(field, corners, qi, tex, ragmask):
    p = field.p
    F = field.quarter(corners, qi)
    ox, oy = (qi % 2) * Q, (qi // 2) * Q
    t = tex[oy:oy + Q, ox:ox + Q]
    a = smoothstep(-p["w_out"], p["w_in"], F)
    if p["rag"] > 0 and ragmask is not None:
        # stray bits (needles) survive a little further out than the fade
        rz = smoothstep(-p["w_out"] - p["rag"], -p["w_out"] + 0.12, F) * ragmask[oy:oy + Q, ox:ox + Q]
        a = np.maximum(a, 0.85 * rz * (F < p["w_in"]))
    a = a * p["body_alpha"]
    dark = 1 - p["rim_k"] * (1 - smoothstep(0, p["rim_w"], F))
    rgb = t * dark[..., None]
    out = np.concatenate([np.clip(rgb, 0, 255), (np.clip(a, 0, 1) * 255)[..., None]], -1)
    return out


def rag_mask(tex, frac=0.12):
    """Pixels that stand out from the moss by hue (needles, twigs): the warmest few percent."""
    o = S.to_opp(tex)
    warm = o[..., 1] + 0.5 * o[..., 2]
    thr = np.percentile(warm, 100 - frac * 100)
    return (warm >= thr).astype(float)


def build(tex, p):
    field = SoftField(p)
    rm = rag_mask(tex) if p.get("rag") else None
    block = np.zeros((144, 96, 4))
    for (sx, sy), (qi, t) in W.SLOTS.items():
        c = W.corners_for(qi, t)
        block[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q] = draw_quarter(field, c, qi, tex, rm)
    im = Image.fromarray(np.round(block).astype(np.uint8), "RGBA")
    im.paste(W.render_isolated(im), (0, 0))
    return im


def outer_sides(qi, t):
    """Which sides of a quarter lie on the cell border that faces a cell of another kind
    (for piece type t): returns a set of 'l', 'r', 't', 'b'."""
    horiz = "l" if qi % 2 == 0 else "r"
    vert = "t" if qi // 2 == 0 else "b"
    if t == "outer":
        return {horiz, vert}
    if t == "edgeV":          # the horizontal neighbour differs -> the left/right side
        return {horiz}
    if t == "edgeH":
        return {vert}
    return set()


def build_winlu_mask(tex, kind, rim_k=0.15, rim_lo=0.35, rim_hi=0.95, alpha_gamma=1.0, border_fade=3.0,
                     body_alpha=None, stray=None, decor=None, twigs=None, decor_seed=3, n_body=1, n_edge_min=1, n_edge_max=2,
                     wobble=0.0, wobble_seed=21):
    """The overlay's SHAPE is Winlu's own (the alpha of Winlu block 'kind', slot by slot); the colour is
    our texture at the quarter's place, darker where Winlu's alpha fades (wet rim). The cell-border
    sides that face another kind fade to 0 over 'border_fade' px (Winlu leaves up to ~60%% there, which
    shows as a straight cut with a dark texture)."""
    from refs import block as winlu_block
    wb = np.asarray(winlu_block(kind).convert("RGBA")).astype(np.float64)
    out = np.zeros((144, 96, 4))
    # our own wobble on Winlu's fade: a periodic (48 px) warped noise, a function of the pixel's place
    # in its cell, so it is continuous across quarter and cell edges; it only moves alpha INSIDE the
    # fade (a*(1-a) weight), never where Winlu is fully opaque or empty -> Winlu's joins stay intact
    WOB = (0.7 * S.warped_noise(48, 4, int(wobble_seed), 4.0, octaves=2)
           + 0.3 * S.value_noise(48, 12, int(wobble_seed) + 5, octaves=1)) if wobble else None

    def wob(a, ox, oy, h, w):
        if WOB is None:
            return a
        top = body_alpha if body_alpha is not None else 1.0
        t = np.clip(a / top, 0, 1)
        return np.clip(a + wobble * top * WOB[oy:oy + h, ox:ox + w] * 4 * t * (1 - t), 0, top)
    u = np.arange(Q) + 0.5
    for (sx, sy), (qi, t) in W.SLOTS.items():
        a = wb[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q, 3] / 255.0
        if body_alpha is not None:
            a = np.minimum(1, a / max(1e-6, wb[72:120, 24:72, 3].max() / 255.0)) * body_alpha
        a = a ** alpha_gamma
        a = wob(a, (qi % 2) * Q, (qi // 2) * Q, Q, Q)
        if border_fade > 0:
            f = np.ones((Q, Q))
            for side in outer_sides(qi, t):
                if side == "l":
                    f *= np.clip(u / border_fade, 0, 1)[None, :]
                elif side == "r":
                    f *= np.clip(u[::-1] / border_fade, 0, 1)[None, :]
                elif side == "t":
                    f *= np.clip(u / border_fade, 0, 1)[:, None]
                else:
                    f *= np.clip(u[::-1] / border_fade, 0, 1)[:, None]
            a = a * f
        ox, oy = (qi % 2) * Q, (qi // 2) * Q
        tq = tex[oy:oy + Q, ox:ox + Q]
        dark = 1 - rim_k * (1 - smoothstep(rim_lo, rim_hi, a))
        out[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q, :3] = tq * dark[..., None]
        out[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q, 3] = np.clip(a, 0, 1) * 255
    # the thumbnail is also what MZ draws for an ISOLATED cell (shape 47): Winlu paints its own blob
    # there, so take that alpha too (texture at its natural place, all 4 sides fade to 0)
    a = wb[0:48, 0:48, 3] / 255.0
    if body_alpha is not None:
        a = np.minimum(1, a / max(1e-6, wb[72:120, 24:72, 3].max() / 255.0)) * body_alpha
    a = a ** alpha_gamma
    a = wob(a, 0, 0, 48, 48)
    if border_fade > 0:
        v = np.clip((np.arange(48) + 0.5) / border_fade, 0, 1)
        f = np.minimum(v, v[::-1])
        a = a * f[None, :] * f[:, None]
    dark = 1 - rim_k * (1 - smoothstep(rim_lo, rim_hi, a))
    out[0:48, 0:48, :3] = tex * dark[..., None]
    out[0:48, 0:48, 3] = np.clip(a, 0, 1) * 255
    if decor:
        out = decorate(out, decor, seed=int(decor_seed), twigs=twigs, n_body=int(n_body),
                       n_edge=(int(n_edge_min), int(n_edge_max)))
        rng = _slot_rng(int(decor_seed), 9, 9)
        for _ in range(2 if decor == "twigs" else 1):     # the isolated cell gets its own
            rgb, al = glint_sprite(rng) if decor == "glints" else twig_sprite(rng, twigs)
            h, w = al.shape
            x, y = int(rng.integers(12, 36 - w)), int(rng.integers(12, 36 - h))
            under = out[y:y + h, x:x + w, 3] / 255.0
            _blend(out, rgb, al * (under if decor == "glints" else np.maximum(under, 0.7)), x, y)
    im = Image.fromarray(np.round(np.clip(out, 0, 255)).astype(np.uint8), "RGBA")
    return im


# ---------------------------------------------------------------- per-slot decorations
# A texture repeats every 48 px (MZ draws every inner cell from the same 4 body slots), so anything
# distinctive in it forms a visible lattice. But each SLOT may carry its own small things as long as
# they lie fully inside the quarter (quarter edges then still join): glints / twigs go there, so the
# rims and corners of every patch get different ones and the big inner areas stay calm.
MARGIN = 3


def _slot_rng(seed, sx, sy):
    return np.random.default_rng(seed * 1000 + sx * 37 + sy * 101)


def _blend(dst, rgb, a, x, y):
    """Alpha-blend a small RGB+alpha sprite into an RGBA float array (colour AND coverage)."""
    h, w = a.shape
    reg = dst[y:y + h, x:x + w]
    A = reg[..., 3:4] / 255.0
    na = a[..., None]
    reg[..., :3] = reg[..., :3] * (1 - na) + rgb * na
    reg[..., 3:4] = np.maximum(A, na) * 255.0


def glint_sprite(rng):
    """A tiny wet puddle: a soft, cool, slightly darker oval with a pale highlight (painted, not pixel)."""
    w, h = 7, 5
    Y, X = np.mgrid[0:h, 0:w].astype(float)
    cx, cy = (w - 1) / 2 + rng.uniform(-0.4, 0.4), (h - 1) / 2 + rng.uniform(-0.3, 0.3)
    rx, ry = rng.uniform(2.3, 3.1), rng.uniform(1.3, 1.8)
    d = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2
    pool = np.clip(1.15 - d, 0, 1) ** 1.2 * 0.55
    rgb = np.zeros((h, w, 3)) + np.array([62.0, 64.0, 70.0])
    core = np.exp(-(((X - cx + 0.7) / 1.0) ** 2 + ((Y - cy + 0.5) / 0.55) ** 2) * 1.6)
    rgb = rgb * (1 - core[..., None]) + np.array([188.0, 196.0, 204.0]) * core[..., None]
    a = np.maximum(pool, core * 0.75)
    return rgb, a


def load_twigs(paths, min_px=4, max_wh=12):
    """Twig / needle sprites = connected blobs of PixelLab's own twig layers (create_tiles_pro
    style-mode output, tiles 12-15), cropped."""
    from collections import deque
    out = []
    for p in paths:
        a = np.asarray(Image.open(p).convert("RGBA")).astype(float)
        m = a[..., 3] > 0
        seen = np.zeros_like(m)
        H, Wd = m.shape
        for y in range(H):
            for x in range(Wd):
                if m[y, x] and not seen[y, x]:
                    q = deque([(y, x)]); seen[y, x] = True; pts = []
                    while q:
                        cy, cx = q.popleft(); pts.append((cy, cx))
                        for dy in (-1, 0, 1):
                            for dx in (-1, 0, 1):
                                ny, nx = cy + dy, cx + dx
                                if 0 <= ny < H and 0 <= nx < Wd and m[ny, nx] and not seen[ny, nx]:
                                    seen[ny, nx] = True; q.append((ny, nx))
                    ys, xs = [p_[0] for p_ in pts], [p_[1] for p_ in pts]
                    y0, x0, y1, x1 = min(ys), min(xs), max(ys) + 1, max(xs) + 1
                    if len(pts) >= min_px and max(y1 - y0, x1 - x0) <= max_wh:
                        sp = a[y0:y1, x0:x1].copy()
                        msk = np.zeros((y1 - y0, x1 - x0))
                        for (py, px) in pts:
                            msk[py - y0, px - x0] = 1
                        sp[..., 3] = sp[..., 3] * msk
                        out.append(sp)
    return out


def twig_sprite(rng, twigs, tint=(112.0, 84.0, 58.0)):
    sp = twigs[rng.integers(len(twigs))].copy()
    if rng.random() < 0.5:
        sp = sp[:, ::-1]
    if rng.random() < 0.5:
        sp = sp.transpose(1, 0, 2)
    rgb, a = sp[..., :3], sp[..., 3] / 255.0
    # into Winlu's calm browns: keep the twig's own light/dark, move its colour to the tint
    L = S.lum(rgb)
    Lm = L[a > 0].mean() if (a > 0).any() else 1
    rgb = np.array(tint)[None, None, :] * (0.75 + 0.35 * (L / max(1, Lm)))[..., None]
    rgb = rgb * 0.8 + S.lum(rgb)[..., None] * 0.2
    # a soft 1 px shadow (down-right) so it lies on the ground
    h, w = a.shape
    big = np.zeros((h + 1, w + 1, 3)); ba = np.zeros((h + 1, w + 1))
    ba[1:, 1:] = a * 0.30
    big[1:, 1:] = np.array([30.0, 36.0, 24.0])
    big[:h, :w] = np.where(a[..., None] > 0, rgb, big[:h, :w])
    ba[:h, :w] = np.maximum(ba[:h, :w], a * 0.88)
    return big, ba


def decorate(block, kind, seed=3, twigs=None, n_edge=(1, 2), n_body=1, min_alpha=0.55):
    """block: float RGBA 144x96 array (no thumbnail yet). kind 'glints' or 'twigs'."""
    for (sx, sy), (qi, t) in W.SLOTS.items():
        rng = _slot_rng(seed, sx, sy)
        n = n_body if t == "body" else int(rng.integers(n_edge[0], n_edge[1] + 1))
        if t == "body" and (sx, sy) != (2, 4) and kind == "glints":
            n = 0                                 # one glint in the whole inner cell, not four
        x0, y0 = sx * Q, sy * Q
        for _ in range(n):
            rgb, a = glint_sprite(rng) if kind == "glints" else twig_sprite(rng, twigs)
            h, w = a.shape
            for _try in range(20):
                x = x0 + int(rng.integers(MARGIN, Q - MARGIN - w + 1))
                y = y0 + int(rng.integers(MARGIN, Q - MARGIN - h + 1))
                under = block[y:y + h, x:x + w, 3] / 255.0
                need = min_alpha if kind == "glints" else 0.25
                if (under[a > 0.2] >= need).all():
                    _blend(block, rgb, a * (under if kind == "glints" else np.maximum(under, 0.7)), x, y)
                    break
    return block


def plain(tex):
    t = S.to_img(tex).convert("RGBA")
    return W.plain_block(t) if hasattr(W, "plain_block") else None


def render_global(grid, p, tex, base):
    """The same field over the whole map at once (fine dual grid points), no MZ table."""
    field = SoftField(p)
    rm = rag_mask(tex) if p.get("rag") else None
    H, Wd = len(grid), len(grid[0])
    def s(xx, yy):
        return True if not (0 <= xx < Wd and 0 <= yy < H) else grid[yy][xx]
    def point(px, py):
        cells = [(cx, cy) for cx in {(px - 1) // 2, px // 2} for cy in {(py - 1) // 2, py // 2}]
        return all(s(cx, cy) for cx, cy in cells)
    out = Image.new("RGBA", (Wd * 48, H * 48))
    for y in range(H):
        for x in range(Wd):
            out.paste(base, (x * 48, y * 48))
    for qy in range(2 * H):
        for qx in range(2 * Wd):
            c = (point(qx, qy), point(qx + 1, qy), point(qx, qy + 1), point(qx + 1, qy + 1))
            cell_is = s(qx // 2, qy // 2)
            if not cell_is:
                continue
            qi = (qx % 2) + 2 * (qy % 2)
            q = Image.fromarray(np.round(draw_quarter(field, c, qi, tex, rm)).astype(np.uint8), "RGBA")
            out.alpha_composite(q, (qx * Q, qy * Q))
    return out


def self_test(tex, p, outdir, base):
    table = W.mz_table()
    block = build(tex, p)
    rnd = random.Random(11)
    Wd, H = 64, 76
    grid = [[False] * Wd for _ in range(H)]
    for n in range(256):
        px0, py0 = (n % 16) * 4, (n // 16) * 4
        grid[py0 + 1][px0 + 1] = True
        for bit, (dx, dy) in enumerate([(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]):
            grid[py0 + 1 + dy][px0 + 1 + dx] = bool(n >> bit & 1)
    for y in range(64, H):
        for x in range(Wd):
            grid[y][x] = rnd.random() < 0.6 or (68 <= y < 72 and 4 <= x < 10)
    mz = W.render_mz(grid, block, base, table)
    ref = render_global(grid, p, tex, base)
    a, b = np.asarray(mz).astype(int), np.asarray(ref).astype(int)
    d = int((np.abs(a - b).max(2) > 1).sum())
    # alpha on the cell borders that face a non-terrain cell (should be ~0: no hard cut)
    al = np.asarray(block)[..., 3]
    border = max(al[48:144, 0].max(), al[48:144, 95].max(), al[48, 0:96].max(), al[143, 0:96].max())
    print("MZ table vs the field drawn over the whole map: %d pixels differ (>1) -> %s; max alpha on outer cell borders %d" % (
        d, "PASS" if d == 0 else "FAIL", border))
    if outdir:
        os.makedirs(outdir, exist_ok=True)
        mz.crop((0, 64 * 48 - 96, 20 * 48, H * 48)).save(os.path.join(outdir, "soft_test_mz.png"))
        block.save(os.path.join(outdir, "soft_test_block.png"))
    return d


def paste_sheet(out, blocks):
    sheet = Image.open(A2).convert("RGBA")
    for k, path in blocks.items():
        if not path:
            continue
        b = Image.open(path).convert("RGBA")
        c, r = (k - 16) % 8, (k - 16) // 8
        region = (c * 96, r * 144, c * 96 + 96, r * 144 + 144)
        sheet.paste(Image.new("RGBA", (96, 144)), region)
        sheet.paste(b, region)
    sheet.save(out)
    print("sheet ->", out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tex"); ap.add_argument("--out"); ap.add_argument("--plain")
    ap.add_argument("--preset", default="mud"); ap.add_argument("--test")
    ap.add_argument("--sheet"); ap.add_argument("--k39"); ap.add_argument("--k46"); ap.add_argument("--k24")
    ap.add_argument("--set", action="append", default=[], help="override a preset value, e.g. --set amp=0.4")
    ap.add_argument("--winlu-mask", type=int, help="take the overlay shape (alpha) from this Winlu A2 kind")
    ap.add_argument("--wm", action="append", default=[], help="winlu-mask option, e.g. --wm rim_k=0.2")
    ap.add_argument("--decor", choices=["glints", "twigs"], help="per-slot decorations")
    ap.add_argument("--twigs", nargs="*", help="PixelLab twig layers (transparent PNGs) for --decor twigs")
    a = ap.parse_args()
    if a.winlu_mask:
        kw = {k: float(v) for k, v in (x.split("=") for x in a.wm)}
        if a.decor:
            kw["decor"] = a.decor
        if a.twigs:
            kw["twigs"] = load_twigs(a.twigs)
        build_winlu_mask(S.load_rgb(a.tex), a.winlu_mask, **kw).save(a.out)
        return
    if a.sheet:
        paste_sheet(a.sheet, {39: a.k39, 46: a.k46, 24: a.k24})
        return
    if a.plain:
        tex = S.load_rgb(a.plain)
        t = S.to_img(tex).convert("RGBA")
        block = Image.new("RGBA", (96, 144))
        for (sx, sy), (qi, typ) in W.SLOTS.items():
            block.paste(t.crop(((qi % 2) * Q, (qi // 2) * Q, (qi % 2) * Q + Q, (qi // 2) * Q + Q)), (sx * Q, sy * Q))
        if a.decor == "glints":
            arr = decorate(np.asarray(block).astype(np.float64), "glints", seed=9)
            block = Image.fromarray(np.round(arr).astype(np.uint8), "RGBA")
            t = Image.new("RGBA", (48, 48))
            for (sx, sy), (qi, typ) in W.SLOTS.items():
                if typ == "body":
                    t.paste(block.crop((sx * Q, sy * Q, sx * Q + Q, sy * Q + Q)), ((qi % 2) * Q, (qi // 2) * Q))
        block.paste(t, (0, 0))
        block.save(a.out)
        return
    p = dict(PRESETS[a.preset])
    for kv in a.set:
        k, v = kv.split("=")
        p[k] = type(p[k])(float(v)) if not isinstance(p[k], int) else int(float(v))
    tex = S.load_rgb(a.tex)
    if a.test:
        from refs import block as winlu_block
        base = winlu_block(16).crop((24, 72, 72, 120)).convert("RGBA")
        sys.exit(0 if self_test(tex, p, a.test, base) == 0 else 1)
    build(tex, p).save(a.out)


if __name__ == "__main__":
    main()
