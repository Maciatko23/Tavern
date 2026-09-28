"""Soft-edged overlay blocks: the SHAPE comes from a Winlu overlay (its painted alpha, slot by slot),
the colour from our 48-periodic texture.

Steps (all per slot of the 96x144 block):
  1. alpha = Winlu's alpha of kind 'mask' (k39 dirt path, k46 dark grass, k31, k23 ...), scaled so the
     body is 'body_alpha' (k46's own body is only 92.5 % opaque)
  2. optional: 'straighten' blends the edge pieces toward their mean profile along the edge (weaker
     per-cell 'string of beads' on straight paths); 'alpha_blur' smooths Winlu's small hard notches
  3. 'border_fade': cell-border sides that face another kind fade to 0 (Winlu keeps up to 60 % there,
     which shows as a straight cut when the new ground is darker than Winlu's)
  4. HARMONISE: every quarter side is a piece of the fine dual grid (cell vertex - edge midpoint - cell
     centre); all pieces MZ can put on either side of one such line get the same alpha profile on it,
     ends pinned (0 at a point that touches another kind, body alpha at a point inside the patch);
     the change is faded into the quarter over 'depth' px. So ANY arrangement MZ draws joins exactly
     (Winlu's own blocks have small steps at some joins) while the inside keeps Winlu's painted shape.
  5. 'wobble': our own periodic warped noise moves alpha only inside the fade (a*(1-a) weight): a
     function of the place in the cell, so joins stay exact
  6. colour = texture at the quarter's own place in the cell, darker where alpha fades ('rim_k'),
     optionally blended toward 'edge_tex' in the fade, plus 'spill' (stroke coverage that reaches a
     bit further out, e.g. needles on the grass)
  7. per-slot decorations (glints / twigs / pebbles) inside a margin of the quarter
  The thumbnail (editor icon only - MZ draws an isolated cell with the four outer corners) is the
  isolated cell of the finished block.
"""
import numpy as np
from PIL import Image

from . import tex as T
from . import mz

Q = mz.Q


def _flags(t):
    """(v, h, d) of a piece type: vertical / horizontal / diagonal neighbour of the same kind."""
    return t in ("body", "inner", "edgeV"), t in ("body", "inner", "edgeH"), t == "body"


# point states at the 4 corners of a quarter, as (row, col) -> state, and the lines' segment classes
def _quarter_geometry(qi, t):
    v, h, d = _flags(t)
    vx = v and h and d
    if qi == 0:     # TL: corners TLv, Tm, Lm, C
        pts = {(0, 0): vx, (0, 1): v, (1, 0): h, (1, 1): True}
        seg = {"top": "HB0", "left": "VB0", "right": "CU", "bottom": "CL"}
    elif qi == 1:   # TR: Tm, TRv, C, Rm
        pts = {(0, 0): v, (0, 1): vx, (1, 0): True, (1, 1): h}
        seg = {"top": "HB1", "right": "VB0", "left": "CU", "bottom": "CR"}
    elif qi == 2:   # BL: Lm, C, BLv, Bm
        pts = {(0, 0): h, (0, 1): True, (1, 0): vx, (1, 1): v}
        seg = {"bottom": "HB0", "left": "VB1", "top": "CL", "right": "CD"}
    else:           # BR: C, Rm, Bm, BRv
        pts = {(0, 0): True, (0, 1): h, (1, 0): v, (1, 1): vx}
        seg = {"bottom": "HB1", "right": "VB1", "top": "CR", "left": "CD"}
    return pts, seg


def _line_ends(side, pts):
    """Start / end point states of a quarter side (horizontal lines left->right, vertical top->bottom)."""
    if side == "top":
        return pts[(0, 0)], pts[(0, 1)]
    if side == "bottom":
        return pts[(1, 0)], pts[(1, 1)]
    if side == "left":
        return pts[(0, 0)], pts[(1, 0)]
    return pts[(0, 1)], pts[(1, 1)]


