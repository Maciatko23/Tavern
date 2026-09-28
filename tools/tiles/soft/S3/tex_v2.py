"""S3 step 2, version 2: PixelLab texture -> Winlu-like soft ground by SCALE (band) MATCHING.

Finding from v1 (make_textures.py): blurring makes pixel art blurry, not 'painted'. Winlu's grounds
keep most of their contrast in the finest 1-px grain (band std about 4-5) and almost none in the big
shapes (0.2-0.4) - that is why they look soft and calm and why a 48 px repeat never shows.
PixelLab's tiles have the opposite: flat clusters (no fine grain) and strong 3-20 px shapes.

So per ground:
  1. PixelLab 48x48 (or 96 -> 48), periodic (seamless4)
  2. luma split into 6 scale bands; every band gets Winlu's energy at that scale (x a small boost
     where the new ground needs its own features: needles, lumps, sheen); Winlu's OWN fine brushwork
     (its 0.7-1.5 px bands, same tile place) is mixed into the finest bands, so the grain is Winlu's
  3. chroma: lightly smoothed, spread limited to a few x Winlu's, mean = the target colour
  4. mud only: soft wet sheen on lump tops (cool tint) + a few tiny, low-contrast glints
  python tex_v2.py <scratch> [names...]  -> <scratch>/tex/<name>.png, previews, metrics_v2.txt
"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import softlib as S
from make_textures import REFS, source48, preview, metrics_row, OUT

C2 = {
    "mud2": dict(src="pf_mud1.png", how="down2", ref="DARKDIRT", mean_rgb=(82, 69, 53),
                 boost=[1.0, 1.0, 1.1, 1.1, 0.9, 0.6], extra_w=[0.9, 0.6, 0, 0, 0, 0],
                 chroma_mul=1.3, deglint=True, sheen=0.6, glints=[(9, 30), (33, 12), (40, 41)]),
    "mud3": dict(src="tp1/tile_2.png", how="tile", ref="DARKDIRT", mean_rgb=(82, 69, 53),
                 boost=[1.0, 1.15, 1.5, 1.5, 1.0, 0.8], extra_w=[0.9, 0.6, 0, 0, 0, 0],
                 chroma_mul=1.3, deglint=True, sheen=0.9, glints=[(9, 30), (33, 12), (40, 41)]),
    "mud4": dict(src="pf_mud1.png", how="down2", ref="DARKDIRT", mean_rgb=(92, 80, 61),
                 boost=[1.0, 0.95, 0.9, 0.85, 0.7, 0.5], extra_w=[1.2, 0.9, 0.3, 0, 0, 0],
                 chroma_mul=1.2, deglint=True, sheen=0.5, glints=[(9, 30), (33, 12), (40, 41)]),
    "mud5": dict(src="pf_mud1.png", how="crop", box=(40, 4, 88, 52), ref="DARKDIRT", mean_rgb=(92, 80, 61),
                 boost=[1.0, 0.95, 0.9, 0.85, 0.7, 0.5], extra_w=[1.2, 0.9, 0.3, 0, 0, 0],
                 chroma_mul=1.2, deglint=True, sheen=0.5, glints=[(9, 30), (33, 12), (40, 41)]),
    "for5": dict(src="tp1/tile_9.png", how="tile", ref="DARK", grain_ref="GRASS", mean_rgb=(82, 106, 66),
                 boost=[1.2, 1.4, 1.4, 1.2, 0.9, 0.6], extra_w=[0.7, 0.4, 0, 0, 0, 0], chroma_mul=2.0),
    "mud6": dict(src="tp1/tile_1.png", how="tile", ref="DARKDIRT", mean_rgb=(90, 80, 62),
                 boost=[1.0, 0.9, 0.75, 0.7, 0.6, 0.4], extra_w=[1.2, 0.9, 0.3, 0, 0, 0],
                 chroma_mul=1.1, deglint=True, sheen=0.7, glints=[(9, 30), (33, 12), (40, 41)]),
    "mud7": dict(src="pf_mud1.png", how="down2", ref="DARKDIRT", mean_rgb=(90, 80, 62),
                 boost=[1.0, 0.9, 0.7, 0.6, 0.5, 0.4], extra_w=[1.2, 0.9, 0.3, 0, 0, 0],
                 chroma_mul=1.1, deglint=True, sheen=0.7, glints=[(9, 30), (33, 12), (40, 41)]),
    # smooth + wet: less grain than dry dirt, no glints in the base (they go into the edge slots)
    "mud8": dict(src="tp1/tile_1.png", how="tile", ref="DARKDIRT", mean_rgb=(90, 79, 61),
                 boost=[0.75, 0.75, 0.75, 0.65, 0.5, 0.4], extra_w=[1.0, 0.8, 0.3, 0, 0, 0],
                 chroma_mul=1.1, deglint=True, sheen=0.0, glints=None),
    "mud9": dict(src="pf_mud1.png", how="down2", ref="DARKDIRT", mean_rgb=(90, 79, 61),
                 boost=[0.75, 0.75, 0.7, 0.6, 0.5, 0.4], extra_w=[1.0, 0.8, 0.3, 0, 0, 0],
                 chroma_mul=1.1, deglint=True, sheen=0.0, glints=None),
    "for6": dict(src="tp1/tile_9.png", how="tile", ref="DARK", grain_ref="GRASS", mean_rgb=(72, 98, 60),
                 boost=[1.2, 1.5, 1.5, 1.2, 0.9, 0.6], extra_w=[0.7, 0.4, 0, 0, 0, 0], chroma_mul=2.4),
    "for7": dict(src="tp1/tile_9.png", how="tile", ref="DARK", grain_ref="GRASS", mean_rgb=(72, 98, 60),
                 boost=[1.3, 1.5, 1.2, 0.8, 0.5, 0.4], extra_w=[0.7, 0.4, 0, 0, 0, 0], chroma_mul=2.4),
    "for8": dict(src="pf_forest1.png", how="down2", ref="DARK", grain_ref="GRASS", mean_rgb=(72, 98, 60),
                 boost=[1.2, 1.4, 1.2, 0.8, 0.5, 0.4], extra_w=[0.7, 0.4, 0, 0, 0, 0], chroma_mul=2.0),
    # calm base: the needles only as a faint grain; distinct twigs go into the edge slots (a2_soft --decor)
    "for9": dict(src="pf_forest1.png", how="down2", ref="DARK", grain_ref="GRASS", mean_rgb=(72, 98, 60),
                 boost=[1.2, 1.15, 1.0, 0.7, 0.5, 0.4], extra_w=[0.8, 0.5, 0, 0, 0, 0], chroma_mul=1.3),
    "for10": dict(src="pf_forest1.png", how="down2", ref="DARK", grain_ref="GRASS", mean_rgb=(72, 98, 60),
                  boost=[1.2, 1.25, 1.0, 0.7, 0.5, 0.4], extra_w=[0.8, 0.5, 0, 0, 0, 0], chroma_mul=1.7),
    "for11": dict(src="pf_forest1.png", how="down2", ref="DARK", grain_ref="GRASS", mean_rgb=(78, 108, 66),
                  boost=[1.2, 1.25, 1.0, 0.7, 0.5, 0.4], extra_w=[0.8, 0.5, 0, 0, 0, 0], chroma_mul=1.7),
    "for2": dict(src="tp1/tile_9.png", how="tile", ref="DARK", grain_ref="GRASS", mean_rgb=(74, 102, 60),
                 boost=[1.2, 1.5, 1.6, 1.4, 1.0, 0.8], extra_w=[0.7, 0.4, 0, 0, 0, 0], chroma_mul=2.2),
    "for3": dict(src="pf_forest1.png", how="down2", ref="DARK", grain_ref="GRASS", mean_rgb=(78, 100, 66),
                 boost=[1.2, 1.5, 1.6, 1.4, 1.0, 0.8], extra_w=[0.7, 0.4, 0, 0, 0, 0], chroma_mul=2.2),
    "for4": dict(src="tp1/tile_8.png", how="tile", ref="DARK", grain_ref="GRASS", mean_rgb=(78, 100, 66),
                 boost=[1.2, 1.5, 1.6, 1.4, 1.0, 0.8], extra_w=[0.7, 0.4, 0, 0, 0, 0], chroma_mul=2.2),
}


def deglint(a):
    """Take PixelLab's own bright glints out (they would repeat every 48 px); we paint subtler ones."""
    L = S.lum(a)
    o = S.to_opp(a)
    bluish = o[..., 2] < np.percentile(o[..., 2], 20)
    hot = (L > np.percentile(L, 96)) | ((L > np.percentile(L, 88)) & bluish)
    m = S.gauss_wrap(hot.astype(float), 1.0) > 0.08
    known = (~m).astype(float)
    num = S.gauss_wrap(a * known[..., None], 2.0)
    den = S.gauss_wrap(known, 2.0)[..., None]
    fill = num / np.maximum(den, 1e-6)
    return np.where(m[..., None], fill, a)


