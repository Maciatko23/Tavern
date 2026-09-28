"""The CONTENT of a new ground: a 48x48 periodic RGB texture (0..255).

Made from Winlu's own painted tiles (0 generations) and/or saved PixelLab images (tools/tiles/soft/src),
then given the 'Winlu finish' (finish()): every scale band of the luma gets the contrast a Winlu
reference ground has at that scale, Winlu's own 1-px brush grain is mixed into the finest bands, the
chroma is smoothed a little and the mean colour set. That finish is what makes a texture sit next to
Winlu's grass without looking foreign (method S3 of the 2026-09-27 pilot); the content steps before it
(recolour, mask blends, strokes) decide what the material reads as (method S2).

A recipe's "texture" section is run by build_texture(); every knob is described in README.md.
"""
import os
import numpy as np
from PIL import Image, ImageDraw

from . import tex as T
from . import mz
from . import paths as P


# ------------------------------------------------------------------ sources
def winlu(kind, sheet=None, over=None):
    """Body texture (the inner cell) of a Winlu A2 kind; overlays are composited over 'over' (default
    grass k16). kind may be a list: an even mix of several kinds (e.g. two grasses)."""
    kinds = kind if isinstance(kind, (list, tuple)) else [kind]
    path = P.sheet_path(sheet)
    texs = [mz.winlu_body(k, path, over) for k in kinds]
    if len(texs) == 1:
        return texs[0]
    # mix around the mean with rolled copies, variance kept (1 / sqrt(n))
    mean = np.mean([t.reshape(-1, 3).mean(0) for t in texs], 0)
    acc = sum(T.roll(t - t.reshape(-1, 3).mean(0), 13 * i, 29 * i) for i, t in enumerate(texs))
    return acc / np.sqrt(len(texs)) + mean


def fill_holes(rgba):
    """Transparent pixels (PixelLab sometimes leaves a few) get the blurred colour around them."""
    a = rgba[..., :3].copy()
    m = (rgba[..., 3] > 128).astype(float)
    if m.min() > 0:
        return a
    num = T.gauss(a * m[..., None], 2.0)
    den = T.gauss(m, 2.0)[..., None]
    return np.where(m[..., None] > 0, a, num / np.maximum(den, 1e-6))


def deglint(a, hi=96, hi_blue=88):
    """Take a generated image's own bright glints out (they would repeat every 48 px as a dot grid):
    the hottest pixels (and bluish-hot ones) are filled from their surroundings."""
    L = T.lum(a)
    o = T.to_opp(a)
    bluish = o[..., 2] < np.percentile(o[..., 2], 20)
    hot = (L > np.percentile(L, hi)) | ((L > np.percentile(L, hi_blue)) & bluish)
    m = T.gauss(hot.astype(float), 1.0) > 0.08
    known = (~m).astype(float)
    num = T.gauss(a * known[..., None], 2.0)
    den = T.gauss(known, 2.0)[..., None]
    return np.where(m[..., None], num / np.maximum(den, 1e-6), a)


def despeckle(a, thr=14.0, sigma=2.0, grow=1.0):
    """Fill the specks (pixels more than 'thr' luma off their blurred surroundings, light or dark -
    generated pebbles, glints) from around them: they would form a dot grid when the tile repeats."""
    L = T.lum(a)
    m = np.abs(L - T.gauss(L, sigma)) > thr
    m = T.gauss(m.astype(float), grow) > 0.08
    known = (~m).astype(float)
    num = T.gauss(a * known[..., None], 2.0)
    den = T.gauss(known, 2.0)[..., None]
    return np.where(m[..., None], num / np.maximum(den, 1e-6), a)


