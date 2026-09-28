"""Method S2 of the soft-tile pilot (2026-09-27): paint NEW grounds out of Winlu's own painted textures.

No generations: every pixel starts from a Winlu tile (A2 grass k16/k27, dirt k24) and is transformed:
  * colour transfer in HSV keeps Winlu's brush texture (its per-pixel pattern) but moves the colour;
  * large soft variation from periodic blurred noise (FFT blur with wrap-around = seamless 48x48);
  * mud: glossy wet sheen = soft specular blobs + glints on the up-left facets of Winlu's own dirt
    relief, small puddles with a dark bank shadow, sky reflection and a bright lower rim;
  * forest floor: moss (Winlu grass, darker/olive) mixed with dark litter (Winlu dirt) through soft
    noise, then pine needles and twigs drawn as anti-aliased strokes (4x supersampled, wrapped);
  * overlay edges reuse Winlu's exact soft alpha masks (k39 for mud, k46 for forest floor), with a
    slightly darker rim where the new ground fades into the grass; needles spill a little further.
Every texture is 48-periodic and laid on the block on the 48 grid, so MZ's quarter recombination
(FLOOR_AUTOTILE_TABLE keeps each quarter's parity) never shows a seam.

usage: python build_s2.py [--out SHEET] [--prev DIR]
"""
import argparse, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import *

SS = 4      # supersampling for strokes


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def roll(a, dy, dx):
    return np.roll(np.roll(a, dy, 0), dx, 1)


def hsv_shift(rgb, dh=0.0, s_mul=1.0, s_add=0.0, v_mul=1.0, v_add=0.0):
    hsv = rgb2hsv(np.clip(rgb, 0, 1))
    hsv[..., 0] = (hsv[..., 0] + dh) % 1.0
    hsv[..., 1] = np.clip(hsv[..., 1] * s_mul + s_add, 0, 1)
    hsv[..., 2] = np.clip(hsv[..., 2] * v_mul + v_add, 0, 1)
    return hsv2rgb(hsv)


def match_stats(rgb, mean, std_mul=1.0):
    """Move the texture's per-channel mean to `mean`, scale its deviations (keeps the brush pattern)."""
    m = rgb.reshape(-1, 3).mean(0)
    return np.clip((rgb - m) * std_mul + np.array(mean) / 255.0, 0, 1)


# ----------------------------------------------------------------------------- strokes (wrapped)
class StrokeLayer:
    """RGBA strokes on a 48x48 torus, drawn 4x supersampled and box-filtered down (anti-aliased)."""

    def __init__(self, n=48):
        self.n = n
        self.S = n * SS
        self.im = Image.new("RGBA", (self.S, self.S), (0, 0, 0, 0))
        self.dr = ImageDraw.Draw(self.im)

    def line(self, pts, rgba, width):
        S = self.S
        for ox in (-S, 0, S):
            for oy in (-S, 0, S):
                p = [((x * SS) + ox, (y * SS) + oy) for x, y in pts]
                self.dr.line(p, fill=tuple(int(c) for c in rgba), width=max(1, int(round(width * SS))), joint="curve")
                r = width * SS / 2.0
                for (x, y) in (p[0], p[-1]):   # round caps
                    self.dr.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(c) for c in rgba))

    def dot(self, x, y, r, rgba):
        S = self.S
        for ox in (-S, 0, S):
            for oy in (-S, 0, S):
                cx, cy, rr = x * SS + ox, y * SS + oy, r * SS
                self.dr.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=tuple(int(c) for c in rgba))

    def array(self):
        small = self.im.convert("RGBa").resize((self.n, self.n), Image.BOX).convert("RGBA")
        return np.asarray(small).astype(np.float32) / 255.0


# ----------------------------------------------------------------------------- mud
def composite_strokes(tex, layer_arr, soft=0.0):
    """Composite a StrokeLayer array (straight RGBA) over tex, optionally softened (premultiplied blur)."""
    pm = np.concatenate([layer_arr[..., :3] * layer_arr[..., 3:4], layer_arr[..., 3:4]], -1)
    if soft > 0:
        pm = blur_wrap(pm, soft)
    a = np.clip(pm[..., 3:4], 0, 1)
    return tex * (1 - a) + pm[..., :3], a[..., 0]