def _get_line(a, side):
    return {"top": a[0, :], "bottom": a[-1, :], "left": a[:, 0], "right": a[:, -1]}[side].copy()


# how much each piece type's own side profile counts when the pieces that can meet on one line
# agree on a common profile: straight edges are by far the most common on the maps, so they keep
# their shape and the corners (rarer, and rounder anyway) adapt to them
PIECE_WEIGHT = {"body": 1.0, "edgeV": 1.0, "edgeH": 1.0, "inner": 0.3, "outer": 0.3}


def _membrane(ring, length):
    """Smooth correction field inside a 24x24 quarter whose outer ring is fixed (Dirichlet): the
    screened Poisson solution (del^2 - 1/length^2) u = 0. Sharp changes along a side stay local,
    smooth ones reach about 'length' px in - no streaks along the quarter lines."""
    u = ring.copy()
    fixed = np.zeros((Q, Q), bool)
    fixed[0, :] = fixed[-1, :] = fixed[:, 0] = fixed[:, -1] = True
    k = 4.0 + 1.0 / max(1e-6, length) ** 2
    for _ in range(400):
        nb = np.zeros_like(u)
        nb[1:-1, 1:-1] = u[:-2, 1:-1] + u[2:, 1:-1] + u[1:-1, :-2] + u[1:-1, 2:]
        u = np.where(fixed, ring, nb / k)
    return u


def harmonise(alphas, body=1.0, depth=6.0, weights=None):
    """alphas: {slot: 24x24 alpha 0..1} for the 20 island / inner slots. Returns a new dict whose
    quarter sides agree for every pair MZ can put next to each other (see the module doc): every
    group of sides that can meet gets one common profile (the weighted mean of their own, see
    PIECE_WEIGHT, ends pinned to the points' values), and each quarter is bent to it with a smooth
    membrane that reaches about 'depth' px in."""
    weights = weights or PIECE_WEIGHT
    groups = {}
    for slot, (qi, t) in mz.SLOTS.items():
        pts, seg = _quarter_geometry(qi, t)
        for side, s in seg.items():
            key = (s, ) + _line_ends(side, pts)
            groups.setdefault(key, []).append((weights.get(t, 1.0), _get_line(alphas[slot], side)))
    target = {}
    u = np.linspace(0, 1, Q)
    for key, lines in groups.items():
        _, a0, a1 = key
        if not a0 and not a1:
            target[key] = np.zeros(Q)
            continue
        w = np.array([x[0] for x in lines])
        m = (np.array([x[1] for x in lines]) * w[:, None]).sum(0) / w.sum()
        e0, e1 = (body if a0 else 0.0), (body if a1 else 0.0)
        m = m + (e0 - m[0]) * (1 - u) + (e1 - m[-1]) * u      # pin the ends to the points' values
        target[key] = np.clip(m, 0, body)
    out = {}
    for slot, (qi, t) in mz.SLOTS.items():
        a = alphas[slot]
        pts, seg = _quarter_geometry(qi, t)
        tl = {side: target[(s, ) + _line_ends(side, pts)] for side, s in seg.items()}
        ring = np.zeros((Q, Q))
        ring[0, :] = tl["top"] - a[0, :]
        ring[-1, :] = tl["bottom"] - a[-1, :]
        ring[:, 0] = tl["left"] - a[:, 0]
        ring[:, -1] = tl["right"] - a[:, -1]
        # the 4 corner pixels belong to two sides; the targets agree there (both pinned to the point)
        out[slot] = np.clip(a + _membrane(ring, depth), 0, body)
        for side in ("top", "bottom", "left", "right"):          # exact on the ring
            if side == "top":
                out[slot][0, :] = tl[side]
            elif side == "bottom":
                out[slot][-1, :] = tl[side]
            elif side == "left":
                out[slot][:, 0] = tl[side]
            else:
                out[slot][:, -1] = tl[side]
    return out