def pixellab(file, how="down", box=None, deglint_it=False, size=48, despeckle_thr=0.0):
    """A saved PixelLab image (path relative to tools/tiles/soft/src) -> a soft 48x48 periodic tile.
    how: 'down' - the S1 finding: generate BIG (96-256 px), BOX down to 96 and Lanczos to 48, the
          2-3 px pixel grid melts into gradients;
         'crop' - cut 'box' (x0, y0, x1, y1) out of it first (then as 'down');
         'tile' - it is already a 48x48 tile.
    A tile that does not join itself is made periodic with a variance-keeping 4-copy blend."""
    rgba = T.load_rgba(P.src_path(file))
    if box:
        x0, y0, x1, y1 = box
        rgba = rgba[y0:y1, x0:x1]
    a = fill_holes(rgba)
    if how != "tile" and a.shape[0] != size:
        a = T.downscale_pixelart(a, size) if a.shape[0] > size else T.resample(a, size / a.shape[0])
    if T.seam_error(a) > 1.3:
        a = T.seamless4(a)
    if deglint_it:
        a = deglint(a)
    if despeckle_thr:
        a = despeckle(a, despeckle_thr)
    return a


def load_source(spec):
    """One named source of a recipe: {"winlu": kind | [kinds], "sheet": .., "over": ..} or
    {"pixellab": file, "how": .., "box": .., "deglint": true, "despeckle": 14} or {"file": a 48x48 png}; then the
    optional recolour knobs (see recolour())."""
    if "winlu" in spec:
        a = winlu(spec["winlu"], spec.get("sheet"), spec.get("over"))
    elif "pixellab" in spec:
        a = pixellab(spec["pixellab"], spec.get("how", "down"), spec.get("box"), spec.get("deglint", False),
                     despeckle_thr=float(spec.get("despeckle", 0.0)))
    elif "file" in spec:
        a = T.load_rgb(P.src_path(spec["file"]))
    else:
        raise ValueError("source needs 'winlu', 'pixellab' or 'file': %s" % spec)
    if spec.get("rot"):
        a = np.rot90(a, int(spec["rot"]), (0, 1)).copy()
    if spec.get("shift"):
        a = T.roll(a, int(spec["shift"][1]), int(spec["shift"][0]))
    return recolour(a, **{k: v for k, v in spec.items() if k in RECOLOUR_KEYS})


RECOLOUR_KEYS = ("hsv", "mean", "std_mul", "smooth", "detail", "detail_sigma", "flatten")


def recolour(a, hsv=None, mean=None, std_mul=1.0, smooth=0.0, detail=0.0, detail_sigma=1.2, flatten=None):
    """Keep the brush pattern, move the colour:
    hsv [dh, s_mul, v_mul] - hue turn (0..1 of the circle), saturation and value factors;
    mean [r, g, b] - the new mean colour; std_mul - scales the deviations;
    smooth - periodic blur (px); detail - adds back that much of the high-pass (sigma detail_sigma)
    of the ORIGINAL luma (keeps its grain after a blur); flatten [sigma, keep] - damps the slow
    variation (blotches that would show as a 48 px grid) to 'keep' of it."""
    L0 = T.lum(a)
    if hsv:
        a = T.hsv_shift(a, dh=hsv[0], s_mul=hsv[1], v_mul=hsv[2])
    if mean is not None:
        a = T.set_mean(a, mean, std_mul)
    elif std_mul != 1.0:
        a = T.set_mean(a, a.reshape(-1, 3).mean(0), std_mul)
    if smooth:
        a = T.gauss(a, smooth)
    if detail:
        a = a + (L0 - T.gauss(L0, detail_sigma))[..., None] * detail
    if flatten:
        s, keep = flatten
        m = a.reshape(-1, 3).mean(0)
        a = a - (1 - keep) * (T.gauss(a, s) - m)
    return a


def combine(parts, sources):
    """Weighted mix of sources around their means ([[name, weight], ...]); the variance is kept
    (divided by the root of the summed squared weights), so a mix is not greyer than its parts."""
    if isinstance(parts, str):
        return sources[parts].copy()
    ws = np.array([float(p[1]) for p in parts])
    ws = ws / ws.sum()
    mean = sum(w * sources[p[0]].reshape(-1, 3).mean(0) for w, p in zip(ws, parts))
    acc = sum(w * (sources[p[0]] - sources[p[0]].reshape(-1, 3).mean(0)) for w, p in zip(ws, parts))
    return acc / np.sqrt((ws ** 2).sum()) + mean