def warped_noise(n, sigma, seed, warp=4.0, wsig=5.0):
    """Periodic noise with domain warping: organic, non-round blobs."""
    base = noise_wrap(n, n, sigma, seed)
    wx = (noise_wrap(n, n, wsig, seed + 101) - 0.5) * 2 * warp
    wy = (noise_wrap(n, n, wsig, seed + 202) - 0.5) * 2 * warp
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    sx = (xx + wx) % n; sy = (yy + wy) % n
    x0 = np.floor(sx).astype(int); y0 = np.floor(sy).astype(int)
    fx = sx - x0; fy = sy - y0
    x1 = (x0 + 1) % n; y1 = (y0 + 1) % n
    return (base[y0, x0] * (1 - fx) * (1 - fy) + base[y0, x1] * fx * (1 - fy) +
            base[y1, x0] * (1 - fx) * fy + base[y1, x1] * fx * fy)


PUDDLES = [(13, 31, 5.2, 2.9, 0.2), (36, 12, 2.7, 1.7, -0.45), (41, 40, 1.5, 1.0, 0.3)]


def mud_texture(A2s, seed=11, P=None):
    P = P or {}
    rs = np.random.RandomState(seed)
    dirt = block(A2s, 24)[:48, :48, :3]             # Winlu dirt, 48-periodic
    L = lum(dirt)
    detail = L - blur_wrap(L, 1.6)                  # Winlu's brush strokes / pebbles

    # colour: darker, browner, more saturated dirt; texture pattern kept
    base = hsv_shift(dirt, dh=P.get("dh", -0.035), s_mul=P.get("s_mul", 1.55), v_mul=P.get("v_mul", 0.60))
    base = match_stats(base, P.get("mean", (80, 64, 50)), std_mul=0.9)
    # smooth the brush a little (mud is viscous) and put part of the detail back as soft relief
    base = blur_wrap(base, P.get("smooth", 0.5)) + detail[..., None] * P.get("detail", 0.55)

    # large soft wetness variation (two octaves, low amplitude)
    n1 = 0.6 * warped_noise(48, 4.0, seed + 1) + 0.4 * noise_wrap(48, 48, 2.0, seed + 5)
    wet = smoothstep(0.3, 0.8, n1)
    base = base * (0.95 + 0.08 * (1 - wet))[..., None] - 0.02 * wet[..., None]

    # puddles: shallow water films = soft irregular regions (domain-warped noise), plus optional
    # explicit small ellipses (P["puddles"])
    yy, xx = np.mgrid[0:48, 0:48].astype(np.float32)
    nf = warped_noise(48, P.get("film_sigma", 3.2), seed + P.get("film_seed", 21), warp=P.get("film_warp", 3.5), wsig=4.0)
    pud = smoothstep(P.get("film_lo", 0.66), P.get("film_hi", 0.80), nf) * P.get("film", 0.0)
    wob = noise_wrap(48, 48, 1.5, seed + 2) - 0.5
    for (cx, cy, rx, ry, ang) in P.get("puddles", PUDDLES):
        dx = (xx - cx + 24) % 48 - 24
        dy = (yy - cy + 24) % 48 - 24
        u = (dx * np.cos(ang) + dy * np.sin(ang)) / rx
        v = (-dx * np.sin(ang) + dy * np.cos(ang)) / ry
        d = np.sqrt(u * u + v * v) + wob * 0.55
        pud = np.maximum(pud, smoothstep(1.0, 0.72, d))
    pud = blur_wrap(pud, P.get("pud_soft", 0.6))
    # water painted like Winlu's own swamp water (A1): dark teal-grey, lighter in the middle, darker
    # toward the bank, a thin light waterline, and a dark wet bank ring around it
    around = np.clip(blur_wrap(pud, P.get("ring_w", 1.6)) * 1.8, 0, 1)
    base = base * (1 - P.get("ring", 0.35) * np.clip(around - pud, 0, 1))[..., None]
    base = base * (1 - 0.08 * np.clip(blur_wrap(pud, 4.0) * 3, 0, 1))[..., None]   # wider damp halo
    depth = smoothstep(0.35, 1.0, blur_wrap(pud, P.get("depth_w", 1.1)) * pud)
    w_edge = np.array(P.get("w_edge", (48, 50, 44))) / 255.0
    w_body = np.array(P.get("w_body", (78, 84, 74))) / 255.0
    water = w_edge + (w_body - w_edge) * depth[..., None]
    water = water + detail[..., None] * 0.08
    line = smoothstep(0.15, 0.45, pud) * smoothstep(0.85, 0.55, pud)                 # the waterline
    lower = smoothstep(0.0, 0.5, np.clip(pud - roll(pud, -2, 0), 0, 1) * 2)             # lower inner edge
    line = line * (P.get("line_all", 0.2) + (1 - P.get("line_all", 0.2)) * lower)       # waterline mostly on the far side
    water = water + (np.array(P.get("w_line", (124, 128, 116))) / 255.0 - water) * (P.get("line_a", 0.6) * line)[..., None]
    top_sh = blur_wrap(np.clip(pud - roll(pud, 2, 1), 0, 1), 0.4)
    water = water * (1 - P.get("top_sh", 0.45) * top_sh[..., None])
    tex = base * (1 - pud[..., None]) + water * pud[..., None]
    # soft reflection glints: one short light stroke in each bigger puddle
    sl = StrokeLayer()
    for (cx, cy, rx, ry, ang) in P.get("streaks", P.get("puddles", PUDDLES)):
        if rx < 3:
            continue
        a = ang - 0.3
        l = rx * 0.5
        ox, oy = -0.2 * rx, -0.3 * ry
        sl.line([(cx + ox - np.cos(a) * l / 2, cy + oy - np.sin(a) * l / 2), (cx + ox + np.cos(a) * l / 2, cy + oy + np.sin(a) * l / 2)],
                (196, 212, 206, P.get("streak_a", 150)), 0.9)
    tex, _ = composite_strokes(tex, sl.array(), soft=0.5)

    # glossy sheen: 1) broad soft specular blobs on the wet parts
    n3 = warped_noise(48, 2.0, seed + 3, warp=2.5, wsig=3.0)
    blob = smoothstep(0.74, 0.95, n3) * (1 - pud) * (0.35 + 0.65 * wet)
    blob = blur_wrap(blob, 0.9)
    # 2) glints on the up-left facets of Winlu's own dirt relief (its pebbles become wet lumps)
    H = blur_wrap(L, P.get("relief_sigma", 1.6))
    gx = (roll(H, 0, -1) - roll(H, 0, 1)) * 0.5
    gy = (roll(H, -1, 0) - roll(H, 1, 0)) * 0.5
    facing = (gx + gy) / max(1e-6, np.percentile(np.abs(gx + gy), 98))
    glint = smoothstep(P.get("glint_lo", 0.30), 1.0, facing) * (1 - pud) * (0.35 + 0.65 * wet)
    glint = blur_wrap(glint, P.get("glint_soft", 0.7))
    shade = smoothstep(0.40, 1.0, -facing) * (1 - pud)                       # the lumps' low-right side
    tex = tex * (1 - P.get("lump_shade", 0.15) * blur_wrap(shade, 0.7))[..., None]
    spec = np.array(P.get("spec", (150, 154, 146))) / 255.0
    k = np.clip(P.get("blob", 0.50) * blob + P.get("glint", 0.45) * glint, 0, 0.8)
    tex = tex + (spec - tex) * k[..., None]
    # tiny puddle glints: soft bright specks in the low spots of the relief, with a cool wet halo
    sl = StrokeLayer()
    halo = StrokeLayer()
    low = blur_wrap(L, 1.5)
    cand = np.argsort(low.ravel())
    taken = []
    for idx in cand:
        if len(taken) >= P.get("specks", 0):
            break
        y, x = divmod(int(idx), 48)
        if any(min(abs(x - tx) % 48, 48 - abs(x - tx) % 48) < 12 and min(abs(y - ty) % 48, 48 - abs(y - ty) % 48) < 12 for tx, ty in taken):
            continue
        taken.append((x, y))
        halo.dot(x + 0.5, y + 0.5, rs.uniform(1.4, 2.2), (70, 72, 70, P.get("halo_a", 90)))
        sl.dot(x + 0.3, y + 0.3, rs.uniform(0.40, 0.55), (230, 232, 224, P.get("speck_a", 200)))
    tex, _ = composite_strokes(tex, halo.array(), soft=0.8)
    tex, _ = composite_strokes(tex, sl.array(), soft=0.3)
    return np.clip(tex, 0, 1), pud