def outer_sides(qi, t):
    """Sides of a quarter that lie on a cell border facing a cell of another kind."""
    horiz = "l" if qi % 2 == 0 else "r"
    vert = "t" if qi // 2 == 0 else "b"
    if t == "outer":
        return {horiz, vert}
    if t == "edgeV":
        return {horiz}
    if t == "edgeH":
        return {vert}
    return set()


def _border_fade(a, sides, width):
    if width <= 0:
        return a
    u = np.clip((np.arange(Q) + 0.5) / width, 0, 1)
    u = u * u * (3 - 2 * u)
    f = np.ones((Q, Q))
    for s in sides:
        if s == "l":
            f *= u[None, :]
        elif s == "r":
            f *= u[::-1][None, :]
        elif s == "t":
            f *= u[:, None]
        else:
            f *= u[::-1][:, None]
    return a * f


def _straighten(alphas, amount):
    """Blend each straight-edge run toward its mean profile across the edge (the two quarters of one
    side of a cell together, e.g. TL-edgeV + BL-edgeV for a left edge)."""
    if amount <= 0:
        return alphas
    runs = [((0, 4), (0, 3), "v"), ((3, 4), (3, 3), "v"), ((2, 2), (1, 2), "h"), ((2, 5), (1, 5), "h")]
    out = dict(alphas)
    for s1, s2, d in runs:
        a1, a2 = alphas[s1], alphas[s2]
        if d == "v":
            prof = np.concatenate([a1, a2], 0).mean(0)          # function of x
            out[s1] = a1 * (1 - amount) + prof[None, :] * amount
            out[s2] = a2 * (1 - amount) + prof[None, :] * amount
        else:
            prof = np.concatenate([a1, a2], 1).mean(1)          # function of y
            out[s1] = a1 * (1 - amount) + prof[:, None] * amount
            out[s2] = a2 * (1 - amount) + prof[:, None] * amount
    return out