# ------------------------------------------------------------------ mask blends (e.g. moss on litter)
def noise_mask(sigma=1.9, warp=1.2, seed=6, lo=0.3, hi=0.66, fine=0.25, fine_sigma=1.1):
    """Soft organic 0..1 mask on the 48 torus: domain-warped blurred noise (+ a finer one), smoothstep."""
    n = (1 - fine) * T.warped_noise(48, sigma, seed, warp, 4.0) + fine * T.blur_noise(48, fine_sigma, seed + 7)
    return T.smoothstep(lo, hi, n)


def blend(a, b, mask, lit=0.0, lit_rgb=(112, 134, 80), shade=0.0):
    """b over a through the mask; b's patches can be lit on their up-left side and shaded low-right
    (cushions of moss standing out of the litter)."""
    m = mask[..., None]
    out = a * (1 - m) + b * m
    if lit:
        l = T.gauss(np.clip(mask - T.roll(mask, 1, 1), 0, 1), 0.7)
        out = out + (np.array(lit_rgb, float) - out) * (lit * l)[..., None]
    if shade:
        s = T.gauss(np.clip(mask - T.roll(mask, -1, -1), 0, 1), 0.7)
        out = out * (1 - shade * s)[..., None]
    return out


# ------------------------------------------------------------------ strokes (anti-aliased, wrapped)
SS = 4


class Strokes:
    """RGBA strokes on the 48x48 torus, drawn 4x supersampled and box-filtered down (anti-aliased).
    Everything is drawn 9 times (shifted by the period), so strokes that cross a side come back on
    the other side and the tile stays seamless."""

    def __init__(self, n=48):
        self.n, self.S = n, n * SS
        self.im = Image.new("RGBA", (self.S, self.S), (0, 0, 0, 0))
        self.dr = ImageDraw.Draw(self.im)

    def line(self, pts, rgba, width):
        S = self.S
        col = tuple(int(round(c)) for c in rgba)
        for ox in (-S, 0, S):
            for oy in (-S, 0, S):
                p = [(x * SS + ox, y * SS + oy) for x, y in pts]
                self.dr.line(p, fill=col, width=max(1, int(round(width * SS))), joint="curve")
                r = width * SS / 2.0
                for (x, y) in (p[0], p[-1]):
                    self.dr.ellipse((x - r, y - r, x + r, y + r), fill=col)

    def dot(self, x, y, r, rgba, ry=None):
        S = self.S
        col = tuple(int(round(c)) for c in rgba)
        ry = r if ry is None else ry
        for ox in (-S, 0, S):
            for oy in (-S, 0, S):
                cx, cy = x * SS + ox, y * SS + oy
                self.dr.ellipse((cx - r * SS, cy - ry * SS, cx + r * SS, cy + ry * SS), fill=col)

    def array(self):
        small = self.im.convert("RGBa").resize((self.n, self.n), Image.BOX).convert("RGBA")
        return np.asarray(small).astype(np.float64)


def over_strokes(tex, layer, soft=0.0):
    """Composite a Strokes array over the texture; soft = premultiplied periodic blur (px)."""
    a = layer[..., 3:4] / 255.0
    pm = np.concatenate([layer[..., :3] * a, a], -1)
    if soft > 0:
        pm = T.gauss(pm, soft)
    al = np.clip(pm[..., 3:4], 0, 1)
    return tex * (1 - al) + pm[..., :3], al[..., 0]


def _pick(rs, cols):
    return np.array(cols[rs.randint(len(cols))], float)