# ----------------------------------------------------------------------------- forest floor
# needle / twig colours: Winlu's own browns (log bark, stump top, pine trunk) lifted a little
NEEDLE_COLS = [(128, 90, 60), (118, 82, 54), (138, 102, 68), (108, 76, 52), (146, 112, 76)]
GREEN_NEEDLE = [(56, 96, 74), (64, 104, 78)]


def forest_texture(A2s, seed=5, P=None):
    P = P or {}
    rs = np.random.RandomState(seed)
    grass = block(A2s, 16)[:48, :48, :3]
    grass2 = block(A2s, 27)[:48, :48, :3]
    dirt = block(A2s, 24)[:48, :48, :3]
    g = 0.5 * grass + 0.5 * roll(grass2, 13, 29)

    # moss = Winlu grass, darker, less blue (olive), finer brush; litter = Winlu dirt, darker, browner
    moss = hsv_shift(g, dh=P.get("moss_dh", -0.05), s_mul=0.75, v_mul=0.74)
    moss = match_stats(moss, P.get("moss_mean", (66, 94, 62)), std_mul=0.9)
    moss = blur_wrap(moss, 0.5) + (lum(g) - blur_wrap(lum(g), 1.2))[..., None] * 0.7
    litter = hsv_shift(dirt, dh=-0.03, s_mul=1.3, v_mul=0.72)
    litter = match_stats(litter, P.get("litter_mean", (84, 76, 56)), std_mul=1.0)

    n = 0.75 * warped_noise(48, P.get("m_sigma", 1.9), seed + 1, warp=1.2, wsig=4.0) + 0.25 * noise_wrap(48, 48, 1.1, seed + 7)
    m = smoothstep(P.get("m_lo", 0.28), P.get("m_hi", 0.66), n)             # 1 = moss
    if "m_force" in P:
        m = np.maximum(m, P["m_force"] * np.ones_like(m) * 0.85)
    tex = litter * (1 - m[..., None]) + moss * m[..., None]
    n2 = noise_wrap(48, 48, 2.0, seed + 2)
    tex = tex * (0.95 + 0.08 * n2)[..., None]
    # moss cushions lit from the up-left: soft light on their up-left side, soft shade low-right
    lit = np.clip(m - roll(m, 1, 1), 0, 1)
    shade = np.clip(m - roll(m, -1, -1), 0, 1)
    tex = tex + (np.array([112, 134, 80]) / 255.0 - tex) * (P.get("moss_lit", 0.22) * blur_wrap(lit, 0.7))[..., None]
    tex = tex * (1 - P.get("moss_shade", 0.10) * blur_wrap(shade, 0.7))[..., None]

    # strokes: shadows first, then needles, twigs on top
    sh = StrokeLayer()
    ne = StrokeLayer()
    count = P.get("needles", 50)
    placed = tries = 0
    while placed < count and tries < 4000:
        tries += 1
        x, y = rs.uniform(0, 48, 2)
        if rs.rand() < 0.7 * m[int(y) % 48, int(x) % 48]:      # fewer needles on thick moss
            continue
        a = rs.uniform(0, np.pi)
        ln = rs.uniform(2.5, 5.0)
        dx, dy = np.cos(a) * ln / 2, np.sin(a) * ln / 2
        bend = rs.uniform(-0.5, 0.5)
        pts = [(x - dx, y - dy), (x + bend * dy * 0.3, y - bend * dx * 0.3), (x + dx, y + dy)]
        col = NEEDLE_COLS[rs.randint(len(NEEDLE_COLS))] if rs.rand() > 0.15 else GREEN_NEEDLE[rs.randint(2)]
        w = rs.uniform(0.7, 0.95)
        sh.line([(px + 0.5, py + 0.8) for px, py in pts], (26, 30, 20, P.get("needle_shadow", 55)), w * 1.1)
        ne.line(pts, (*col, P.get("needle_alpha", 235)), w)
        placed += 1
    for _ in range(P.get("twigs", 1)):
        x, y = rs.uniform(0, 48, 2)
        a = rs.uniform(0, np.pi)
        ln = rs.uniform(7, 10)
        dx, dy = np.cos(a) * ln / 2, np.sin(a) * ln / 2
        mid = (x + rs.uniform(-0.7, 0.7), y + rs.uniform(-0.7, 0.7))
        pts = [(x - dx, y - dy), mid, (x + dx, y + dy)]
        br_t = rs.uniform(0.3, 0.7)
        bx, by = x - dx + 2 * dx * br_t, y - dy + 2 * dy * br_t
        ba = a + rs.choice([-1, 1]) * rs.uniform(0.5, 0.9)
        bpts = [(bx, by), (bx + np.cos(ba) * 3.0, by + np.sin(ba) * 3.0)]
        for p in (pts, bpts):
            sh.line([(px + 0.7, py + 1.0) for px, py in p], (22, 26, 18, 80), 1.8)
        ne.line(pts, (84, 62, 46, 235), 1.5)
        ne.line(bpts, (84, 62, 46, 235), 1.1)
        ne.line([(px - 0.3, py - 0.35) for px, py in pts], (128, 102, 76, 200), 0.6)
    for _ in range(P.get("specks", 8)):              # tiny lighter moss tips
        x, y = rs.uniform(0, 48, 2)
        if m[int(y) % 48, int(x) % 48] < 0.5:
            continue
        ne.dot(x, y, rs.uniform(0.45, 0.8), (118, 142, 84, 150))

    tex, _ = composite_strokes(tex, sh.array(), soft=0.3)
    arr = ne.array()
    tex, cov = composite_strokes(tex, arr, soft=P.get("soft", 0.35))
    return np.clip(tex, 0, 1), cov