def edge_alpha(mask_kind=39, mask_sheet=None, body_alpha=1.0, alpha_gamma=1.0, straighten=0.0,
               alpha_blur=0.0, border_fade=4.0, harmonise_depth=6.0, wobble=0.0, wobble_seed=21,
               wobble_cells=4, fade_widen=0.0):
    """The alpha of the 20 island / inner slots (dict slot -> 24x24, 0..1)."""
    wb = mz.block_arr(mask_kind, mask_sheet)
    body_max = max(1e-6, mz.body_cell(wb)[..., 3].max() / 255.0)
    alphas = {}
    for (sx, sy), (qi, t) in mz.SLOTS.items():
        a = wb[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q, 3] / 255.0
        a = np.minimum(1.0, a / body_max)
        if alpha_gamma != 1.0:
            a = a ** alpha_gamma
        alphas[(sx, sy)] = a
    alphas = _straighten(alphas, straighten)
    if alpha_blur > 0:
        alphas = {s: T.gauss_clamp(a, alpha_blur) for s, a in alphas.items()}
    if fade_widen > 0:
        # push the fade outward: a -> 1 - (1 - a)^(1 + widen) keeps 0 and 1, lifts the middle
        alphas = {s: 1 - (1 - np.clip(a, 0, 1)) ** (1 + fade_widen) for s, a in alphas.items()}
    alphas = {s: _border_fade(a, outer_sides(*mz.SLOTS[s]), border_fade) for s, a in alphas.items()}
    alphas = harmonise(alphas, 1.0, harmonise_depth)
    if wobble:
        WOB = 0.7 * (T.warped_noise(48, 48 / wobble_cells / 2.5, wobble_seed, 4.0) * 2 - 1) \
            + 0.3 * (T.blur_noise(48, 1.2, wobble_seed + 5) * 2 - 1)
        for (sx, sy), (qi, t) in mz.SLOTS.items():
            a = alphas[(sx, sy)]
            ox, oy = (qi % 2) * Q, (qi // 2) * Q
            alphas[(sx, sy)] = np.clip(a + wobble * WOB[oy:oy + Q, ox:ox + Q] * 4 * a * (1 - a), 0, 1)
    return {s: a * body_alpha for s, a in alphas.items()}


# ------------------------------------------------------------------ decorations (per slot)
MARGIN = 3


def _slot_rng(seed, sx, sy):
    return np.random.default_rng(seed * 1000 + sx * 37 + sy * 101)


def _blend(dst, rgb, a, x, y):
    h, w = a.shape
    reg = dst[y:y + h, x:x + w]
    na = a[..., None]
    reg[..., :3] = reg[..., :3] * (1 - na) + rgb * na
    reg[..., 3:4] = np.maximum(reg[..., 3:4] / 255.0, na) * 255.0


def glint_sprite(rng, strength=1.0):
    """A tiny wet puddle: soft, cool, slightly darker oval with a pale highlight."""
    w, h = 7, 5
    Y, X = np.mgrid[0:h, 0:w].astype(float)
    cx, cy = (w - 1) / 2 + rng.uniform(-0.4, 0.4), (h - 1) / 2 + rng.uniform(-0.3, 0.3)
    rx, ry = rng.uniform(2.2, 3.0), rng.uniform(1.2, 1.7)
    d = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2
    pool = np.clip(1.15 - d, 0, 1) ** 1.2 * 0.5
    rgb = np.zeros((h, w, 3)) + np.array([66.0, 68.0, 72.0])
    core = np.exp(-(((X - cx + 0.7) / 1.0) ** 2 + ((Y - cy + 0.5) / 0.55) ** 2) * 1.6)
    rgb = rgb * (1 - core[..., None]) + np.array([182.0, 190.0, 198.0]) * core[..., None]
    return rgb, np.maximum(pool, core * 0.7) * strength


def pebble_sprite(rng, colour=(150, 140, 120), r=(1.2, 1.9), strength=1.0):
    """A small rounded stone, painted: lit up-left, shaded low-right, a soft contact shadow."""
    S = 4
    rr = rng.uniform(*r)
    ry = rr * rng.uniform(0.7, 0.95)
    w = int(np.ceil(rr * 2 + 3))
    h = int(np.ceil(ry * 2 + 3))
    Y, X = (np.mgrid[0:h * S, 0:w * S].astype(float) + 0.5) / S
    cx, cy = w / 2 - 0.4, h / 2 - 0.4
    d = ((X - cx) / rr) ** 2 + ((Y - cy) / ry) ** 2
    body = (d <= 1).astype(float)
    sh = (((X - cx - 0.8) / rr) ** 2 + ((Y - cy - 0.9) / ry) ** 2 <= 1).astype(float) * (1 - body)
    nx, ny = (X - cx) / rr, (Y - cy) / ry
    light = np.clip(-(nx + ny) * 0.55 + 0.35 - 0.25 * d, -1, 1)
    base = np.array(colour, float) * rng.uniform(0.9, 1.08)
    col = base[None, None, :] * (1 + 0.35 * light[..., None])
    rgb = col * body[..., None] + np.array([40.0, 34.0, 26.0]) * sh[..., None]
    a = np.maximum(body, sh * 0.45)
    # box down (anti-aliased)
    rgb = (rgb * a[..., None]).reshape(h, S, w, S, 3).mean((1, 3))
    a = a.reshape(h, S, w, S).mean((1, 3))
    rgb = rgb / np.maximum(a[..., None], 1e-6)
    return rgb, a * strength


def twig_sprite(rng, colour=(96, 70, 48)):
    """A small forked twig, anti-aliased, with a soft shadow."""
    S = 4
    w = h = 11
    im = np.zeros((h * S, w * S))
    sh = np.zeros((h * S, w * S))
    Y, X = (np.mgrid[0:h * S, 0:w * S].astype(float) + 0.5) / S
    ang = rng.uniform(0, np.pi)
    ln = rng.uniform(6.5, 8.5)
    cx, cy = w / 2, h / 2
    x0, y0 = cx - np.cos(ang) * ln / 2, cy - np.sin(ang) * ln / 2
    x1, y1 = cx + np.cos(ang) * ln / 2, cy + np.sin(ang) * ln / 2
    bt = rng.uniform(0.35, 0.65)
    bx, by = x0 + (x1 - x0) * bt, y0 + (y1 - y0) * bt
    ba = ang + rng.choice([-1, 1]) * rng.uniform(0.5, 0.9)
    segs = [((x0, y0), (x1, y1), 0.65), ((bx, by), (bx + np.cos(ba) * 2.8, by + np.sin(ba) * 2.8), 0.5)]
    for (ax, ay), (qx, qy), wd in segs:
        for arr, ox, oy in ((im, 0, 0), (sh, 0.6, 0.8)):
            px, py = X - ox, Y - oy
            dx, dy = qx - ax, qy - ay
            L2 = dx * dx + dy * dy
            tt = np.clip(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1)
            dist = np.hypot(px - (ax + tt * dx), py - (ay + tt * dy))
            arr[:] = np.maximum(arr, (dist <= wd).astype(float))
    lit = np.clip(1 - (Y - cy) * 0.05, 0.8, 1.2)
    rgb = np.array(colour, float)[None, None, :] * lit[..., None]
    a_t = im.reshape(h, S, w, S).mean((1, 3))
    a_s = sh.reshape(h, S, w, S).mean((1, 3)) * (1 - a_t) * 0.4
    rgb_t = rgb.reshape(h, S, w, S, 3).mean((1, 3))
    out = rgb_t * a_t[..., None] + np.array([28.0, 30.0, 22.0]) * a_s[..., None]
    a = a_t + a_s
    return out / np.maximum(a[..., None], 1e-6), np.clip(a, 0, 1)


def decorate(block, kind, seed=3, n_edge=(1, 2), n_body=0, min_alpha=0.55, colour=None, strength=1.0,
             size=None):
    """block: float RGBA 144x96. Puts small sprites fully inside quarters (so joins stay exact);
    the body slots get n_body each (0 keeps the big inner areas calm - they repeat every 48 px)."""
    for (sx, sy), (qi, t) in mz.SLOTS.items():
        rng = _slot_rng(seed, sx, sy)
        n = n_body if t == "body" else int(rng.integers(n_edge[0], n_edge[1] + 1))
        x0, y0 = sx * Q, sy * Q
        for _ in range(n):
            if kind == "glints":
                rgb, a = glint_sprite(rng, strength)
            elif kind == "pebbles":
                rgb, a = pebble_sprite(rng, colour or (150, 140, 120), tuple(size or (1.2, 1.9)), strength)
            else:
                rgb, a = twig_sprite(rng, colour or (96, 70, 48))
                a = a * strength
            h, w = a.shape
            if w > Q - 2 * MARGIN or h > Q - 2 * MARGIN:
                continue
            for _try in range(24):
                x = x0 + int(rng.integers(MARGIN, Q - MARGIN - w + 1))
                y = y0 + int(rng.integers(MARGIN, Q - MARGIN - h + 1))
                under = block[y:y + h, x:x + w, 3] / 255.0
                if (under[a > 0.2] >= min_alpha).all():
                    k = under if kind == "glints" else np.maximum(under, 0.8)
                    _blend(block, rgb, a * k, x, y)
                    break
    return block


# ------------------------------------------------------------------ the block
def overlay_block(tex, e):
    """tex: 48x48 RGB (0..255, periodic). e: the recipe's 'edge' dict. Returns float RGBA 144x96."""
    body_alpha = float(e.get("body_alpha", 1.0))
    alphas = edge_alpha(mask_kind=int(e.get("mask", 39)), mask_sheet=e.get("mask_sheet_path"),
                        body_alpha=body_alpha, alpha_gamma=float(e.get("alpha_gamma", 1.0)),
                        straighten=float(e.get("straighten", 0.0)), alpha_blur=float(e.get("alpha_blur", 0.0)),
                        border_fade=float(e.get("border_fade", 4.0)), harmonise_depth=float(e.get("depth", 6.0)),
                        wobble=float(e.get("wobble", 0.0)), wobble_seed=int(e.get("wobble_seed", 21)),
                        wobble_cells=float(e.get("wobble_cells", 4)), fade_widen=float(e.get("fade_widen", 0.0)))
    rim_k, rim_lo, rim_hi = float(e.get("rim_k", 0.12)), float(e.get("rim_lo", 0.3)), float(e.get("rim_hi", 0.95))
    rim_col = e.get("rim_rgb")
    edge_tex = e.get("_edge_tex")
    edge_mix = float(e.get("edge_mix", 0.0))
    spill = e.get("_spill")
    out = np.zeros((144, 96, 4))
    for (sx, sy), (qi, t) in mz.SLOTS.items():
        a = alphas[(sx, sy)]
        ox, oy = (qi % 2) * Q, (qi // 2) * Q
        rgb = tex[oy:oy + Q, ox:ox + Q, :3].copy()
        an = a / max(1e-6, body_alpha)
        if edge_tex is not None and edge_mix > 0:
            f = T.smoothstep(0.97, 0.4, an) * edge_mix
            rgb = rgb + (edge_tex[oy:oy + Q, ox:ox + Q, :3] - rgb) * f[..., None]
        fade = 1 - T.smoothstep(rim_lo, rim_hi, an)
        if rim_col is not None:
            rgb = rgb + (np.array(rim_col, float) - rgb) * (rim_k * fade)[..., None]
        else:
            rgb = rgb * (1 - rim_k * fade)[..., None]
        if spill is not None:
            gate = T.smoothstep(float(e.get("spill_gate", 0.05)), float(e.get("spill_gate", 0.05)) + 0.25, an)
            a = np.maximum(a, spill[oy:oy + Q, ox:ox + Q] * gate * 0.95 * body_alpha)
        out[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q, :3] = rgb
        out[sy * Q:sy * Q + Q, sx * Q:sx * Q + Q, 3] = a * 255.0
    return out


def finish_thumbnail(out, tex=None, e=None):
    """Top-left 48x48 = the editor's palette icon (MZ's shape 47; the maps draw an isolated cell with
    shape 46 = the four outer corners instead). With tex and e: the mask kind's own thumbnail shape
    (a big soft blob like Winlu's icons) in our colours, rim included; without: a copy of shape 46."""
    if tex is None or e is None:
        for i, (qx, qy) in enumerate(mz.mz_table()[46]):
            out[(i // 2) * Q:(i // 2) * Q + Q, (i % 2) * Q:(i % 2) * Q + Q] = out[qy * Q + 0:qy * Q + Q, qx * Q:qx * Q + Q]
        return out
    wb = mz.block_arr(int(e.get("mask", 39)), e.get("mask_sheet_path"))
    body_max = max(1e-6, mz.body_cell(wb)[..., 3].max() / 255.0)
    body_alpha = float(e.get("body_alpha", 1.0))
    an = np.minimum(1.0, wb[:48, :48, 3] / 255.0 / body_max)
    if float(e.get("alpha_blur", 0.0)) > 0:
        an = T.gauss_clamp(an, float(e["alpha_blur"]))
    rgb = tex[:48, :48, :3].copy()
    fade = 1 - T.smoothstep(float(e.get("rim_lo", 0.3)), float(e.get("rim_hi", 0.95)), an)
    rim_k = float(e.get("rim_k", 0.12))
    if e.get("rim_rgb") is not None:
        rgb = rgb + (np.array(e["rim_rgb"], float) - rgb) * (rim_k * fade)[..., None]
    else:
        rgb = rgb * (1 - rim_k * fade)[..., None]
    out[:48, :48, :3] = rgb
    out[:48, :48, 3] = an * body_alpha * 255.0
    return out


def to_image(out):
    return Image.fromarray(np.round(np.clip(out, 0, 255)).astype(np.uint8), "RGBA")