def draw_strokes(tex, spec, mask=None):
    """Strokes of a recipe: {"type": "needles" | "twigs" | "pebbles" | "specks", "n": count, "seed": ..,
    "colours": [[r,g,b],...], "len": [min,max], "width": [min,max], "alpha": 0..255, "shadow": 0..255,
    "avoid_mask": 0..1 (fewer where the blend mask is high), "on_mask": .. (only where it is high),
    "soft": premultiplied blur}. Returns (texture, coverage)."""
    rs = np.random.RandomState(int(spec.get("seed", 5)))
    kind = spec.get("type", "needles")
    n = int(spec.get("n", 40))
    cols = spec.get("colours") or {"needles": [[128, 90, 60], [118, 82, 54], [138, 102, 68], [108, 76, 52]],
                                   "twigs": [[84, 62, 46]], "pebbles": [[150, 140, 120]],
                                   "specks": [[118, 142, 84]]}[kind]
    alpha = float(spec.get("alpha", 235))
    shadow = float(spec.get("shadow", 55))
    sh, fg = Strokes(), Strokes()
    placed = tries = 0
    while placed < n and tries < 20000:
        tries += 1
        x, y = rs.uniform(0, 48, 2)
        if mask is not None:
            mv = mask[int(y) % 48, int(x) % 48]
            if "avoid_mask" in spec and rs.rand() < float(spec["avoid_mask"]) * mv:
                continue
            if "on_mask" in spec and mv < float(spec["on_mask"]):
                continue
        col = _pick(rs, cols) * rs.uniform(0.92, 1.08)
        if kind in ("needles", "twigs"):
            lo, hi = spec.get("len", [2.5, 5.0] if kind == "needles" else [7, 10])
            wlo, whi = spec.get("width", [0.7, 0.95] if kind == "needles" else [1.2, 1.5])
            ang = rs.uniform(0, np.pi)
            ln = rs.uniform(lo, hi)
            dx, dy = np.cos(ang) * ln / 2, np.sin(ang) * ln / 2
            bend = rs.uniform(-0.5, 0.5)
            pts = [(x - dx, y - dy), (x + bend * dy * 0.3, y - bend * dx * 0.3), (x + dx, y + dy)]
            w = rs.uniform(wlo, whi)
            sh.line([(px + 0.5, py + 0.8) for px, py in pts], (26, 30, 20, shadow), w * 1.1)
            fg.line(pts, (*col, alpha), w)
            if kind == "twigs":
                bt = rs.uniform(0.3, 0.7)
                bx, by = x - dx + 2 * dx * bt, y - dy + 2 * dy * bt
                ba = ang + rs.choice([-1, 1]) * rs.uniform(0.5, 0.9)
                bp = [(bx, by), (bx + np.cos(ba) * ln * 0.35, by + np.sin(ba) * ln * 0.35)]
                sh.line([(px + 0.6, py + 0.9) for px, py in bp], (22, 26, 18, shadow), w * 0.8)
                fg.line(bp, (*col, alpha), w * 0.75)
                fg.line([(px - 0.3, py - 0.35) for px, py in pts], (*(col * 1.4), alpha * 0.8), w * 0.4)
        elif kind == "pebbles":
            rlo, rhi = spec.get("size", [0.8, 1.4])
            r = rs.uniform(rlo, rhi)
            ry = r * rs.uniform(0.7, 0.95)
            sh.dot(x + 0.5, y + 0.7, r * 1.05, (30, 26, 20, shadow), ry * 1.05)
            fg.dot(x, y, r, (*col, alpha), ry)
            # light on the up-left, shade low-right: a small lit cap
            fg.dot(x - r * 0.3, y - ry * 0.35, r * 0.55, (*np.clip(col * 1.22, 0, 255), alpha * 0.8), ry * 0.5)
        else:   # specks: tiny soft dots
            rlo, rhi = spec.get("size", [0.45, 0.8])
            fg.dot(x, y, rs.uniform(rlo, rhi), (*col, alpha))
        placed += 1
    tex, _ = over_strokes(tex, sh.array(), soft=float(spec.get("shadow_soft", 0.3)))
    return over_strokes(tex, fg.array(), soft=float(spec.get("soft", 0.35)))


