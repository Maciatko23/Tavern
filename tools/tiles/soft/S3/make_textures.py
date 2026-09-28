"""S3 step 2: PixelLab textures -> soft, seamless 48x48 Winlu-like ground tiles.

  python make_textures.py <scratch dir>      (reads <scratch>/gen/*, writes <scratch>/tex/*)

Candidates (see CANDS): each takes a PixelLab image, cuts / scales it to 48x48, fills holes, makes it
periodic, then the softening pass:
  1. work at 2x (periodic Lanczos up), edge-preserving smoothing (bilateral) + Kuwahara (paint strokes),
     back to 1x with a box filter  -> no hard pixel steps, many in-between colours
  2. blend with a light periodic Gaussian (the rest of the pixel grid melts)
  3. high-pass the slow variation (big blotches would show as a 48 px grid when the tile repeats)
  4. colour: opponent-space mean/std moved to a target built from Winlu's own grounds
  5. fine grain (blurred noise) so flat areas never band, and the colour count goes up like Winlu's
Writes tex/<name>.png (48x48), tex/<name>_raw.png (the PixelLab 48 before softening, same colours
target, for the comparison) and tex/preview_<name>.png (3x3 tiled x3 between Winlu grass cells).
"""
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import softlib as S
from refs import block

SCR = sys.argv[1] if len(sys.argv) > 1 else "."
GEN = os.path.join(SCR, "gen")
OUT = os.path.join(SCR, "tex")
os.makedirs(OUT, exist_ok=True)


def centre(k):
    return np.asarray(block(k).crop((24, 72, 72, 120)).convert("RGBA")).astype(np.float64)


GRASS = centre(16)[..., :3]
DIRT = centre(24)[..., :3]
DARKDIRT = centre(26)[..., :3]
_d = Image.fromarray(centre(16).astype(np.uint8)); _d.alpha_composite(Image.fromarray(centre(46).astype(np.uint8)))
DARK = np.asarray(_d.convert("RGB")).astype(np.float64)


def fill_holes(rgba, iters=60):
    """Transparent pixels (PixelLab's style-mode tiles have a few) get the blurred colour around them."""
    a = rgba[..., :3].copy()
    m = (rgba[..., 3] > 128).astype(np.float64)
    if m.min() > 0:
        return a
    known = m.copy()
    cur = a * m[..., None]
    for _ in range(iters):
        num = S.gauss_wrap(cur, 1.0)
        den = S.gauss_wrap(known, 1.0)
        est = num / np.maximum(den, 1e-6)[..., None]
        cur = np.where(m[..., None] > 0, a, est)
        known = np.maximum(m, np.minimum(1, den * 4))
        cur = cur * np.maximum(m, known)[..., None]
    return np.where(m[..., None] > 0, a, est)


def soften(a, bil=(2, 1.4, 22.0), kuw=1, gauss=0.8, mix=0.55, hp=(9.0, 0.35), up=2):
    """The softening pass (steps 1-3 above)."""
    x = S.resample_wrap(a, up) if up != 1 else a.copy()
    if bil:
        x = S.bilateral_wrap(x, *bil)
    if kuw:
        x = S.kuwahara_wrap(x, kuw)
        x = S.bilateral_wrap(x, 1, 1.0, 14.0)      # soften the Kuwahara block corners
    if up != 1:
        x = S.resample_wrap(x, 1.0 / up)
    g = S.gauss_wrap(a, gauss)
    x = mix * x + (1 - mix) * g
    if hp:
        x = S.highpass_wrap(x, hp[0], hp[1])
    return x


def target(ref, dark=1.0, warm=0.0, green=0.0, std_mul=1.0, lum_std=None):
    """Opponent-space target built from a Winlu tile: its mean scaled by 'dark' and nudged."""
    m, s = S.opp_stats(ref)
    m = m.copy(); s = s.copy() * std_mul
    m[0] *= dark
    m[1] += warm          # r - g
    m[2] += green         # (r+g)/2 - b
    if lum_std is not None:
        s[0] = lum_std
    return m, s