# ----------------------------------------------------------------------------- blocks
def tiled_block(tex):
    """A 96x144 block laid with the 48-periodic texture on the 48 grid."""
    return np.tile(tex, (3, 2, 1))


def overlay_block(tex, winlu_block, alpha_gain=1.0, rim_dark=0.12, rim_col=None, spill=None, spill_gate=0.03,
                  edge_tex=None, edge_mix=0.0):
    """Overlay block: new texture on the 48 grid, Winlu's own soft alpha, a darker rim in the fade zone.
    alpha_gain lifts only the inner part of the alpha (so the body is opaque but the outer fade stays
    Winlu's); edge_tex (48-periodic) is blended in toward the outer fade (e.g. moss before the litter);
    spill = stroke coverage that stays visible a bit further out (needles on the grass).
    Everything here is a per-pixel function of Winlu's alpha and of 48-periodic textures, so MZ's
    recombined quarters join exactly as Winlu's do."""
    a0 = winlu_block[..., 3]
    lifted = np.clip(a0 * alpha_gain, 0, 1)
    a = a0 + (lifted - a0) * smoothstep(0.55, 0.9, a0)
    rgb = tiled_block(tex)
    fade = smoothstep(0.98, 0.35, a) * smoothstep(0.0, 0.25, a)            # 0 in the body, 1 in the fade
    if edge_tex is not None and edge_mix > 0:
        f = smoothstep(0.97, 0.45, a) * edge_mix
        rgb = rgb + (tiled_block(edge_tex) - rgb) * f[..., None]
    rc = np.array(rim_col) / 255.0 if rim_col is not None else rgb * 0.55
    rgb = rgb + (rc - rgb) * (rim_dark * fade)[..., None]
    if spill is not None:
        sp = np.tile(spill, (3, 2))
        gate = smoothstep(spill_gate, spill_gate + 0.25, a0)
        a = np.maximum(a, sp * gate * 0.95)
    out = np.concatenate([rgb, a[..., None]], -1)
    out[a <= 0.002] = 0
    return out