# ------------------------------------------------------------------ the Winlu finish
def reference(ref):
    """A Winlu reference ground by name: 'k26' (inner cell of kind 26), 'k46/k16' (overlay 46 over
    grass 16), 'red:k16' (kind 16 of the red edition), ..."""
    sheet = None
    if ":" in ref:
        sheet, ref = ref.split(":", 1)
    if "/" in ref:
        k, over = ref.split("/")
        return mz.winlu_body(int(k.lstrip("k")), P.sheet_path(sheet), int(over.lstrip("k")))
    return mz.winlu_body(int(ref.lstrip("k")), P.sheet_path(sheet))


def finish(a, ref="k24", boost=None, grain="", grain_w=None, chroma_blur=0.6, chroma_spread=1.0,
           mean=None, chroma_ref=None, chroma_flatten=None):
    """Band matching (S3): luma split into 6 scale bands (<0.7, 0.7-1.5, 1.5-3, 3-6, 6-12, >12 px);
    band i gets the std of the Winlu reference's band i x boost[i]; Winlu's own brush grain (the
    'grain' reference, same bands) is mixed into band i at weight grain_w[i] first. The chroma is
    blurred a little and its spread set to chroma_spread x the reference's; the mean colour -> mean.
    chroma_flatten [sigma, keep]: keep only that share of the colour variation slower than sigma px
    (big green / brown patches repeat as a 48 px motif; fine flecks do not)."""
    R = reference(ref)
    G = reference(grain) if grain else R
    o = T.to_opp(a)
    L2 = T.band_match(o[..., 0], T.band_std(T.lum(R)), boost=boost, extra=T.bands(T.lum(G)), extra_w=grain_w)
    ch = T.gauss(o[..., 1:], chroma_blur) if chroma_blur else o[..., 1:]
    if chroma_flatten:
        s, keep = chroma_flatten
        cm = ch.reshape(-1, 2).mean(0)
        ch = ch - (1 - keep) * (T.gauss(ch, s) - cm)
    CR = reference(chroma_ref) if chroma_ref else R
    rs = T.to_opp(CR).reshape(-1, 3).std(0)
    cs = ch.reshape(-1, 2).std(0)
    ch = (ch - ch.reshape(-1, 2).mean(0)) / (cs + 1e-6) * rs[1:] * chroma_spread
    tm = T.to_opp(np.array(mean if mean is not None else a.reshape(-1, 3).mean(0), float).reshape(1, 1, 3)).reshape(3)
    o2 = np.concatenate([(L2 - L2.mean() + tm[0])[..., None], ch + tm[1:]], -1)
    return T.from_opp(o2)


