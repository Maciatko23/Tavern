"""S3 measurements: new grounds vs Winlu (per 48x48 tile and per overlay block).
  python metrics.py <scratch>   -> prints a table, writes <scratch>/metrics_final.txt

Per 48x48 texture:
  colours      distinct RGB colours in the tile
  meanGrad     mean |luma step| between neighbouring pixels (periodic)
  sharp>12     share of neighbour steps above 12 luma levels (hard pixel-art edges)
  bands        luma std in 6 scale bands (<0.7 | 0.7-1.5 | 1.5-3 | 3-6 | 6-12 | >12 px) - Winlu keeps its
               contrast in the finest band and almost none in big shapes
  gradChi2     chi-square distance of the neighbour-step histogram to the Winlu analogue (0 = same
               'sharpness profile')
  colChi2      chi-square distance of the colour histogram centred on each tile's own mean (texture
               spread, independent of the base colour) to the Winlu analogue
  absChi2      chi-square distance of the plain 8x8x8 colour histogram (includes the base colour, so the
               mud vs Winlu dirt number is large on purpose: it is darker)
Per block: alpha profile (semi-transparent pixels, fade width) vs Winlu's k39 / k46.
"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import softlib as S
from refs import block

SCR = sys.argv[1]


def centre(k):
    return np.asarray(block(k).crop((24, 72, 72, 120)).convert("RGBA")).astype(np.float64)


GRASS = centre(16)[..., :3]
DIRT = centre(24)[..., :3]
DDIRT = centre(26)[..., :3]
_d = Image.fromarray(centre(16).astype(np.uint8)); _d.alpha_composite(Image.fromarray(centre(46).astype(np.uint8)))
DARK = np.asarray(_d.convert("RGB")).astype(np.float64)


def seam48(path, how):
    rgba = S.load_rgba(path)
    rgb = rgba[..., :3]
    if how == "down2":
        return S.resample_wrap(S.seamless4(rgb), 0.5)
    return rgb


def row(name, a, ref):
    g, sh = S.grad_stats(a)
    b = S.band_std(S.lum(a))
    return ("%-24s %5d %7.2f %8.3f  %s  %7.3f %7.3f %7.3f" % (
        name, S.n_colours(a), g, sh, " ".join("%4.1f" % v for v in b),
        S.chi2(S.grad_hist(a), S.grad_hist(ref)), S.chi2(S.centred_hist3(a), S.centred_hist3(ref)),
        S.chi2(S.hist3(a), S.hist3(ref))))


def alpha_profile(img):
    a = np.asarray(img.convert("RGBA"))[48:144, 0:96, 3].astype(float)
    semi = ((a > 0) & (a < 250)).sum()
    # fade width: along the island's middle row / column, px from alpha 10 to alpha 240
    top = a.max()
    def width(line):                      # from alpha 10 to 94% of the block's own full alpha
        idx_in = np.argmax(line > 0.94 * top); idx_start = np.argmax(line > 10)
        return idx_in - idx_start
    ws = [width(a[48, :]), width(a[48, ::-1]), width(a[:, 48]), width(a[::-1, 48])]
    return semi, np.mean(ws), a[a > 0].mean()


if __name__ == "__main__":
    G, T, A = os.path.join(SCR, "gen"), os.path.join(SCR, "tex"), os.path.join(SCR, "a2")
    lines = ["%-24s %5s %7s %8s  %-29s  %7s %7s %7s" % ("tile (48x48)", "cols", "mGrad", "sharp12", "band std (fine -> coarse)", "gradX2", "colX2", "absX2")]
    lines.append("-- Winlu (references)")
    for n, a, r in (("winlu k16 grass", GRASS, GRASS), ("winlu k24 dirt", DIRT, DIRT), ("winlu k26 dark dirt", DDIRT, DDIRT),
                    ("winlu k46 over grass", DARK, DARK)):
        lines.append(row(n, a, r))
    lines.append("-- mud (vs Winlu k26 dark dirt)")
    lines.append(row("PixelLab tiles_pro #1 raw", S.load_rgba(os.path.join(G, "tp1", "tile_1.png"))[..., :3], DDIRT))
    lines.append(row("PixelLab pro_flash 48 crop", S.load_rgba(os.path.join(G, "pf_mud1.png"))[4:52, 40:88, :3], DDIRT))
    lines.append(row("PixelLab pro_flash raw/2", seam48(os.path.join(G, "pf_mud1.png"), "down2"), DDIRT))
    lines.append(row("S3 mud9 (final)", S.load_rgb(os.path.join(T, "mud9.png")), DDIRT))
    lines.append("-- forest floor (vs Winlu k46 dark grass over grass)")
    lines.append(row("PixelLab tiles_pro #9 raw", S.load_rgba(os.path.join(G, "tp1", "tile_9.png"))[..., :3], DARK))
    lines.append(row("PixelLab pro_flash 48 crop", S.load_rgba(os.path.join(G, "pf_forest1.png"))[24:72, 24:72, :3], DARK))
    lines.append(row("PixelLab pro_flash raw/2", seam48(os.path.join(G, "pf_forest1.png"), "down2"), DARK))
    lines.append(row("S3 for11 (final)", S.load_rgb(os.path.join(T, "for11.png")), DARK))
    lines.append("")
    lines.append("overlay blocks: semi-transparent px in the 96x96 island, mean fade width (alpha 10 -> 94% of full), mean alpha")
    for n, im in (("winlu k39 dirt", block(39)), ("S3 k39 mud", Image.open(os.path.join(A, "k39_w6.png"))),
                  ("winlu k46 dark grass", block(46)), ("S3 k46 forest floor", Image.open(os.path.join(A, "k46_w6.png")))):
        semi, w, ma = alpha_profile(im)
        lines.append("  %-22s semi %5d  fade %4.1f px  mean alpha %5.1f" % (n, semi, w, ma))
    out = "\n".join(lines)
    print(out)
    open(os.path.join(SCR, "metrics_final.txt"), "w").write(out + "\n")