def ground_block(tex):
    rgb = tiled_block(tex)
    return np.concatenate([rgb, np.ones_like(rgb[..., :1])], -1)


def build(out_sheet, prev_dir=None, P=None):
    P = P or {}
    A2s = load(A2)
    mud, pud = mud_texture(A2s, P=P.get("mud"))
    forest, needles = forest_texture(A2s, P=P.get("forest"))
    moss_edge, _ = forest_texture(A2s, P=dict(P.get("forest") or {}, m_force=1.0, needles=20, twigs=0))
    blocks = {
        39: overlay_block(mud, block(A2s, 39), alpha_gain=1.0, rim_dark=0.16, rim_col=(40, 34, 26)),
        24: ground_block(mud),
        46: overlay_block(forest, block(A2s, 46), alpha_gain=1 / 0.925, rim_dark=0.06, rim_col=(34, 44, 30), spill=needles,
                          edge_tex=moss_edge, edge_mix=0.75),
    }
    sheet = A2s.copy()
    for k, b in blocks.items():
        put_block(sheet, k, b)
    save(sheet, out_sheet)
    if prev_dir:
        os.makedirs(prev_dir, exist_ok=True)
        save(np.concatenate([mud, np.ones_like(mud[..., :1])], -1), os.path.join(prev_dir, "mud48.png"))
        save(np.concatenate([forest, np.ones_like(forest[..., :1])], -1), os.path.join(prev_dir, "forest48.png"))
        for k, b in blocks.items():
            save(b, os.path.join(prev_dir, "k%d.png" % k))
    return sheet, blocks, mud, forest


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, r"img\tilesets\Soft_S2_A2.png"))
    ap.add_argument("--prev", default=os.path.join(SCR, "blocks"))
    a = ap.parse_args()
    build(a.out, a.prev)
    print("saved", a.out)