def sheen(a, amount, seed=3):
    """Wet look: the tops of the lumps (local luma highs at 2-5 px) get a cool, soft highlight."""
    L = S.lum(a)
    hp = S.gauss_wrap(L, 1.0) - S.gauss_wrap(L, 4.0)
    s = np.clip(hp / (hp.std() + 1e-6) - 0.6, 0, None)
    s = S.gauss_wrap(s, 0.7)
    s = s / (s.max() + 1e-6)
    tint = np.array([150.0, 150.0, 155.0])
    k = (amount * 0.35 * s)[..., None]
    return a * (1 - k) + tint * k


def glint(a, spots, seed=7):
    """Tiny puddle glints: a soft cool oval with a 1-2 px pale core, low contrast (Winlu-calm)."""
    H, W = a.shape[:2]
    Y, X = np.mgrid[0:H, 0:W].astype(float)
    out = a.copy()
    rng = np.random.default_rng(seed)
    for (cx, cy) in spots:
        dx = (X - cx + W / 2) % W - W / 2
        dy = (Y - cy + H / 2) % H - H / 2
        rx, ry = rng.uniform(2.2, 3.2), rng.uniform(1.2, 1.7)
        d = (dx / rx) ** 2 + (dy / ry) ** 2
        pool = np.exp(-d * 1.2)                       # the wet pool: darker, bluish grey
        out = out * (1 - 0.35 * pool[..., None]) + np.array([70, 76, 84]) * 0.35 * pool[..., None]
        core = np.exp(-(((dx + 0.6) / 1.1) ** 2 + ((dy + 0.4) / 0.6) ** 2) * 1.5)
        out = out * (1 - 0.55 * core[..., None]) + np.array([176, 184, 190]) * 0.55 * core[..., None]
    return out