CANDS = {
    # --- mud (wet, dark brown) ---
    "mudA": dict(src="pf_mud1.png", how="down2", tgt=dict(ref="DARKDIRT", dark=0.80, warm=14, green=4, lum_std=8.0),
                 chroma_mul=1.3, grain=1.6),
    "mudB": dict(src="pf_mud1.png", how="crop", box=(40, 4, 88, 52), tgt=dict(ref="DARKDIRT", dark=0.80, warm=14, green=4, lum_std=8.5),
                 chroma_mul=1.3, grain=1.6),
    "mudC": dict(src="tp1/tile_2.png", how="tile", tgt=dict(ref="DARKDIRT", dark=0.80, warm=14, green=4, lum_std=8.0),
                 chroma_mul=1.3, grain=1.6),
    # --- forest floor (moss + needles) ---
    "forA": dict(src="tp1/tile_9.png", how="tile", tgt=dict(ref="DARK", dark=0.78, warm=0, green=10, lum_std=8.0),
                 chroma_mul=1.5, grain=1.4),
    "forB": dict(src="pf_forest1.png", how="down2", tgt=dict(ref="DARK", dark=0.78, warm=0, green=10, lum_std=8.0),
                 chroma_mul=1.5, grain=1.4),
    "forC": dict(src="tp1/tile_8.png", how="tile", tgt=dict(ref="DARK", dark=0.78, warm=0, green=10, lum_std=8.0),
                 chroma_mul=1.5, grain=1.4),
}
REFS = {"DIRT": DIRT, "DARKDIRT": DARKDIRT, "DARK": DARK, "GRASS": GRASS}


def source48(c):
    rgba = S.load_rgba(os.path.join(GEN, c["src"]))
    if c["how"] == "down2":
        rgb = fill_holes(rgba)
        return S.resample_wrap(S.seamless4(rgb), 0.5), rgb
    if c["how"] == "crop":
        x0, y0, x1, y1 = c["box"]
        rgb = fill_holes(rgba)[y0:y1, x0:x1]
        return rgb, rgb
    rgb = fill_holes(rgba)
    return rgb, rgb


def colour(a, c):
    t = c["tgt"]
    m, s = target(REFS[t["ref"]], t.get("dark", 1), t.get("warm", 0), t.get("green", 0), 1.0, t.get("lum_std"))
    # keep the source's own chroma variation (moss vs needles) but not wilder than chroma_mul x Winlu's
    ms, ss = S.opp_stats(a)
    s = s.copy()
    s[1:] = np.minimum(ss[1:], s[1:] * c.get("chroma_mul", 1.0) * 2.5)
    s[1:] = np.maximum(s[1:], S.opp_stats(REFS[t["ref"]])[1][1:] * c.get("chroma_mul", 1.0))
    return S.match_stats(a, m, s)


def build(name, c, seed=5):
    a48, full = source48(c)
    seamless = S.seamless4(a48) if S.seam_error(a48) > 1.3 else a48
    raw = np.clip(colour(seamless, c), 0, 255)            # colour-matched but NOT softened (for comparison)
    soft = soften(seamless, **c.get("soft", {}))
    soft = colour(soft, c)
    soft = soft + S.grain(soft.shape[:2], c.get("grain", 1.5), seed, 0.6)[..., None] * np.array([1.0, 0.95, 0.85])
    soft = np.clip(soft, 0, 255)
    return a48, raw, soft


def preview(tile, name, Z=3):
    """3x3 of the tile in the middle of a 5x5 Winlu grass field, x3."""
    g = S.to_img(GRASS)
    t = S.to_img(tile)
    im = Image.new("RGB", (240, 240))
    for y in range(5):
        for x in range(5):
            im.paste(t if 1 <= x <= 3 and 1 <= y <= 3 else g, (x * 48, y * 48))
    im.resize((240 * Z, 240 * Z), Image.NEAREST).save(os.path.join(OUT, "preview_%s.png" % name))


def metrics_row(name, a, ref):
    g, sh = S.grad_stats(a)
    gd = S.chi2(S.grad_hist(a), S.grad_hist(ref))
    ch = S.chi2(S.centred_hist3(a), S.centred_hist3(ref))
    return "%-10s colours %4d  meanGrad %5.2f  sharp>12 %.3f  lumStd %5.2f  gradHistChi2 %.3f  centredColourChi2 %.3f  seam %.2f" % (
        name, S.n_colours(a), g, sh, S.lum(a).std(), gd, ch, S.seam_error(a))


if __name__ == "__main__":
    only = sys.argv[2:] or list(CANDS)
    rep = []
    for n in ("GRASS", "DIRT", "DARKDIRT", "DARK"):
        rep.append(metrics_row("winlu_" + n, REFS[n], REFS[n]))
    for name in only:
        c = CANDS[name]
        a48, raw, soft = build(name, c)
        S.to_img(a48).save(os.path.join(OUT, name + "_src48.png"))
        S.to_img(raw).save(os.path.join(OUT, name + "_raw.png"))
        S.to_img(soft).save(os.path.join(OUT, name + ".png"))
        preview(soft, name)
        preview(raw, name + "_raw")
        ref = REFS[c["tgt"]["ref"]]
        rep.append(metrics_row(name + "_raw", raw, ref))
        rep.append(metrics_row(name, soft, ref))
    print("\n".join(rep))
    open(os.path.join(OUT, "metrics.txt"), "w").write("\n".join(rep) + "\n")