# ------------------------------------------------------------------ wet look
def gloss(a, amount=1.0, relief_sigma=1.2, lo=0.35, colour=(168, 172, 170), sheen=0.0, sheen_sigma=3.0,
          seed=3, shade=0.12, sparkle=0.0, sparkle_n=0, sparkle_rgb=(226, 230, 226), hollows=0.0,
          hollow_sigma=2.5, hollow_rgb=(58, 50, 44)):
    """Wet sheen from the texture's OWN relief (its luma, blurred relief_sigma px): the up-left facets
    of the lumps catch a cool highlight (smoothstep from 'lo' of the steepest slope), the low-right
    ones darken ('shade'); 'sheen' adds broad, very soft cool reflections (warped noise); sparkles:
    sparkle_n tiny bright points on the highest facets (kept small - they repeat every 48 px);
    hollows: the low parts of the relief (blur hollow_sigma) pulled toward hollow_rgb (wet, dark)."""
    L = T.lum(a)
    if hollows:
        # wet hollows: the low parts of the relief (at hollow_sigma) darker and a little cooler
        low = T.gauss(L, hollow_sigma)
        low = (low.mean() - low) / max(1e-6, low.std())
        w = np.clip(T.smoothstep(0.2, 1.8, low) * hollows, 0, 0.6)
        a = a + (np.array(hollow_rgb, float) - a) * w[..., None]
        L = T.lum(a)
    H = T.gauss(L, relief_sigma)
    gx = (T.roll(H, 0, -1) - T.roll(H, 0, 1)) * 0.5
    gy = (T.roll(H, -1, 0) - T.roll(H, 1, 0)) * 0.5
    f = (gx + gy)
    f = f / max(1e-6, np.percentile(np.abs(f), 98))
    hl = T.gauss(T.smoothstep(lo, 1.0, f), 0.5)
    sd = T.gauss(T.smoothstep(lo, 1.0, -f), 0.6)
    col = np.array(colour, float)
    out = a * (1 - shade * amount * sd)[..., None]
    out = out + (col - out) * np.clip(0.45 * amount * hl, 0, 0.8)[..., None]
    if sheen:
        n = T.warped_noise(48, sheen_sigma, seed, 2.5, 3.0)
        s = T.gauss(T.smoothstep(0.7, 0.97, n), 0.9)
        out = out + (col - out) * np.clip(sheen * 0.5 * s, 0, 0.6)[..., None]
    if sparkle and sparkle_n:
        idx = np.argsort((f * hl).ravel())[::-1]
        taken = []
        st = Strokes()
        for i in idx:
            y, x = divmod(int(i), 48)
            if any(min(abs(x - tx), 48 - abs(x - tx)) < 11 and min(abs(y - ty), 48 - abs(y - ty)) < 11 for tx, ty in taken):
                continue
            taken.append((x, y))
            st.dot(x + 0.5, y + 0.5, 0.55, (*sparkle_rgb, 255 * sparkle), 0.45)
            if len(taken) >= sparkle_n:
                break
        out, _ = over_strokes(out, st.array(), soft=0.35)
    return out


def grain(a, amount=1.0, seed=9):
    """Faint 1-px luma grain (keeps flat areas from banding)."""
    n = np.random.RandomState(seed).normal(0, 1, a.shape[:2])
    n = n - T.gauss(n, 1.0)
    return a + (n * amount)[..., None]


# ------------------------------------------------------------------ the recipe's texture section
def build_texture(r):
    """r = recipe["texture"]; returns (texture 48x48x3, extras) - extras: 'mask' (the blend mask),
    'cover' (stroke coverage, for needles spilling past the edge), 'edge_tex' (optional texture
    blended in toward the overlay's fade)."""
    sources = {name: load_source(spec) for name, spec in r["sources"].items()}
    a = combine(r.get("base", list(r["sources"])[0]), sources)
    if r.get("recolour"):
        a = recolour(a, **r["recolour"])
    extras = {"mask": None, "cover": None}
    for b in r.get("blend", []):
        m = noise_mask(**b.get("mask", {}))
        extras["mask"] = m
        a = blend(a, sources[b["source"]], m, b.get("lit", 0.0), b.get("lit_rgb", (112, 134, 80)), b.get("shade", 0.0))
    cover = np.zeros((48, 48))
    for s in r.get("strokes", []):
        if s.get("stage", "before") == "before":
            a, c = draw_strokes(a, s, extras["mask"])
            if s.get("spill"):
                cover = np.maximum(cover, c * float(s["spill"]))
    if r.get("finish"):
        a = finish(a, **r["finish"])
    if r.get("gloss"):
        a = gloss(a, **r["gloss"])
    for s in r.get("strokes", []):
        if s.get("stage") == "after":
            a, c = draw_strokes(a, s, extras["mask"])
            if s.get("spill"):
                cover = np.maximum(cover, c * float(s["spill"]))
    if r.get("grain"):
        a = grain(a, **r["grain"]) if isinstance(r["grain"], dict) else grain(a, float(r["grain"]))
    extras["cover"] = cover if cover.max() > 0 else None
    return np.clip(a, 0, 255), extras