def build2(c, seed=5):
    a48, _ = source48(dict(src=c["src"], how=c["how"], box=c.get("box")))
    a = S.seamless4(a48) if S.seam_error(a48) > 1.3 else a48
    if c.get("deglint"):
        a = deglint(a)
    ref = REFS[c["ref"]]
    gref = REFS[c.get("grain_ref", c["ref"])]
    o = S.to_opp(a)
    Lr = S.lum(ref)
    L2 = S.band_match(o[..., 0], S.band_std(Lr), boost=c["boost"], extra=S.bands(S.lum(gref)), extra_w=c["extra_w"])
    # chroma: smooth a little, spread = chroma_mul x Winlu's (moss/needle hue changes stay visible)
    ch = S.gauss_wrap(o[..., 1:], 0.6)
    rs = S.to_opp(ref).reshape(-1, 3).std(0)
    ch = (ch - ch.reshape(-1, 2).mean(0)) / (ch.reshape(-1, 2).std(0) + 1e-6) * rs[1:] * c["chroma_mul"]
    tm = S.to_opp(np.array(c["mean_rgb"], float).reshape(1, 1, 3)).reshape(3)
    o2 = np.concatenate([(L2 - L2.mean() + tm[0])[..., None], ch + tm[1:]], -1)
    rgb = S.from_opp(o2)
    if c.get("sheen"):
        rgb = sheen(rgb, c["sheen"])
    if c.get("glints"):
        rgb = glint(rgb, c["glints"])
    return a48, np.clip(rgb, 0, 255)


if __name__ == "__main__":
    only = sys.argv[2:] or list(C2)
    rep = []
    for n in ("GRASS", "DIRT", "DARKDIRT", "DARK"):
        rep.append(metrics_row("winlu_" + n, REFS[n], REFS[n]))
    for name in only:
        c = C2[name]
        a48, t = build2(c)
        S.to_img(t).save(os.path.join(OUT, name + ".png"))
        preview(t, name)
        rep.append(metrics_row(name, t, REFS[c["ref"]]))
        rep.append("           bands " + " ".join("%5.2f" % v for v in S.band_std(S.lum(t))) +
                   "   winlu " + " ".join("%5.2f" % v for v in S.band_std(S.lum(REFS[c["ref"]]))))
    print("\n".join(rep))
    open(os.path.join(OUT, "metrics_v2.txt"), "w").write("\n".join(rep) + "\n")
